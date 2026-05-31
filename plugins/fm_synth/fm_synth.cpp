/**
 * fm_synth — 2-operator FM synthesizer, 8-voice polyphonic.
 *
 * Signal path: Op2 (modulator) → Op1 (carrier) → ADSR → output
 *
 * Controls:
 *   mod_ratio  — modulator frequency as multiple of the MIDI note frequency
 *   mod_index  — modulation depth (0 = no FM, 10 = heavy FM)
 *   mod_decay  — exponential decay time for the modulator envelope (bell/pluck)
 *   attack/decay/sustain/release — carrier ADSR
 *   gain       — master output level
 */

#include <cmath>
#include <cstdint>
#include <cstring>
#include <algorithm>

#include "lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"

#define PLUGIN_URI "https://wadspa.org/plugins/fm_synth"
#define NUM_VOICES 8

static constexpr float TWO_PI = 6.283185307179586f;

enum Port {
    PORT_MIDI_IN   = 0,
    PORT_OUT_L     = 1,
    PORT_OUT_R     = 2,
    PORT_MOD_RATIO = 3,
    PORT_MOD_INDEX = 4,
    PORT_MOD_DECAY = 5,
    PORT_ATTACK    = 6,
    PORT_DECAY     = 7,
    PORT_SUSTAIN   = 8,
    PORT_RELEASE   = 9,
    PORT_GAIN      = 10,
};

enum class Env { OFF, ATTACK, DECAY, SUSTAIN, RELEASE };

struct Voice {
    int   note          = -1;
    float carrier_freq  = 0.f;
    float carrier_phase = 0.f;
    float mod_phase     = 0.f;
    float env           = 0.f;   // carrier envelope amplitude
    float mod_env       = 1.f;   // modulator envelope amplitude (decays freely)
    float velocity      = 0.f;
    Env   state         = Env::OFF;
};

struct FMSynth {
    const LV2_Atom_Sequence *midi_in = nullptr;
    float *out_l = nullptr;
    float *out_r = nullptr;

    const float *mod_ratio = nullptr;
    const float *mod_index = nullptr;
    const float *mod_decay = nullptr;
    const float *attack    = nullptr;
    const float *decay     = nullptr;
    const float *sustain   = nullptr;
    const float *release   = nullptr;
    const float *gain      = nullptr;

    double        sample_rate = 44100.0;
    LV2_URID      midi_event_urid = 0;
    LV2_URID_Map *map = nullptr;

    Voice voices[NUM_VOICES];
};

static float midi_to_hz(int note) {
    return 440.f * std::pow(2.f, (note - 69) / 12.f);
}

static Voice *find_voice_for_note(FMSynth &s, int note) {
    for (auto &v : s.voices)
        if (v.note == note) return &v;
    return nullptr;
}

static Voice *steal_voice(FMSynth &s) {
    for (auto &v : s.voices)
        if (v.state == Env::OFF) return &v;
    return &s.voices[0];
}

static void note_on(FMSynth &s, int note, int vel) {
    Voice *v = find_voice_for_note(s, note);
    if (!v) v = steal_voice(s);
    v->note          = note;
    v->carrier_freq  = midi_to_hz(note);
    v->carrier_phase = 0.f;
    v->mod_phase     = 0.f;
    v->velocity      = vel / 127.f;
    v->mod_env       = 1.f;
    v->env           = 0.f;
    v->state         = Env::ATTACK;
}

static void note_off(FMSynth &s, int note) {
    Voice *v = find_voice_for_note(s, note);
    if (v && v->state != Env::OFF)
        v->state = Env::RELEASE;
}

// ── LV2 callbacks ─────────────────────────────────────────────────────────

extern "C" {

static LV2_Handle instantiate(const LV2_Descriptor *, double rate,
                               const char *, const LV2_Feature *const *features) {
    auto *s = new FMSynth;
    s->sample_rate = rate;
    for (; *features; ++features) {
        if (!std::strcmp((*features)->URI, LV2_URID__map)) {
            s->map = static_cast<LV2_URID_Map *>((*features)->data);
            s->midi_event_urid = s->map->map(s->map->handle, LV2_MIDI__MidiEvent);
        }
    }
    return static_cast<LV2_Handle>(s);
}

static void connect_port(LV2_Handle handle, uint32_t port, void *data) {
    auto *s = static_cast<FMSynth *>(handle);
    switch (static_cast<Port>(port)) {
        case PORT_MIDI_IN:   s->midi_in   = static_cast<const LV2_Atom_Sequence *>(data); break;
        case PORT_OUT_L:     s->out_l     = static_cast<float *>(data); break;
        case PORT_OUT_R:     s->out_r     = static_cast<float *>(data); break;
        case PORT_MOD_RATIO: s->mod_ratio = static_cast<const float *>(data); break;
        case PORT_MOD_INDEX: s->mod_index = static_cast<const float *>(data); break;
        case PORT_MOD_DECAY: s->mod_decay = static_cast<const float *>(data); break;
        case PORT_ATTACK:    s->attack    = static_cast<const float *>(data); break;
        case PORT_DECAY:     s->decay     = static_cast<const float *>(data); break;
        case PORT_SUSTAIN:   s->sustain   = static_cast<const float *>(data); break;
        case PORT_RELEASE:   s->release   = static_cast<const float *>(data); break;
        case PORT_GAIN:      s->gain      = static_cast<const float *>(data); break;
    }
}

static void activate(LV2_Handle handle) {
    auto *s = static_cast<FMSynth *>(handle);
    for (auto &v : s->voices) { v.state = Env::OFF; v.note = -1; }
}

static void run(LV2_Handle handle, uint32_t n_samples) {
    auto *s = static_cast<FMSynth *>(handle);
    const float sr = static_cast<float>(s->sample_rate);

    LV2_ATOM_SEQUENCE_FOREACH(s->midi_in, ev) {
        if (ev->body.type == s->midi_event_urid) {
            const auto *msg = reinterpret_cast<const uint8_t *>(ev + 1);
            const uint8_t type = msg[0] & 0xF0u;
            if      (type == 0x90u && msg[2] > 0) note_on(*s,  msg[1], msg[2]);
            else if (type == 0x80u || (type == 0x90u && msg[2] == 0)) note_off(*s, msg[1]);
        }
    }

    // Pre-compute per-block coefficients
    const float mod_ratio  = *s->mod_ratio;
    const float mod_index  = *s->mod_index;
    const float mod_decay  = std::max(*s->mod_decay, 0.001f);
    const float att        = std::max(*s->attack,  0.001f);
    const float dec        = std::max(*s->decay,   0.001f);
    const float sus        = *s->sustain;
    const float rel        = std::max(*s->release, 0.001f);
    const float master_gain = *s->gain;

    const float mod_coeff = std::exp(-1.f / (mod_decay * sr));
    const float att_coeff = std::exp(-1.f / (att * sr));
    const float dec_coeff = std::exp(-1.f / (dec * sr));
    const float rel_coeff = std::exp(-1.f / (rel * sr));

    std::memset(s->out_l, 0, n_samples * sizeof(float));
    std::memset(s->out_r, 0, n_samples * sizeof(float));

    for (auto &v : s->voices) {
        if (v.state == Env::OFF) continue;

        const float c_inc = v.carrier_freq / sr;
        const float m_inc = v.carrier_freq * mod_ratio / sr;

        for (uint32_t i = 0; i < n_samples; ++i) {
            // Modulator envelope (exponential decay from note-on)
            v.mod_env *= mod_coeff;

            // Carrier ADSR
            switch (v.state) {
                case Env::ATTACK:
                    v.env = 1.f - (1.f - v.env) * att_coeff;
                    if (v.env >= 0.999f) { v.env = 1.f; v.state = Env::DECAY; }
                    break;
                case Env::DECAY:
                    v.env = sus + (v.env - sus) * dec_coeff;
                    if (v.env <= sus + 0.001f) { v.env = sus; v.state = Env::SUSTAIN; }
                    break;
                case Env::SUSTAIN:
                    v.env = sus;
                    break;
                case Env::RELEASE:
                    v.env *= rel_coeff;
                    if (v.env < 0.0001f) { v.env = 0.f; v.state = Env::OFF; v.note = -1; }
                    break;
                case Env::OFF:
                    break;
            }

            // FM synthesis: modulator output modifies carrier phase
            const float mod_out     = std::sin(TWO_PI * v.mod_phase) * mod_index * v.mod_env;
            const float carrier_out = std::sin(TWO_PI * v.carrier_phase + mod_out)
                                      * v.env * v.velocity * master_gain;

            v.mod_phase     += m_inc;
            if (v.mod_phase     >= 1.f) v.mod_phase     -= 1.f;
            v.carrier_phase += c_inc;
            if (v.carrier_phase >= 1.f) v.carrier_phase -= 1.f;

            s->out_l[i] += carrier_out;
            s->out_r[i] += carrier_out;
        }
    }
}

static void deactivate(LV2_Handle) {}

static void cleanup(LV2_Handle handle) {
    delete static_cast<FMSynth *>(handle);
}

static const void *extension_data(const char *) { return nullptr; }

static const LV2_Descriptor s_descriptor = {
    PLUGIN_URI,
    instantiate,
    connect_port,
    activate,
    run,
    deactivate,
    cleanup,
    extension_data,
};

LV2_SYMBOL_EXPORT
const LV2_Descriptor *lv2_descriptor(uint32_t index) {
    return index == 0 ? &s_descriptor : nullptr;
}

} // extern "C"
