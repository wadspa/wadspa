/**
 * wadspa_synth — a simple 8-voice polyphonic LV2 synthesizer.
 *
 * Architecture per voice:
 *   MIDI note on/off → ADSR envelope → sawtooth oscillator → one-pole lowpass → mix
 *
 * Ports:
 *   0  MIDI in    (atom:Sequence)
 *   1  Audio out L
 *   2  Audio out R
 *   3  Filter cutoff  (0..1, normalized frequency)
 *   4  Attack  (s)
 *   5  Decay   (s)
 *   6  Sustain (0..1 level)
 *   7  Release (s)
 *   8  Master gain (0..1)
 */

#include <math.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"

#define PLUGIN_URI "https://wadspa.org/plugins/wadspa_synth"
#define NUM_VOICES 8

/* ── Port indices ─────────────────────────────────────────────────────────── */
enum {
    PORT_MIDI_IN  = 0,
    PORT_OUT_L    = 1,
    PORT_OUT_R    = 2,
    PORT_CUTOFF   = 3,
    PORT_ATTACK   = 4,
    PORT_DECAY    = 5,
    PORT_SUSTAIN  = 6,
    PORT_RELEASE  = 7,
    PORT_GAIN     = 8,
};

/* ── ADSR state ───────────────────────────────────────────────────────────── */
typedef enum { ENV_OFF, ENV_ATTACK, ENV_DECAY, ENV_SUSTAIN, ENV_RELEASE } EnvState;

typedef struct {
    int       note;        /* MIDI note number, -1 = free */
    float     phase;       /* sawtooth phase 0..1 */
    float     freq;        /* Hz */
    float     env;         /* current envelope level 0..1 */
    EnvState  env_state;
    float     lp;          /* one-pole lowpass state */
    float     velocity;    /* 0..1 */
} Voice;

typedef struct {
    /* ports */
    const LV2_Atom_Sequence *midi_in;
    float *out_l;
    float *out_r;
    const float *cutoff;
    const float *attack;
    const float *decay;
    const float *sustain;
    const float *release;
    const float *gain;

    double sample_rate;
    LV2_URID midi_event_urid;
    LV2_URID_Map *map;

    Voice voices[NUM_VOICES];
} Synth;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

static float midi_note_to_hz(int note) {
    return 440.0f * powf(2.0f, (note - 69) / 12.0f);
}

static Voice *find_free_voice(Synth *s) {
    for (int i = 0; i < NUM_VOICES; i++)
        if (s->voices[i].note < 0) return &s->voices[i];
    /* steal the oldest releasing voice as fallback */
    for (int i = 0; i < NUM_VOICES; i++)
        if (s->voices[i].env_state == ENV_RELEASE) return &s->voices[i];
    return &s->voices[0];
}

static Voice *find_voice_for_note(Synth *s, int note) {
    for (int i = 0; i < NUM_VOICES; i++)
        if (s->voices[i].note == note && s->voices[i].env_state != ENV_OFF)
            return &s->voices[i];
    return NULL;
}

static void note_on(Synth *s, uint8_t note, uint8_t vel) {
    Voice *v = find_free_voice(s);
    v->note      = note;
    v->freq      = midi_note_to_hz(note);
    v->velocity  = vel / 127.0f;
    v->env_state = ENV_ATTACK;
    v->phase     = 0.0f;
    /* don't reset lp so there's no click */
}

static void note_off(Synth *s, uint8_t note) {
    Voice *v = find_voice_for_note(s, note);
    if (v) v->env_state = ENV_RELEASE;
}

static void all_notes_off(Synth *s) {
    for (int i = 0; i < NUM_VOICES; i++)
        if (s->voices[i].env_state != ENV_OFF)
            s->voices[i].env_state = ENV_RELEASE;
}

/* ── LV2 callbacks ────────────────────────────────────────────────────────── */

static LV2_Handle instantiate(const LV2_Descriptor *descriptor,
                               double sample_rate,
                               const char *bundle_path,
                               const LV2_Feature *const *features) {
    Synth *s = calloc(1, sizeof(Synth));
    s->sample_rate = sample_rate;

    for (const LV2_Feature *const *f = features; *f; f++) {
        if (!strcmp((*f)->URI, LV2_URID__map))
            s->map = (*f)->data;
    }
    if (s->map)
        s->midi_event_urid = s->map->map(s->map->handle, LV2_MIDI__MidiEvent);

    for (int i = 0; i < NUM_VOICES; i++)
        s->voices[i].note = -1;

    return s;
}

static void connect_port(LV2_Handle handle, uint32_t port, void *data) {
    Synth *s = handle;
    switch (port) {
    case PORT_MIDI_IN: s->midi_in = data; break;
    case PORT_OUT_L:   s->out_l   = data; break;
    case PORT_OUT_R:   s->out_r   = data; break;
    case PORT_CUTOFF:  s->cutoff  = data; break;
    case PORT_ATTACK:  s->attack  = data; break;
    case PORT_DECAY:   s->decay   = data; break;
    case PORT_SUSTAIN: s->sustain = data; break;
    case PORT_RELEASE: s->release = data; break;
    case PORT_GAIN:    s->gain    = data; break;
    }
}

static void activate(LV2_Handle handle) {
    Synth *s = handle;
    for (int i = 0; i < NUM_VOICES; i++) {
        s->voices[i].note = -1;
        s->voices[i].env  = 0.0f;
        s->voices[i].lp   = 0.0f;
        s->voices[i].env_state = ENV_OFF;
    }
}

static void run(LV2_Handle handle, uint32_t n_samples) {
    Synth *s = handle;

    /* read MIDI events first */
    if (s->midi_in) {
        LV2_ATOM_SEQUENCE_FOREACH(s->midi_in, ev) {
            if (ev->body.type != s->midi_event_urid) continue;
            const uint8_t *msg = (const uint8_t *)(ev + 1);
            uint8_t status = msg[0] & 0xF0;
            if (status == 0x90 && msg[2] > 0) note_on(s, msg[1], msg[2]);
            else if (status == 0x80 || (status == 0x90 && msg[2] == 0)) note_off(s, msg[1]);
            else if (status == 0xB0 && msg[1] == 123) all_notes_off(s);
        }
    }

    /* synthesis parameters */
    float cutoff  = s->cutoff  ? *s->cutoff  : 0.8f;
    float attack  = s->attack  ? *s->attack  : 0.01f;
    float decay   = s->decay   ? *s->decay   : 0.1f;
    float sustain = s->sustain ? *s->sustain : 0.7f;
    float release = s->release ? *s->release : 0.3f;
    float gain    = s->gain    ? *s->gain    : 0.5f;

    /* one-pole lowpass coefficient from normalised cutoff [0..1] → [20Hz..20kHz] */
    float fc = 20.0f * powf(1000.0f, cutoff) / (float)s->sample_rate;
    fc = fmaxf(0.0001f, fminf(fc, 0.499f));
    float lp_coeff = 1.0f - expf(-2.0f * 3.14159265f * fc);

    /* per-sample rate constants for ADSR */
    float sr     = (float)s->sample_rate;
    float a_rate = (attack  > 0.0001f) ? (1.0f / (attack  * sr)) : 1.0f;
    float d_rate = (decay   > 0.0001f) ? (1.0f / (decay   * sr)) : 1.0f;
    float r_rate = (release > 0.0001f) ? (1.0f / (release * sr)) : 1.0f;

    memset(s->out_l, 0, n_samples * sizeof(float));
    memset(s->out_r, 0, n_samples * sizeof(float));

    for (int vi = 0; vi < NUM_VOICES; vi++) {
        Voice *v = &s->voices[vi];
        if (v->env_state == ENV_OFF) continue;

        float phase  = v->phase;
        float env    = v->env;
        float lp     = v->lp;
        float inc    = v->freq / sr;
        float vel    = v->velocity;

        for (uint32_t i = 0; i < n_samples; i++) {
            /* sawtooth oscillator */
            float saw = (phase * 2.0f - 1.0f);
            phase += inc;
            if (phase >= 1.0f) phase -= 1.0f;

            /* ADSR envelope */
            switch (v->env_state) {
            case ENV_ATTACK:
                env += a_rate;
                if (env >= 1.0f) { env = 1.0f; v->env_state = ENV_DECAY; }
                break;
            case ENV_DECAY:
                env -= d_rate * (1.0f - sustain);
                if (env <= sustain) { env = sustain; v->env_state = ENV_SUSTAIN; }
                break;
            case ENV_SUSTAIN:
                env = sustain;
                break;
            case ENV_RELEASE:
                env -= r_rate;
                if (env <= 0.0f) { env = 0.0f; v->env_state = ENV_OFF; v->note = -1; }
                break;
            default:
                break;
            }

            /* one-pole lowpass */
            lp += lp_coeff * (saw * env * vel - lp);

            float out = lp * gain * 0.2f; /* 0.2 headroom for 8 voices */
            s->out_l[i] += out;
            s->out_r[i] += out;
        }

        v->phase = phase;
        v->env   = env;
        v->lp    = lp;
    }
}

static void cleanup(LV2_Handle handle) { free(handle); }

static const LV2_Descriptor descriptor = {
    PLUGIN_URI,
    instantiate,
    connect_port,
    activate,
    run,
    NULL, /* deactivate */
    cleanup,
    NULL, /* extension_data */
};

LV2_SYMBOL_EXPORT
const LV2_Descriptor *lv2_descriptor(uint32_t index) {
    return index == 0 ? &descriptor : NULL;
}
