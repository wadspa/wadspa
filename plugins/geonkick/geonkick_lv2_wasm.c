#include <math.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"
#include <emscripten.h>

#include "audio_output.h"
#include "envelope.h"
#include "synthesizer.h"

#define PLUGIN_URI "https://wadspa.org/plugins/geonkick"
#define MAX_ENV_POINTS 8

enum {
    PORT_MIDI_IN = 0,
    PORT_OUT_L,
    PORT_OUT_R,
    PORT_FREQUENCY,
    PORT_DECAY,
    PORT_PITCH_DROP,
    PORT_NOISE,
    PORT_CLICK,
    PORT_TONE,
    PORT_RESONANCE,
    PORT_DRIVE,
    PORT_GAIN,
};

typedef struct {
    const LV2_Atom_Sequence *midi_in;
    float *out_l;
    float *out_r;
    const float *frequency;
    const float *decay;
    const float *pitch_drop;
    const float *noise;
    const float *click;
    const float *tone;
    const float *resonance;
    const float *drive;
    const float *gain;

    double sample_rate;
    LV2_URID midi_event_urid;
    LV2_URID_Map *map;

    struct gkick_synth *synth;
    struct gkick_audio_output *output;

    float last_frequency;
    float last_decay;
    float last_pitch_drop;
    float last_noise;
    float last_click;
    float last_tone;
    float last_resonance;
    float last_drive;
    float last_gain;
    float kick_amp_x[MAX_ENV_POINTS];
    float kick_amp_y[MAX_ENV_POINTS];
    size_t kick_amp_count;
    float active_amp_x[MAX_ENV_POINTS];
    float active_amp_y[MAX_ENV_POINTS];
    size_t active_amp_count;
    uint32_t playback_sample;
    uint32_t playback_length_samples;
    float osc_pitch_x[MAX_ENV_POINTS];
    float osc_pitch_y[MAX_ENV_POINTS];
    size_t osc_pitch_count;
    int dirty;
} GeonkickLV2;

static GeonkickLV2 *g_latest_instance = NULL;

static float clampf_local(float v, float lo, float hi)
{
    if (!isfinite(v)) return lo;
    return fminf(hi, fmaxf(lo, v));
}

static float port_or_default(const float *p, float fallback)
{
    return p ? *p : fallback;
}

static void set_points(struct gkick_envelope_point_info *points, size_t npoints,
                       float x0, float y0, float x1, float y1, float x2, float y2)
{
    points[0].x = x0;
    points[0].y = y0;
    points[0].control_point = false;
    points[1].x = x1;
    points[1].y = y1;
    points[1].control_point = false;
    if (npoints > 2) {
        points[2].x = x2;
        points[2].y = y2;
        points[2].control_point = false;
    }
}

static void set_kick_env(struct gkick_synth *synth, enum geonkick_envelope_type type,
                         float y0, float y1, float y2)
{
    struct gkick_envelope_point_info points[3];
    set_points(points, 3, 0.0f, y0, 0.78f, y1, 1.0f, y2);
    gkick_synth_kick_envelope_set_points(synth, type, points, 3);
}

static void set_osc_env(struct gkick_synth *synth, size_t osc, enum geonkick_envelope_type type,
                        float x1, float y0, float y1)
{
    struct gkick_envelope_point_info points[3];
    set_points(points, 3, 0.0f, y0, x1, y1, 1.0f, 0.0f);
    gkick_synth_osc_envelope_set_points(synth, (int)osc, (int)type, points, 3);
}

static size_t parse_env_points(const char *value, float *xs, float *ys)
{
    if (!value) return 0;
    size_t count = 0;
    const char *p = value;
    while (*p && count < MAX_ENV_POINTS) {
        char *end = NULL;
        float x = strtof(p, &end);
        if (end == p) {
            p++;
            continue;
        }
        p = end;
        while (*p == ',' || *p == ':' || *p == ' ' || *p == '\t') p++;
        float y = strtof(p, &end);
        if (end == p) break;
        p = end;

        x = clampf_local(x, 0.0f, 1.0f);
        y = clampf_local(y, 0.0f, 1.0f);
        size_t insert = count++;
        while (insert > 0 && xs[insert - 1] > x) {
            xs[insert] = xs[insert - 1];
            ys[insert] = ys[insert - 1];
            insert--;
        }
        xs[insert] = x;
        ys[insert] = y;

        while (*p && *p != ';' && *p != '|' && *p != '\n') p++;
        while (*p == ';' || *p == '|' || *p == '\n' || *p == ' ' || *p == '\t') p++;
    }
    return count;
}

static void set_kick_amp_env_from_state(GeonkickLV2 *g)
{
    struct gkick_envelope_point_info points[MAX_ENV_POINTS];
    for (size_t i = 0; i < g->kick_amp_count; i++) {
        points[i].x = g->kick_amp_x[i];
        points[i].y = g->kick_amp_y[i];
        points[i].control_point = false;
    }
    gkick_synth_kick_envelope_set_points(
        g->synth,
        GEONKICK_AMPLITUDE_ENVELOPE,
        points,
        g->kick_amp_count
    );
    gkick_synth_osc_envelope_set_points(
        g->synth,
        0,
        GEONKICK_AMPLITUDE_ENVELOPE,
        points,
        g->kick_amp_count
    );
}

static void set_osc_pitch_env_from_state(GeonkickLV2 *g, float pitch_mult)
{
    struct gkick_envelope_point_info points[MAX_ENV_POINTS];
    for (size_t i = 0; i < g->osc_pitch_count; i++) {
        points[i].x = g->osc_pitch_x[i];
        points[i].y = 1.0f + g->osc_pitch_y[i] * (pitch_mult - 1.0f);
        points[i].control_point = false;
    }
    gkick_synth_osc_envelope_set_points(
        g->synth,
        0,
        GEONKICK_FREQUENCY_ENVELOPE,
        points,
        g->osc_pitch_count
    );
}

static float sample_state_env(const float *xs, const float *ys, size_t count, float x)
{
    if (count < 2) return 1.0f;
    if (x <= xs[0]) return ys[0];
    for (size_t i = 1; i < count; i++) {
        if (x <= xs[i]) {
            const float span = xs[i] - xs[i - 1];
            if (span <= 1e-6f) return ys[i];
            const float t = (x - xs[i - 1]) / span;
            return ys[i - 1] + (ys[i] - ys[i - 1]) * t;
        }
    }
    return ys[count - 1];
}

static void latch_amp_env_for_trigger(GeonkickLV2 *g)
{
    g->active_amp_count = g->kick_amp_count;
    for (size_t i = 0; i < g->kick_amp_count && i < MAX_ENV_POINTS; i++) {
        g->active_amp_x[i] = g->kick_amp_x[i];
        g->active_amp_y[i] = g->kick_amp_y[i];
    }
    g->playback_sample = 0;
    g->playback_length_samples = (uint32_t)fmaxf(1.0f, g->last_decay * (float)g->sample_rate);
}

static void apply_active_amp_env(GeonkickLV2 *g, uint32_t n_samples)
{
    if (g->active_amp_count < 2 || g->playback_length_samples == 0 || !g->out_l || !g->out_r) {
        return;
    }
    const float denom = (float)g->playback_length_samples;
    for (uint32_t i = 0; i < n_samples; i++) {
        const float x = clampf_local((float)(g->playback_sample + i) / denom, 0.0f, 1.0f);
        const float amp = clampf_local(sample_state_env(g->active_amp_x, g->active_amp_y, g->active_amp_count, x), 0.0f, 1.0f);
        g->out_l[i] *= amp;
        g->out_r[i] *= amp;
    }
    g->playback_sample += n_samples;
}

static void configure_synth(GeonkickLV2 *g)
{
    const float frequency = clampf_local(port_or_default(g->frequency, 62.0f), 30.0f, 220.0f);
    const float decay = clampf_local(port_or_default(g->decay, 0.45f), 0.08f, 1.5f);
    const float pitch_drop = clampf_local(port_or_default(g->pitch_drop, 28.0f), 0.0f, 48.0f);
    const float noise = clampf_local(port_or_default(g->noise, 0.12f), 0.0f, 0.85f);
    const float click = clampf_local(port_or_default(g->click, 0.22f), 0.0f, 1.0f);
    const float tone = clampf_local(port_or_default(g->tone, 2100.0f), 120.0f, 8000.0f);
    const float resonance = clampf_local(port_or_default(g->resonance, 1.2f), 0.5f, 4.0f);
    const float drive = clampf_local(port_or_default(g->drive, 1.0f), 1.0f, 6.0f);
    const float gain = clampf_local(port_or_default(g->gain, 0.52f), 0.08f, 0.9f);
    const float decay_norm = clampf_local((decay - 0.08f) / (1.5f - 0.08f), 0.0f, 1.0f);

    if (!g->dirty
        && fabsf(frequency - g->last_frequency) < 1e-5f
        && fabsf(decay - g->last_decay) < 1e-5f
        && fabsf(pitch_drop - g->last_pitch_drop) < 1e-5f
        && fabsf(noise - g->last_noise) < 1e-5f
        && fabsf(click - g->last_click) < 1e-5f
        && fabsf(tone - g->last_tone) < 1e-5f
        && fabsf(resonance - g->last_resonance) < 1e-5f
        && fabsf(drive - g->last_drive) < 1e-5f
        && fabsf(gain - g->last_gain) < 1e-5f) {
        return;
    }

    g->last_frequency = frequency;
    g->last_decay = decay;
    g->last_pitch_drop = pitch_drop;
    g->last_noise = noise;
    g->last_click = click;
    g->last_tone = tone;
    g->last_resonance = resonance;
    g->last_drive = drive;
    g->last_gain = gain;
    g->dirty = 0;

    const float pitch_mult = powf(2.0f, pitch_drop / 12.0f);

    gkick_synth_set_length(g->synth, decay);
    gkick_synth_kick_set_amplitude(g->synth, gain);
    gkick_synth_enable_group(g->synth, 0, true);
    geonkick_synth_group_set_amplitude(g->synth, 0, 1.0f);

    gkick_synth_enable_oscillator(g->synth, 0, 1);
    gkick_synth_set_osc_function(g->synth, 0, GEONKICK_OSC_FUNC_SINE);
    gkick_synth_set_osc_frequency(g->synth, 0, frequency * powf(2.0f, (0.5f - decay_norm) * 1.0f));
    gkick_synth_set_osc_amplitude(g->synth, 0, 0.72f);
    if (g->osc_pitch_count >= 2) {
        set_osc_pitch_env_from_state(g, pitch_mult);
    } else {
        struct gkick_envelope_point_info points[3];
        set_points(points, 3, 0.0f, pitch_mult, 0.18f, 1.0f, 1.0f, 1.0f);
        gkick_synth_osc_envelope_set_points(g->synth, 0, GEONKICK_FREQUENCY_ENVELOPE, points, 3);
    }
    set_osc_env(
        g->synth,
        0,
        GEONKICK_AMPLITUDE_ENVELOPE,
        0.015f + 0.88f * decay_norm,
        1.0f,
        0.01f + 0.86f * decay_norm
    );

    gkick_synth_enable_oscillator(g->synth, 1, 1);
    gkick_synth_set_osc_function(g->synth, 1, GEONKICK_OSC_FUNC_NOISE_WHITE);
    gkick_synth_set_osc_amplitude(g->synth, 1, noise * 0.24f);
    gkick_synth_set_osc_noise_density(g->synth, 1, 1.0f);
    set_osc_env(g->synth, 1, GEONKICK_AMPLITUDE_ENVELOPE, 0.08f, 1.0f, 0.0f);

    gkick_synth_enable_oscillator(g->synth, 2, 1);
    gkick_synth_set_osc_function(g->synth, 2, GEONKICK_OSC_FUNC_TRIANGLE);
    gkick_synth_set_osc_frequency(g->synth, 2, 1800.0f + tone * 0.45f);
    gkick_synth_set_osc_amplitude(g->synth, 2, click * 0.16f);
    set_osc_env(g->synth, 2, GEONKICK_AMPLITUDE_ENVELOPE, 0.035f, 1.0f, 0.0f);

    geonkick_synth_kick_filter_enable(g->synth, 1);
    gkick_synth_set_kick_filter_type(g->synth, GEONKICK_FILTER_LOW_PASS);
    gkick_synth_kick_set_filter_frequency(g->synth, tone);
    gkick_synth_kick_set_filter_factor(g->synth, resonance);

    gkick_synth_distortion_enable(g->synth, drive > 1.05f);
    gkick_synth_distortion_set_type(g->synth, GEONKICK_DISTORTION_SOFT_CLIPPING_TANH);
    gkick_synth_distortion_set_drive(g->synth, drive);
    gkick_synth_distortion_set_out_limiter(g->synth, 0.92f);

    if (g->kick_amp_count >= 2) {
        set_kick_amp_env_from_state(g);
    } else {
        struct gkick_envelope_point_info points[3];
        set_points(
            points,
            3,
            0.0f,
            1.0f,
            0.015f + 0.88f * decay_norm,
            0.02f + 0.82f * decay_norm,
            1.0f,
            0.0f
        );
        gkick_synth_kick_envelope_set_points(g->synth, GEONKICK_AMPLITUDE_ENVELOPE, points, 3);
    }
    gkick_synth_process(g->synth);
}

static void trigger(GeonkickLV2 *g, uint8_t note, uint8_t velocity)
{
    configure_synth(g);
    latch_amp_env_for_trigger(g);
    struct gkick_note_info key;
    key.state = GKICK_KEY_STATE_PRESSED;
    key.channel = 0;
    key.note_number = (signed char)note;
    key.velocity = (signed char)(velocity ? velocity : 100);
    key.timing = 0.0f;
    gkick_audio_output_key_pressed(g->output, &key);
}

static LV2_Handle instantiate(const LV2_Descriptor *descriptor,
                              double sample_rate,
                              const char *bundle_path,
                              const LV2_Feature *const *features)
{
    (void)descriptor;
    (void)bundle_path;

    GeonkickLV2 *g = (GeonkickLV2 *)calloc(1, sizeof(GeonkickLV2));
    if (!g) return NULL;
    g->sample_rate = sample_rate;
    g->dirty = 1;

    for (const LV2_Feature *const *f = features; f && *f; f++) {
        if (!strcmp((*f)->URI, LV2_URID__map)) {
            g->map = (LV2_URID_Map *)(*f)->data;
        }
    }
    if (g->map) {
        g->midi_event_urid = g->map->map(g->map->handle, LV2_MIDI__MidiEvent);
    }

    if (gkick_synth_new(&g->synth, (int)sample_rate) != GEONKICK_OK
        || gkick_audio_output_create(&g->output, (int)sample_rate) != GEONKICK_OK) {
        free(g);
        return NULL;
    }

    g->output->limiter = 850000;
    gkick_audio_output_tune_output(g->output, false);
    gkick_synth_set_output(g->synth, g->output);
    g_latest_instance = g;
    return (LV2_Handle)g;
}

static void connect_port(LV2_Handle handle, uint32_t port, void *data)
{
    GeonkickLV2 *g = (GeonkickLV2 *)handle;
    switch (port) {
    case PORT_MIDI_IN: g->midi_in = (const LV2_Atom_Sequence *)data; break;
    case PORT_OUT_L: g->out_l = (float *)data; break;
    case PORT_OUT_R: g->out_r = (float *)data; break;
    case PORT_FREQUENCY: g->frequency = (const float *)data; break;
    case PORT_DECAY: g->decay = (const float *)data; break;
    case PORT_PITCH_DROP: g->pitch_drop = (const float *)data; break;
    case PORT_NOISE: g->noise = (const float *)data; break;
    case PORT_CLICK: g->click = (const float *)data; break;
    case PORT_TONE: g->tone = (const float *)data; break;
    case PORT_RESONANCE: g->resonance = (const float *)data; break;
    case PORT_DRIVE: g->drive = (const float *)data; break;
    case PORT_GAIN: g->gain = (const float *)data; break;
    default: break;
    }
}

static void activate(LV2_Handle handle)
{
    GeonkickLV2 *g = (GeonkickLV2 *)handle;
    g->dirty = 1;
}

static void run(LV2_Handle handle, uint32_t n_samples)
{
    GeonkickLV2 *g = (GeonkickLV2 *)handle;

    if (g->midi_in && g->midi_event_urid) {
        LV2_ATOM_SEQUENCE_FOREACH(g->midi_in, ev) {
            if (ev->body.type != g->midi_event_urid || ev->body.size < 3) continue;
            const uint8_t *msg = (const uint8_t *)(ev + 1);
            const uint8_t status = msg[0] & 0xF0;
            if (status == 0x90 && msg[2] > 0) {
                trigger(g, msg[1], msg[2]);
            } else if (status == 0x90 && msg[2] == 0) {
                struct gkick_note_info key = { GKICK_KEY_STATE_RELEASED, 0, (signed char)msg[1], 0, 0.0f };
                gkick_audio_output_key_pressed(g->output, &key);
            } else if (status == 0x80) {
                struct gkick_note_info key = { GKICK_KEY_STATE_RELEASED, 0, (signed char)msg[1], 0, 0.0f };
                gkick_audio_output_key_pressed(g->output, &key);
            }
        }
    }

    if (!g->out_l || !g->out_r) return;
    memset(g->out_l, 0, n_samples * sizeof(float));
    memset(g->out_r, 0, n_samples * sizeof(float));
    gkick_real *data[2] = { g->out_l, g->out_r };
    gkick_real leveler = 0.0f;
    gkick_audio_output_get_data(g->output, data, &leveler, n_samples);
    apply_active_amp_env(g, n_samples);
    (void)leveler;
}

static void cleanup(LV2_Handle handle)
{
    GeonkickLV2 *g = (GeonkickLV2 *)handle;
    if (!g) return;
    if (g_latest_instance == g) g_latest_instance = NULL;
    gkick_synth_free(&g->synth);
    gkick_audio_output_free(&g->output);
    free(g);
}

EMSCRIPTEN_KEEPALIVE void shim_set_plugin_state(const char *key, const char *value)
{
    GeonkickLV2 *g = g_latest_instance;
    if (!g || !key || !value) return;

    if (strcmp(key, "kick_amp_env") == 0) {
        g->kick_amp_count = parse_env_points(value, g->kick_amp_x, g->kick_amp_y);
    } else if (strcmp(key, "osc_pitch_env") == 0) {
        g->osc_pitch_count = parse_env_points(value, g->osc_pitch_x, g->osc_pitch_y);
    } else {
        return;
    }
    // Canvas edits can arrive at pointer-move rate. Defer the expensive
    // full-kick render until the next MIDI trigger so dragging cannot stall
    // the realtime audio callback or crackle the current hit.
    g->dirty = 1;
}

static const LV2_Descriptor descriptor = {
    PLUGIN_URI,
    instantiate,
    connect_port,
    activate,
    run,
    NULL,
    cleanup,
    NULL,
};

const LV2_Descriptor *lv2_descriptor(uint32_t index)
{
    return index == 0 ? &descriptor : NULL;
}
