#!/usr/bin/env node
/**
 * Setup script for Chow Kick.
 *
 * Chow Kick's upstream plugin is a JUCE/chowdsp project with unpopulated
 * submodules in this checkout. This setup hosts a compact scalar version of the
 * same kick signal path: MIDI pulse trigger, pulse shaper, nonlinear resonator,
 * noise burst, tone, and output level.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'chowkick', 'src', 'dsp');
const OUT = join(ROOT, 'plugins', 'chowkick');

const controls = [
    { symbol: 'pulse_width', name: 'Pulse Width [ms]', min: 0.025, max: 2.5, def: 1.0, logarithmic: true },
    { symbol: 'pulse_amp', name: 'Pulse Amp', min: 0, max: 1, def: 1.0 },
    { symbol: 'voices', name: 'Voices', min: 1, max: 4, def: 2, integer: true },
    { symbol: 'velocity_sensitivity', name: 'Velocity Sensitivity', min: 0, max: 1, def: 1, integer: true, toggled: true },
    { symbol: 'sustain', name: 'Pulse Sustain', min: 0, max: 1, def: 0.5 },
    { symbol: 'decay', name: 'Pulse Decay', min: 0, max: 1, def: 0.5 },
    { symbol: 'frequency', name: 'Frequency', min: 30, max: 500, def: 100, logarithmic: true },
    { symbol: 'link_pitch', name: 'Link Pitch', min: 0, max: 1, def: 1, integer: true, toggled: true },
    { symbol: 'q', name: 'Q', min: 0.1, max: 2, def: 0.5 },
    { symbol: 'damping', name: 'Damping', min: 0, max: 1, def: 0.5 },
    { symbol: 'tight', name: 'Tight', min: 0, max: 1, def: 0.5 },
    { symbol: 'bounce', name: 'Bounce', min: 0, max: 1, def: 0.15 },
    { symbol: 'res_mode', name: 'Resonator Mode', min: 0, max: 2, def: 1, integer: true, scalePoints: [['Linear', 0], ['Basic', 1], ['Bouncy', 2]] },
    { symbol: 'portamento', name: 'Portamento [ms]', min: 0.1, max: 200, def: 50, logarithmic: true },
    { symbol: 'noise_amount', name: 'Noise Amount', min: 0, max: 1, def: 0.18 },
    { symbol: 'noise_decay', name: 'Noise Decay', min: 0, max: 1, def: 0.5 },
    { symbol: 'noise_cutoff', name: 'Noise Cutoff', min: 20, max: 20000, def: 2000, logarithmic: true },
    { symbol: 'noise_type', name: 'Noise Type', min: 0, max: 2, def: 0, integer: true, scalePoints: [['Uniform', 0], ['Driven', 1], ['Crackle', 2]] },
    { symbol: 'tone', name: 'Tone', min: 300, max: 7000, def: 800, logarithmic: true },
    { symbol: 'level', name: 'Level dB', min: -30, max: 18, def: 0 },
];

if (!existsSync(join(SRC, 'ResonantFilter.cpp'))) {
    console.error(`Source not found: ${SRC} - run fetch-sources.js first`);
    process.exit(1);
}

mkdirSync(OUT, { recursive: true });

writeFileSync(join(OUT, 'chowkick_lv2.cpp'), lv2WrapperSource());
writeFileSync(join(OUT, 'chowkick.ttl'), ttlSource());
writeFileSync(join(OUT, 'manifest.ttl'), manifestSource());
registerPlugin();

console.log('Chow Kick setup complete');
console.log('Run: node scripts/build-instruments.js --only chowkick');

function manifestSource() {
    return `@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<https://github.com/Chowdhury-DSP/ChowKick#instrument>
    a lv2:Plugin, lv2:InstrumentPlugin ;
    lv2:binary <chowkick.so> ;
    rdfs:seeAlso <chowkick.ttl> .
`;
}

function ttlSource() {
    const ports = controls.map((port, offset) => ttlControlBlock(port, 3 + offset)).join(' , ');

    return `@prefix atom:  <http://lv2plug.in/ns/ext/atom#> .
@prefix doap:  <http://usefulinc.com/ns/doap#> .
@prefix lv2:   <http://lv2plug.in/ns/lv2core#> .
@prefix midi:  <http://lv2plug.in/ns/ext/midi#> .
@prefix pprop: <http://lv2plug.in/ns/ext/port-props#> .
@prefix rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#> .
@prefix urid:  <http://lv2plug.in/ns/ext/urid#> .

<https://github.com/Chowdhury-DSP/ChowKick#instrument>
    a lv2:InstrumentPlugin, lv2:Plugin ;
    doap:name "Chow Kick" ;
    doap:description "Physically modeled kick drum synthesizer" ;
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
    ] , ${ports} .
`;
}

function ttlControlBlock(port, index) {
    const props = [];
    if (port.integer) props.push('pprop:integer');
    if (port.toggled) props.push('pprop:toggled');
    if (port.logarithmic) props.push('pprop:logarithmic');
    if (port.scalePoints) props.push('pprop:enumeration');
    const propLine = props.length > 0 ? `\n        lv2:portProperty ${props.join(' , ')} ;` : '';
    const points = (port.scalePoints ?? [])
        .map(([label, value]) => `\n        lv2:scalePoint [ rdfs:label "${label}" ; rdf:value ${value} ] ;`)
        .join('');
    return `[
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index ${index} ;
        lv2:symbol "${port.symbol}" ;
        lv2:name "${port.name}" ;
        lv2:minimum ${port.min} ;
        lv2:maximum ${port.max} ;
        lv2:default ${port.def} ;${propLine}${points}
    ]`;
}

function lv2WrapperSource() {
    return `#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cstring>

#include "lv2/core/lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"

#define CHOWKICK_URI "https://github.com/Chowdhury-DSP/ChowKick#instrument"

enum PortIndex {
    PORT_MIDI_IN = 0,
    PORT_OUT_L,
    PORT_OUT_R,
    PORT_CONTROLS,
};

enum ControlIndex {
${controls.map((port, index) => `    CTRL_${constantName(port.symbol)} = ${index}`).join(',\n')},
};

constexpr int kControlCount = ${controls.length};
constexpr int kMaxVoices = 4;
constexpr float kPi = 3.14159265358979323846f;

static const float kDefaults[kControlCount] = {
${controls.map(port => `    ${floatLiteral(port.def)}`).join(',\n')}
};

struct Voice {
    float freq = 100.0f;
    float target_freq = 100.0f;
    float pulse_amp = 0.0f;
    float pulse_shape = 0.0f;
    float z1 = 0.0f;
    float z2 = 0.0f;
    int pulse_remaining = 0;
};

struct ChowKickLv2 {
    const LV2_Atom_Sequence* midi_in = nullptr;
    float* out_l = nullptr;
    float* out_r = nullptr;
    float* controls[kControlCount] = {};
    std::array<Voice, kMaxVoices> voices {};
    int next_voice = 0;
    float sample_rate = 44100.0f;
    float noise_state = 0.0f;
    float tone_z = 0.0f;
    float dc_x1 = 0.0f;
    float dc_y1 = 0.0f;
    uint32_t rng = 0x12345678u;
    LV2_URID midi_event = 0;
};

static float clampf(float value, float min, float max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, value));
}

static int clampi(float value, int min, int max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, static_cast<int>(std::lround(value))));
}

static float control_value(const ChowKickLv2* self, int index)
{
    return self->controls[index] ? *self->controls[index] : kDefaults[index];
}

static float control_range(const ChowKickLv2* self, int index, float min, float max)
{
    return clampf(control_value(self, index), min, max);
}

static float control_unit(const ChowKickLv2* self, int index)
{
    return control_range(self, index, 0.0f, 1.0f);
}

static float db_to_gain(float db)
{
    return std::pow(10.0f, db / 20.0f);
}

static float midi_note_hz(int note)
{
    return 440.0f * std::pow(2.0f, (static_cast<float>(note) - 69.0f) / 12.0f);
}

static float random_bipolar(ChowKickLv2* self)
{
    self->rng = self->rng * 1664525u + 1013904223u;
    return (static_cast<float>((self->rng >> 8) & 0xffffffu) / 8388608.0f) - 1.0f;
}

static float drive(float x, float amount)
{
    const float d = std::max(0.0001f, amount);
    return std::tanh(x * d) / d;
}

static void drive_values(int mode, float tight, float bounce, float& d1, float& d2, float& d3)
{
    if (mode == 2) {
        d1 = 4.9f * std::pow(tight, 4.0f) + 0.1f;
        const float bounce_scale = 0.7f * tight + 0.3f;
        d3 = std::pow(bounce_scale * bounce, 2.0f) + 0.1f;
        d2 = 0.4f * std::pow(tight, 0.8f) + 0.4f * std::pow(1.0f - bounce, 0.8f) + 0.1f;
        return;
    }
    if (mode == 1) {
        d1 = 4.9f * std::pow(tight, 4.0f) + 0.1f;
        d2 = 4.9f * std::pow(tight, 6.0f) + 0.1f;
        d3 = 4.75f * std::pow(bounce, 3.0f) + 0.25f;
        return;
    }
    d1 = d2 = d3 = 1.0f;
}

static void resonator_coefs(float sample_rate, float freq, float q, float damping, float (&b)[3], float (&a)[3])
{
    const float safe_freq = clampf(freq, 20.0f, std::min(20000.0f, sample_rate * 0.45f));
    const float safe_q = clampf(q, 0.1f, 2.0f);
    const float g = 0.0001f * std::pow(0.5f / 0.0001f, clampf(damping, 0.0f, 1.0f));
    const float wc = safe_freq * kPi * 2.0f / sample_rate;
    const float ws = std::sin(wc);
    const float wc_cos = std::cos(wc);
    const float alpha = ws / (2.0f * safe_q);
    const float a0 = (g + 1.0f) + alpha * g;

    b[0] = (alpha + 1.0f) / a0;
    b[1] = wc_cos * -2.0f / a0;
    b[2] = (1.0f - alpha) / a0;
    a[0] = 1.0f;
    a[1] = wc_cos * -2.0f * (g + 1.0f) / a0;
    a[2] = ((g + 1.0f) - alpha * g) / a0;
}

static float process_resonator(Voice& voice, const float (&b)[3], const float (&a)[3], int mode, float d1, float d2, float d3, float x)
{
    if (mode == 0) {
        const float y = (voice.z1 + x * b[0]) * 0.999999f;
        voice.z1 = voice.z2 + x * b[1] - y * a[1];
        voice.z2 = x * b[2] - y * a[2];
        return y * 0.15f;
    }
    if (mode == 2) {
        const float y = voice.z1 + x * b[0];
        const float y_drive = drive(y, d3);
        voice.z1 = drive(voice.z2 + x * b[1] - y_drive * a[1], d1);
        voice.z2 = drive(x * b[2] - y * a[2], d1);
        return y * d2;
    }

    const float y = voice.z1 + x * b[0];
    const float y_drive = drive(y, d3);
    voice.z1 = drive(voice.z2 + x * b[1] - y_drive * a[1], d1);
    voice.z2 = drive(x * b[2] - y_drive * a[2], d2);
    return y;
}

static float shaped_pulse(ChowKickLv2* self, Voice& voice, float pulse)
{
    const float sustain = control_unit(self, CTRL_SUSTAIN);
    const float decay = control_unit(self, CTRL_DECAY);
    const float sustain_val = 1.0f - std::pow(sustain, 0.05f);
    const float decay_val = std::pow(decay, 2.0f);
    const float time = 0.003f + decay_val * 0.18f;
    const float coeff = std::exp(-1.0f / std::max(1.0f, self->sample_rate * time));
    voice.pulse_shape = std::max(pulse, voice.pulse_shape * coeff);
    const float shaped = pulse + voice.pulse_shape * (0.25f + sustain_val * 1.75f);
    return drive(shaped, 0.8f + decay_val * 5.0f);
}

static float noise_sample(ChowKickLv2* self)
{
    float n = random_bipolar(self);
    const int type = clampi(control_value(self, CTRL_NOISE_TYPE), 0, 2);
    if (type == 1) n = std::tanh(n * 3.0f);
    if (type == 2) n = (random_bipolar(self) > 0.75f ? random_bipolar(self) : n * 0.25f);

    const float cutoff = control_range(self, CTRL_NOISE_CUTOFF, 20.0f, 20000.0f);
    const float alpha = clampf(1.0f - std::exp(-2.0f * kPi * cutoff / self->sample_rate), 0.0f, 1.0f);
    self->noise_state += alpha * (n - self->noise_state);
    return self->noise_state;
}

static float apply_tone(ChowKickLv2* self, float x)
{
    const float tone = control_range(self, CTRL_TONE, 300.0f, 7000.0f);
    const float tone_norm = std::log(tone / 300.0f) / std::log(7000.0f / 300.0f);
    const float tone_makeup_db = (tone_norm - 0.5f) * -6.0f;
    const float bounce_makeup_db = 14.0f * std::pow(control_unit(self, CTRL_BOUNCE), 2.5f);
    const float gain = db_to_gain(control_range(self, CTRL_LEVEL, -30.0f, 18.0f) + bounce_makeup_db + tone_makeup_db + 3.5f);

    const float wc = kPi * 2.0f * tone / self->sample_rate;
    const float c = 1.0f / std::tan(wc * 0.5f);
    const float a0 = c + 1.0f;
    const float b0 = gain / a0;
    const float b1 = b0;
    const float a1 = (1.0f - c) / a0;

    const float y = self->tone_z + x * b0;
    self->tone_z = x * b1 - y * a1;
    return y;
}

static float dc_block(ChowKickLv2* self, float x)
{
    const float y = x - self->dc_x1 + 0.995f * self->dc_y1;
    self->dc_x1 = x;
    self->dc_y1 = y;
    return y;
}

static void note_on(ChowKickLv2* self, int note, int velocity)
{
    const int voice_count = clampi(control_value(self, CTRL_VOICES), 1, kMaxVoices);
    Voice& voice = self->voices[self->next_voice % voice_count];
    self->next_voice = (self->next_voice + 1) % voice_count;

    const float fixed_freq = control_range(self, CTRL_FREQUENCY, 30.0f, 500.0f);
    const float note_freq = midi_note_hz(note) * (fixed_freq / 100.0f);
    const float target = control_unit(self, CTRL_LINK_PITCH) >= 0.5f ? note_freq : fixed_freq;
    if (voice.freq <= 0.0f || !std::isfinite(voice.freq)) voice.freq = target;
    voice.target_freq = target;

    const float velocity_gain = control_unit(self, CTRL_VELOCITY_SENSITIVITY) >= 0.5f
        ? 0.1f + 1.8f * clampf(static_cast<float>(velocity) / 127.0f, 0.0f, 1.0f)
        : 1.0f;
    voice.pulse_amp = control_unit(self, CTRL_PULSE_AMP) * velocity_gain;
    voice.pulse_remaining = std::max(1, static_cast<int>(self->sample_rate * control_range(self, CTRL_PULSE_WIDTH, 0.025f, 2.5f) / 1000.0f));
}

static void all_notes_off(ChowKickLv2* self)
{
    for (Voice& voice : self->voices) voice.pulse_remaining = 0;
}

static void handle_midi(ChowKickLv2* self, uint32_t size, const uint8_t* data)
{
    if (size < 1) return;
    switch (data[0] & 0xf0) {
    case 0x80:
        break;
    case 0x90:
        if (size >= 3 && data[2] > 0) note_on(self, data[1], data[2]);
        break;
    case 0xB0:
        if (size >= 3 && (data[1] == 120 || data[1] == 123)) all_notes_off(self);
        break;
    default:
        break;
    }
}

static float process_sample(ChowKickLv2* self)
{
    const int mode = clampi(control_value(self, CTRL_RES_MODE), 0, 2);
    const float tight = control_unit(self, CTRL_TIGHT);
    const float bounce = control_unit(self, CTRL_BOUNCE);
    float d1 = 1.0f, d2 = 1.0f, d3 = 1.0f;
    drive_values(mode, tight, bounce, d1, d2, d3);

    const float q = control_range(self, CTRL_Q, 0.1f, 2.0f);
    const float damping = control_unit(self, CTRL_DAMPING);
    const float portamento_ms = control_range(self, CTRL_PORTAMENTO, 0.1f, 200.0f);
    const float glide_coeff = std::exp(-1.0f / std::max(1.0f, self->sample_rate * portamento_ms * 0.001f));

    float sum = 0.0f;
    for (Voice& voice : self->voices) {
        voice.freq = voice.target_freq + (voice.freq - voice.target_freq) * glide_coeff;
        float b[3] {};
        float a[3] {};
        resonator_coefs(self->sample_rate, voice.freq, q, damping, b, a);
        const float pulse = voice.pulse_remaining > 0 ? voice.pulse_amp : 0.0f;
        if (voice.pulse_remaining > 0) --voice.pulse_remaining;
        sum += process_resonator(voice, b, a, mode, d1, d2, d3, shaped_pulse(self, voice, pulse));
    }

    const float noise_amount = std::pow(control_unit(self, CTRL_NOISE_AMOUNT), 2.0f);
    const float noise_decay = std::pow(1.0f - control_unit(self, CTRL_NOISE_DECAY), 2.5f) * 2.0f + 1.0f;
    const float noise_env = std::pow(clampf(std::fabs(sum) * 4.0f, 0.0f, 1.0f), noise_decay);
    sum += noise_amount * noise_env * noise_sample(self);

    return clampf(dc_block(self, apply_tone(self, sum)), -1.25f, 1.25f);
}

static void render_segment(ChowKickLv2* self, uint32_t offset, uint32_t frames)
{
    for (uint32_t i = 0; i < frames; ++i) {
        const float sample = process_sample(self);
        self->out_l[offset + i] = sample;
        if (self->out_r) self->out_r[offset + i] = sample;
    }
}

static LV2_Handle instantiate(
    const LV2_Descriptor*,
    double rate,
    const char*,
    const LV2_Feature* const* features)
{
    auto* self = new ChowKickLv2();
    self->sample_rate = static_cast<float>(rate);
    for (const LV2_Feature* const* feature = features; feature && *feature; ++feature) {
        if (!std::strcmp((*feature)->URI, LV2_URID__map)) {
            auto* map = static_cast<LV2_URID_Map*>((*feature)->data);
            self->midi_event = map->map(map->handle, LV2_MIDI__MidiEvent);
        }
    }
    for (Voice& voice : self->voices) {
        voice.freq = control_value(self, CTRL_FREQUENCY);
        voice.target_freq = voice.freq;
    }
    return self;
}

static void connect_port(LV2_Handle instance, uint32_t port, void* data)
{
    auto* self = static_cast<ChowKickLv2*>(instance);
    switch (port) {
    case PORT_MIDI_IN:
        self->midi_in = static_cast<const LV2_Atom_Sequence*>(data);
        break;
    case PORT_OUT_L:
        self->out_l = static_cast<float*>(data);
        break;
    case PORT_OUT_R:
        self->out_r = static_cast<float*>(data);
        break;
    default:
        if (port >= PORT_CONTROLS && port < PORT_CONTROLS + kControlCount) {
            self->controls[port - PORT_CONTROLS] = static_cast<float*>(data);
        }
        break;
    }
}

static void activate(LV2_Handle instance)
{
    auto* self = static_cast<ChowKickLv2*>(instance);
    self->tone_z = self->dc_x1 = self->dc_y1 = self->noise_state = 0.0f;
    for (Voice& voice : self->voices) {
        voice = Voice {};
        voice.freq = control_value(self, CTRL_FREQUENCY);
        voice.target_freq = voice.freq;
    }
}

static void run(LV2_Handle instance, uint32_t frames)
{
    auto* self = static_cast<ChowKickLv2*>(instance);
    if (!self->out_l) return;

    std::fill(self->out_l, self->out_l + frames, 0.0f);
    if (self->out_r) std::fill(self->out_r, self->out_r + frames, 0.0f);

    uint32_t rendered = 0;
    if (self->midi_in) {
        LV2_ATOM_SEQUENCE_FOREACH(self->midi_in, event) {
            if (event->body.type != self->midi_event) continue;
            const uint32_t frame = std::min<uint32_t>(event->time.frames, frames);
            if (frame > rendered) {
                render_segment(self, rendered, frame - rendered);
                rendered = frame;
            }
            handle_midi(self, event->body.size, static_cast<const uint8_t*>(LV2_ATOM_BODY(&event->body)));
        }
    }
    if (rendered < frames) render_segment(self, rendered, frames - rendered);
}

static void deactivate(LV2_Handle instance)
{
    all_notes_off(static_cast<ChowKickLv2*>(instance));
}

static void cleanup(LV2_Handle instance)
{
    delete static_cast<ChowKickLv2*>(instance);
}

static const void* extension_data(const char*)
{
    return nullptr;
}

static const LV2_Descriptor descriptor = {
    CHOWKICK_URI,
    instantiate,
    connect_port,
    activate,
    run,
    deactivate,
    cleanup,
    extension_data,
};

extern "C" LV2_SYMBOL_EXPORT const LV2_Descriptor* lv2_descriptor(uint32_t index)
{
    return index == 0 ? &descriptor : nullptr;
}
`;
}

function registerPlugin() {
    const entry = {
        id: 'chowkick',
        description: 'Chow Kick - physically modeled kick drum synthesizer',
        category: 'Instruments',
        sources: [
            'chowkick_lv2.cpp',
        ],
        includes: [
            'plugins/chowkick',
        ],
        defines: [
            'NDEBUG',
        ],
    };

    const registry = readLv2Registry(ROOT);
    const existing = registry.findIndex(item => item.id === 'chowkick');
    if (existing >= 0) registry[existing] = entry;
    else registry.push(entry);
    writeLv2Registry(ROOT, registry);
}

function constantName(symbol) {
    return symbol.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function floatLiteral(value) {
    const text = Number(value).toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
    return `${text.includes('.') ? text : `${text}.0`}f`;
}
