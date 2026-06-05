#!/usr/bin/env node
/**
 * Setup script for Geonkick browser LV2.
 *
 * The stock Geonkick LV2 wrapper depends on the desktop UI/model layer. This
 * setup copies the C DSP core and generates a small LV2 instrument wrapper that
 * renders one Geonkick voice synchronously for Web Audio.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, 'geonkick');
const DSP = join(REPO, 'src', 'dsp', 'src');
const OUT = join(ROOT, 'plugins', 'geonkick');

if (!existsSync(REPO)) {
    console.error(`Source not found: ${REPO} - run fetch-sources.js first`);
    process.exit(1);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, 'quamplex_dsp_tools'), { recursive: true });

const dspFiles = [
    'audio_output.c',
    'audio_output.h',
    'distortion.c',
    'distortion.h',
    'envelope.c',
    'envelope.h',
    'filter.c',
    'filter.h',
    'geonkick.h',
    'geonkick_internal.h',
    'gkick_audio.h',
    'gkick_buffer.c',
    'gkick_buffer.h',
    'gkick_log.c',
    'gkick_log.h',
    'humanizer.c',
    'humanizer.h',
    'mixer.h',
    'oscillator.c',
    'oscillator.h',
    'ring_buffer.c',
    'ring_buffer.h',
    'synthesizer.c',
    'synthesizer.h',
    'worker.h',
];

for (const file of dspFiles) {
    copyFileSync(join(DSP, file), join(OUT, file));
}
copyFileSync(join(DSP, 'quamplex_dsp_tools', 'qx_math.h'), join(OUT, 'quamplex_dsp_tools', 'qx_math.h'));
copyFileSync(join(DSP, 'quamplex_dsp_tools', 'qx_randomizer.h'), join(OUT, 'quamplex_dsp_tools', 'qx_randomizer.h'));

patchGeonkickHeaders();
patchSynthesizer();

writeFileSync(join(OUT, 'geonkick_wasm_compat.c'), String.raw`#include <stdint.h>

void geonkick_usleep(unsigned long int usecods)
{
    (void)usecods;
}

int geonkick_rand(unsigned int *seed)
{
    uint32_t s = (seed && *seed) ? *seed : 1u;
    s = s * 1103515245u + 12345u;
    if (seed) *seed = s;
    return (int)(s & 0x7fffffffu);
}
`);

writeFileSync(join(OUT, 'geonkick_lv2_wasm.c'), String.raw`#include <math.h>
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
    float active_pitch_x[MAX_ENV_POINTS];
    float active_pitch_y[MAX_ENV_POINTS];
    size_t active_pitch_count;
    uint32_t playback_sample;
    uint32_t playback_length_samples;
    uint32_t voice_sample;
    uint32_t voice_length_samples;
    unsigned int noise_seed;
    float voice_phase;
    float filter_state;
    float noise_state;
    float velocity_gain;
    int voice_active;
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
    g->active_pitch_count = g->osc_pitch_count;
    for (size_t i = 0; i < g->osc_pitch_count && i < MAX_ENV_POINTS; i++) {
        g->active_pitch_x[i] = g->osc_pitch_x[i];
        g->active_pitch_y[i] = g->osc_pitch_y[i];
    }
    g->playback_sample = 0;
    g->playback_length_samples = (uint32_t)fmaxf(1.0f, g->last_decay * (float)g->sample_rate);
}

static float next_noise_sample(GeonkickLV2 *g)
{
    g->noise_seed = g->noise_seed * 1664525u + 1013904223u;
    return ((float)((g->noise_seed >> 8) & 0x00ffffffu) / 8388607.5f) - 1.0f;
}

static void start_kick_voice(GeonkickLV2 *g, uint8_t note, uint8_t velocity)
{
    g->voice_active = 1;
    g->voice_sample = 0;
    g->voice_length_samples = (uint32_t)fmaxf(64.0f, g->last_decay * (float)g->sample_rate);
    g->voice_phase = 0.0f;
    g->filter_state = 0.0f;
    g->noise_state = 0.0f;
    g->velocity_gain = clampf_local((float)(velocity ? velocity : 100) / 127.0f, 0.0f, 1.0f);
    g->noise_seed = 0x9e3779b9u ^ ((unsigned int)note * 2654435761u);
}

static void render_kick_voice(GeonkickLV2 *g, uint32_t n_samples)
{
    if (!g->out_l || !g->out_r) return;

    const float sr = (float)g->sample_rate;
    const float two_pi = 6.28318530718f;
    const float base_hz = clampf_local(g->last_frequency, 30.0f, 220.0f);
    const float decay = clampf_local(g->last_decay, 0.08f, 1.5f);
    const float pitch_drop = clampf_local(g->last_pitch_drop, 0.0f, 48.0f);
    const float tone = clampf_local(g->last_tone, 120.0f, 8000.0f);
    const float resonance = clampf_local(g->last_resonance, 0.5f, 4.0f);
    const float drive = clampf_local(g->last_drive, 1.0f, 6.0f);
    const float gain = clampf_local(g->last_gain, 0.08f, 0.9f);
    const float filter_alpha = clampf_local(1.0f - expf(-two_pi * tone / sr), 0.01f, 1.0f);
    const float tone_bright = clampf_local((logf(tone) - logf(120.0f)) / (logf(8000.0f) - logf(120.0f)), 0.0f, 1.0f);

    for (uint32_t i = 0; i < n_samples; i++) {
        float sample = 0.0f;

        if (g->voice_active) {
            const float t = (float)g->voice_sample / sr;
            const float x = clampf_local((float)g->voice_sample / fmaxf(1.0f, (float)g->voice_length_samples), 0.0f, 1.25f);
            const float attack = 0.002f;
            float amp_env = t < attack
                ? t / attack
                : expf(-(t - attack) / fmaxf(0.018f, decay * 0.32f));
            if (x > 1.0f) amp_env *= fmaxf(0.0f, 1.0f - (x - 1.0f) * 8.0f);
            amp_env *= clampf_local(sample_state_env(g->active_amp_x, g->active_amp_y, g->active_amp_count, clampf_local(x, 0.0f, 1.0f)), 0.0f, 1.0f);

            const float default_pitch_env = expf(-t / fmaxf(0.008f, decay * 0.10f));
            const float pitch_env = g->active_pitch_count >= 2
                ? clampf_local(sample_state_env(g->active_pitch_x, g->active_pitch_y, g->active_pitch_count, clampf_local(x, 0.0f, 1.0f)), 0.0f, 1.0f)
                : default_pitch_env;
            const float freq = clampf_local(base_hz * powf(2.0f, (pitch_drop * pitch_env) / 12.0f), 20.0f, 2000.0f);
            g->voice_phase += two_pi * freq / sr;
            if (g->voice_phase > two_pi) g->voice_phase -= two_pi;

            const float body = sinf(g->voice_phase) * amp_env * 0.92f;
            const float click_env = expf(-t / 0.0045f);
            const float click_hz = clampf_local(1500.0f + tone * 0.55f, 800.0f, 6200.0f);
            const float click_wave = sinf(two_pi * click_hz * t);
            const float transient_noise = next_noise_sample(g);
            const float click = g->last_click * click_env * (0.18f * click_wave + 0.16f * transient_noise);

            g->noise_state = 0.68f * g->noise_state + 0.32f * next_noise_sample(g);
            const float noise_env = expf(-t / 0.022f);
            const float noise = g->last_noise * g->noise_state * noise_env * 0.13f;

            const float raw = body + click + noise;
            g->filter_state += filter_alpha * (raw - g->filter_state);
            const float high = raw - g->filter_state;
            sample = g->filter_state * (0.94f + resonance * 0.035f)
                + high * (0.16f + tone_bright * 0.48f) * (0.86f + resonance * 0.055f);

            sample *= gain * g->velocity_gain;
            if (drive > 1.001f) sample = tanhf(sample * drive) / tanhf(drive);
            sample = clampf_local(sample, -0.95f, 0.95f);

            g->voice_sample++;
            if (g->voice_sample > g->voice_length_samples + (uint32_t)(0.08f * sr)) {
                g->voice_active = 0;
            }
        }

        g->out_l[i] = sample;
        g->out_r[i] = sample;
    }
}

static void configure_synth(GeonkickLV2 *g)
{
    const float frequency = clampf_local(port_or_default(g->frequency, 55.0f), 30.0f, 220.0f);
    const float decay = clampf_local(port_or_default(g->decay, 0.52f), 0.08f, 1.5f);
    const float pitch_drop = clampf_local(port_or_default(g->pitch_drop, 18.0f), 0.0f, 48.0f);
    const float noise = clampf_local(port_or_default(g->noise, 0.06f), 0.0f, 0.85f);
    const float click = clampf_local(port_or_default(g->click, 0.35f), 0.0f, 1.0f);
    const float tone = clampf_local(port_or_default(g->tone, 3600.0f), 120.0f, 8000.0f);
    const float resonance = clampf_local(port_or_default(g->resonance, 0.8f), 0.5f, 4.0f);
    const float drive = clampf_local(port_or_default(g->drive, 1.0f), 1.0f, 6.0f);
    const float gain = clampf_local(port_or_default(g->gain, 0.58f), 0.08f, 0.9f);
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
    gkick_synth_set_osc_amplitude(g->synth, 0, 0.82f);
    if (g->osc_pitch_count >= 2) {
        set_osc_pitch_env_from_state(g, pitch_mult);
    } else {
        struct gkick_envelope_point_info points[3];
        set_points(points, 3, 0.0f, pitch_mult, 0.12f, 1.0f, 1.0f, 1.0f);
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
    gkick_synth_set_osc_amplitude(g->synth, 1, noise * 0.16f);
    gkick_synth_set_osc_noise_density(g->synth, 1, 1.0f);
    set_osc_env(g->synth, 1, GEONKICK_AMPLITUDE_ENVELOPE, 0.08f, 1.0f, 0.0f);

    gkick_synth_enable_oscillator(g->synth, 2, 1);
    gkick_synth_set_osc_function(g->synth, 2, GEONKICK_OSC_FUNC_TRIANGLE);
    gkick_synth_set_osc_frequency(g->synth, 2, 1800.0f + tone * 0.45f);
    gkick_synth_set_osc_amplitude(g->synth, 2, click * 0.22f);
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
}

static void trigger(GeonkickLV2 *g, uint8_t note, uint8_t velocity)
{
    configure_synth(g);
    latch_amp_env_for_trigger(g);
    start_kick_voice(g, note, velocity);
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
                (void)msg;
            } else if (status == 0x80) {
                (void)msg;
            }
        }
    }

    if (!g->out_l || !g->out_r) return;
    render_kick_voice(g, n_samples);
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
        g->active_amp_count = g->kick_amp_count;
        for (size_t i = 0; i < g->kick_amp_count && i < MAX_ENV_POINTS; i++) {
            g->active_amp_x[i] = g->kick_amp_x[i];
            g->active_amp_y[i] = g->kick_amp_y[i];
        }
    } else if (strcmp(key, "osc_pitch_env") == 0) {
        g->osc_pitch_count = parse_env_points(value, g->osc_pitch_x, g->osc_pitch_y);
        g->active_pitch_count = g->osc_pitch_count;
        for (size_t i = 0; i < g->osc_pitch_count && i < MAX_ENV_POINTS; i++) {
            g->active_pitch_x[i] = g->osc_pitch_x[i];
            g->active_pitch_y[i] = g->osc_pitch_y[i];
        }
    } else {
        return;
    }
    // Canvas edits can arrive at pointer-move rate. Update the lightweight
    // active voice immediately, and defer any full parameter rebuild to the
    // next MIDI trigger.
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
`);

writeFileSync(join(OUT, 'manifest.ttl'), String.raw`@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<https://wadspa.org/plugins/geonkick>
    a lv2:Plugin ;
    lv2:binary <Geonkick.wasm> ;
    rdfs:seeAlso <geonkick.ttl> .
`);

writeFileSync(join(OUT, 'geonkick.ttl'), String.raw`@prefix atom:  <http://lv2plug.in/ns/ext/atom#> .
@prefix doap:  <http://usefulinc.com/ns/doap#> .
@prefix lv2:   <http://lv2plug.in/ns/lv2core#> .
@prefix midi:  <http://lv2plug.in/ns/ext/midi#> .
@prefix pprop: <http://lv2plug.in/ns/ext/port-props#> .
@prefix units: <http://lv2plug.in/ns/extensions/units#> .
@prefix urid:  <http://lv2plug.in/ns/ext/urid#> .

<https://wadspa.org/plugins/geonkick>
    a lv2:InstrumentPlugin, lv2:Plugin ;
    doap:name "Geonkick" ;
    doap:description "Browser LV2 port of the Geonkick C DSP core as a MIDI-triggered kick drum synthesizer" ;

    lv2:requiredFeature urid:map ;
    lv2:optionalFeature lv2:hardRTCapable ;

    lv2:port [
        a lv2:InputPort, atom:AtomPort ;
        atom:bufferType atom:Sequence ;
        atom:supports midi:MidiEvent ;
        lv2:index 0 ;
        lv2:symbol "midi_in" ;
        lv2:name "MIDI In" ;
    ] , [
        a lv2:OutputPort, lv2:AudioPort ;
        lv2:index 1 ;
        lv2:symbol "out_l" ;
        lv2:name "Audio Out L" ;
    ] , [
        a lv2:OutputPort, lv2:AudioPort ;
        lv2:index 2 ;
        lv2:symbol "out_r" ;
        lv2:name "Audio Out R" ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 3 ;
        lv2:symbol "frequency" ;
        lv2:name "Bass Frequency" ;
        lv2:minimum 30.0 ;
        lv2:maximum 220.0 ;
        lv2:default 55.0 ;
        lv2:portProperty pprop:logarithmic ;
        units:unit units:hz ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 4 ;
        lv2:symbol "decay" ;
        lv2:name "Decay" ;
        lv2:minimum 0.08 ;
        lv2:maximum 1.5 ;
        lv2:default 0.52 ;
        lv2:portProperty pprop:logarithmic ;
        units:unit units:s ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 5 ;
        lv2:symbol "pitch_drop" ;
        lv2:name "Pitch Drop" ;
        lv2:minimum 0.0 ;
        lv2:maximum 48.0 ;
        lv2:default 18.0 ;
        units:unit units:semitone12TET ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 6 ;
        lv2:symbol "noise" ;
        lv2:name "Noise Amount" ;
        lv2:minimum 0.0 ;
        lv2:maximum 0.85 ;
        lv2:default 0.06 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 7 ;
        lv2:symbol "click" ;
        lv2:name "Click Amount" ;
        lv2:minimum 0.0 ;
        lv2:maximum 1.0 ;
        lv2:default 0.35 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 8 ;
        lv2:symbol "tone" ;
        lv2:name "Tone Cutoff" ;
        lv2:minimum 120.0 ;
        lv2:maximum 8000.0 ;
        lv2:default 3600.0 ;
        lv2:portProperty pprop:logarithmic ;
        units:unit units:hz ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 9 ;
        lv2:symbol "resonance" ;
        lv2:name "Resonance" ;
        lv2:minimum 0.5 ;
        lv2:maximum 4.0 ;
        lv2:default 0.8 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 10 ;
        lv2:symbol "drive" ;
        lv2:name "Drive" ;
        lv2:minimum 1.0 ;
        lv2:maximum 6.0 ;
        lv2:default 1.0 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 11 ;
        lv2:symbol "gain" ;
        lv2:name "Gain" ;
        lv2:minimum 0.08 ;
        lv2:maximum 0.9 ;
        lv2:default 0.58 ;
    ] .
`);

const entry = {
    id: 'geonkick',
    description: 'Geonkick - MIDI-triggered kick drum synthesizer using the Geonkick DSP core',
    category: 'Instruments',
    extraExports: ['_shim_set_plugin_state', '_malloc', '_free'],
    canvasEditors: [
        {
            key: 'kick_amp_env',
            name: 'Amp Envelope',
            defaultPoints: [
                { x: 0, y: 1 },
                { x: 1, y: 1 },
            ],
            presets: {
                punch: [
                    { x: 0, y: 1 },
                    { x: 0.18, y: 0.82 },
                    { x: 1, y: 0 },
                ],
                long: [
                    { x: 0, y: 1 },
                    { x: 0.72, y: 0.64 },
                    { x: 1, y: 0 },
                ],
                gate: [
                    { x: 0, y: 1 },
                    { x: 0.92, y: 1 },
                    { x: 1, y: 0 },
                ],
            },
        },
        {
            key: 'osc_pitch_env',
            name: 'Pitch Envelope',
            defaultPoints: [
                { x: 0, y: 1 },
                { x: 0.12, y: 0 },
                { x: 1, y: 0 },
            ],
            presets: {
                snap: [
                    { x: 0, y: 1 },
                    { x: 0.08, y: 0.08 },
                    { x: 1, y: 0 },
                ],
                bend: [
                    { x: 0, y: 0.58 },
                    { x: 0.42, y: 0.2 },
                    { x: 1, y: 0 },
                ],
                flat: [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                ],
            },
        },
    ],
    sources: [
        'geonkick_lv2_wasm.c',
        'geonkick_wasm_compat.c',
        'synthesizer.c',
        'oscillator.c',
        'envelope.c',
        'filter.c',
        'distortion.c',
        'audio_output.c',
        'ring_buffer.c',
        'gkick_buffer.c',
        'humanizer.c',
        'gkick_log.c',
    ],
    includes: [
        'plugins/geonkick',
        'plugins/geonkick/quamplex_dsp_tools',
    ],
};

const registry = readLv2Registry(ROOT);
const existing = registry.findIndex(item => item.id === 'geonkick');
if (existing >= 0) registry[existing] = entry;
else registry.push(entry);
writeLv2Registry(ROOT, registry);

console.log('Geonkick setup complete');
console.log('Run: node scripts/build-instruments.js --only geonkick');

function patchGeonkickHeaders() {
    const internalPath = join(OUT, 'geonkick_internal.h');
    let internal = readFileSync(internalPath, 'utf8');
    internal = internal.replace('#include <math.h>', `#include <math.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif
#ifndef M_1_PI
#define M_1_PI 0.31830988618379067154
#endif
#ifndef M_2_PI
#define M_2_PI 0.63661977236758134308
#endif`);
    writeFileSync(internalPath, internal);

    const apiPath = join(OUT, 'geonkick.h');
    let api = readFileSync(apiPath, 'utf8');
    api = api.replace('#define GEONKICK_VERSION GEONKICK_VERSION_HEX', `#ifndef GEONKICK_VERSION_HEX
#define GEONKICK_VERSION_HEX 0x030700
#endif
#ifndef GEONKICK_VERSION_STR
#define GEONKICK_VERSION_STR "3.7.0"
#endif

#define GEONKICK_VERSION GEONKICK_VERSION_HEX`);
    writeFileSync(apiPath, api);
}

function patchSynthesizer() {
    const synthPath = join(OUT, 'synthesizer.c');
    let src = readFileSync(synthPath, 'utf8');
    src = src.replace(`\t(*synth)->sample_rate = sample_rate;`, `\t(*synth)->sample_rate = sample_rate;
        if (pthread_mutex_init(&(*synth)->lock, NULL) != 0) {
                gkick_log_error("error on init mutex");
                gkick_synth_free(synth);
                return GEONKICK_ERROR;
        }`);
    writeFileSync(synthPath, src);
}
