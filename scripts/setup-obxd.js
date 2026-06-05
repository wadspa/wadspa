#!/usr/bin/env node
/**
 * Setup script for Obxd.
 *
 * The upstream plugin is JUCE-based, but the Oberheim-style voice engine under
 * source/Engine is header-only and can be hosted directly. This setup copies
 * that engine, supplies the small JUCE math/random helpers it uses, and wraps it
 * as a browser-buildable LV2 MIDI instrument.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'distrho-ports', 'ports-juce5', 'obxd', 'source', 'Engine');
const OUT = join(ROOT, 'plugins', 'obxd');
const OUT_ENGINE = join(OUT, 'Engine');

const controls = [
    { symbol: 'volume', name: 'Volume', min: 0, max: 1, def: 0.65 },
    { symbol: 'voice_count', name: 'Voice Count', min: 1, max: 8, def: 8, integer: true },
    { symbol: 'tune', name: 'Tune', min: 0, max: 1, def: 0.5 },
    { symbol: 'octave', name: 'Octave', min: 0, max: 1, def: 0.5 },
    { symbol: 'unison', name: 'Unison', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'voice_detune', name: 'Voice Detune', min: 0, max: 1, def: 0.2 },
    { symbol: 'osc2_detune', name: 'Oscillator 2 Detune', min: 0, max: 1, def: 0.4 },
    { symbol: 'osc1_mix', name: 'Oscillator 1 Mix', min: 0, max: 1, def: 1 },
    { symbol: 'osc2_mix', name: 'Oscillator 2 Mix', min: 0, max: 1, def: 1 },
    { symbol: 'noise_mix', name: 'Noise Mix', min: 0, max: 1, def: 0 },
    { symbol: 'osc1_saw', name: 'Oscillator 1 Saw', min: 0, max: 1, def: 1, integer: true, toggled: true },
    { symbol: 'osc1_pulse', name: 'Oscillator 1 Pulse', min: 0, max: 1, def: 1, integer: true, toggled: true },
    { symbol: 'osc2_saw', name: 'Oscillator 2 Saw', min: 0, max: 1, def: 1, integer: true, toggled: true },
    { symbol: 'osc2_pulse', name: 'Oscillator 2 Pulse', min: 0, max: 1, def: 1, integer: true, toggled: true },
    { symbol: 'pulse_width', name: 'Pulse Width', min: 0, max: 1, def: 0.5 },
    { symbol: 'cutoff', name: 'Filter Cutoff', min: 0, max: 1, def: 0.7 },
    { symbol: 'brightness', name: 'Brightness', min: 0, max: 1, def: 1 },
    { symbol: 'resonance', name: 'Filter Resonance', min: 0, max: 1, def: 0.22 },
    { symbol: 'filter_env_amount', name: 'Filter Envelope Amount', min: 0, max: 1, def: 0.35 },
    { symbol: 'filter_mode', name: 'Filter Morph', min: 0, max: 1, def: 0.5 },
    { symbol: 'bandpass_blend', name: 'Bandpass Blend', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'four_pole', name: 'Four Pole Slope', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'amp_attack', name: 'Amp Attack', min: 0, max: 0.65, def: 0.05, logarithmic: true },
    { symbol: 'amp_decay', name: 'Amp Decay', min: 0, max: 0.65, def: 0.18, logarithmic: true },
    { symbol: 'amp_sustain', name: 'Amp Sustain', min: 0, max: 1, def: 0.75 },
    { symbol: 'amp_release', name: 'Amp Release', min: 0, max: 0.65, def: 0.18, logarithmic: true },
    { symbol: 'filter_attack', name: 'Filter Attack', min: 0, max: 0.65, def: 0.03, logarithmic: true },
    { symbol: 'filter_decay', name: 'Filter Decay', min: 0, max: 0.65, def: 0.22, logarithmic: true },
    { symbol: 'filter_sustain', name: 'Filter Sustain', min: 0, max: 1, def: 0.35 },
    { symbol: 'filter_release', name: 'Filter Release', min: 0, max: 0.65, def: 0.18, logarithmic: true },
    { symbol: 'lfo_frequency', name: 'LFO Frequency', min: 0, max: 1, def: 0.35 },
    { symbol: 'lfo_pitch_amount', name: 'LFO Pitch Amount', min: 0, max: 1, def: 0.12 },
    { symbol: 'lfo_sine', name: 'LFO Sine Wave', min: 0, max: 1, def: 1, integer: true, toggled: true },
    { symbol: 'lfo_square', name: 'LFO Square Wave', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'lfo_sample_hold', name: 'LFO Sample Hold Wave', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'lfo_osc1', name: 'LFO Oscillator 1', min: 0, max: 1, def: 1, integer: true, toggled: true },
    { symbol: 'lfo_osc2', name: 'LFO Oscillator 2', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'lfo_filter', name: 'LFO Filter', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'xmod', name: 'Oscillator Cross Mod', min: 0, max: 1, def: 0 },
    { symbol: 'osc2_hard_sync', name: 'Oscillator 2 Hard Sync', min: 0, max: 1, def: 0, integer: true, toggled: true },
];

if (!existsSync(join(SRC, 'SynthEngine.h'))) {
    console.error(`Source not found: ${SRC} - run fetch-sources.js first`);
    process.exit(1);
}

mkdirSync(OUT_ENGINE, { recursive: true });

for (const file of readdirSync(SRC).filter(name => name.endsWith('.h'))) {
    copyTextFile(join(SRC, file), join(OUT_ENGINE, file));
}

patchEngine();
writeFileSync(join(OUT_ENGINE, 'ObxdCompat.h'), compatHeaderSource());
writeFileSync(join(OUT, 'obxd_lv2.cpp'), lv2WrapperSource());
writeFileSync(join(OUT, 'obxd.ttl'), ttlSource());
writeFileSync(join(OUT, 'manifest.ttl'), manifestSource());
registerPlugin();

console.log('Obxd setup complete');
console.log('Run: node scripts/build-instruments.js --only obxd');

function copyTextFile(src, dest) {
    const text = readFileSync(src, 'utf8')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+$/gm, '')
        .replace(/\n+$/g, '\n');
    writeFileSync(dest, text);
}

function patchEngine() {
    const synthPath = join(OUT_ENGINE, 'SynthEngine.h');
    writeFileSync(
        synthPath,
        readFileSync(synthPath, 'utf8')
            .replace('#include "../PluginProcessor.h"\n', '#include "ObxdCompat.h"\n')
    );
}

function compatHeaderSource() {
    return `#pragma once

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <limits>
#include <string>
#include <type_traits>

namespace juce {
constexpr float float_Pi = 3.14159265358979323846f;
}

constexpr float float_Pi = juce::float_Pi;
using String = std::string;

template <typename A, typename B>
constexpr std::common_type_t<A, B> jmin(A a, B b)
{
    return a < b ? a : b;
}

template <typename A, typename B>
constexpr std::common_type_t<A, B> jmax(A a, B b)
{
    return a > b ? a : b;
}

template <typename T>
constexpr T jlimit(T low, T high, T value)
{
    return value < low ? low : (value > high ? high : value);
}

inline int roundToInt(float value)
{
    return static_cast<int>(std::lround(value));
}

inline void zeromem(void* data, std::size_t bytes)
{
    std::memset(data, 0, bytes);
}

class Random {
public:
    Random() : state_(0x6d2b79f5d4a7c15ULL) {}
    explicit Random(std::int64_t seed) : state_(static_cast<std::uint64_t>(seed) | 1ULL) {}

    static Random& getSystemRandom()
    {
        static Random random(0x4f1bbcdd3a31d5bULL);
        return random;
    }

    std::int64_t nextInt64()
    {
        return static_cast<std::int64_t>(nextU64());
    }

    float nextFloat()
    {
        return static_cast<float>((nextU64() >> 40) & 0xffffff) / static_cast<float>(0x1000000);
    }

private:
    std::uint64_t state_;

    std::uint64_t nextU64()
    {
        state_ += 0x9e3779b97f4a7c15ULL;
        std::uint64_t z = state_;
        z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9ULL;
        z = (z ^ (z >> 27)) * 0x94d049bb133111ebULL;
        return z ^ (z >> 31);
    }
};
`;
}

function manifestSource() {
    return `@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<http://distrho.sf.net/plugins/obxd>
    a lv2:Plugin, lv2:InstrumentPlugin ;
    lv2:binary <obxd.so> ;
    rdfs:seeAlso <obxd.ttl> .
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

<http://distrho.sf.net/plugins/obxd>
    a lv2:InstrumentPlugin, lv2:Plugin ;
    doap:name "Obxd" ;
    doap:description "Oberheim OB-X style virtual analog synthesizer" ;
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
#include <cmath>
#include <cstdint>
#include <cstring>

#include "lv2/core/lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"

#include "Engine/SynthEngine.h"

#define OBXD_URI "http://distrho.sf.net/plugins/obxd"

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
static const float kDefaults[kControlCount] = {
${controls.map(port => `    ${floatLiteral(port.def)}`).join(',\n')}
};

struct ObxdLv2 {
    const LV2_Atom_Sequence* midi_in = nullptr;
    float* out_l = nullptr;
    float* out_r = nullptr;
    float* controls[kControlCount] = {};
    SynthEngine synth;
    LV2_URID midi_event = 0;
};

static float clampf(float value, float min, float max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, value));
}

static float control_value(const ObxdLv2* self, int index)
{
    return self->controls[index] ? *self->controls[index] : kDefaults[index];
}

static float control_unit(const ObxdLv2* self, int index)
{
    return clampf(control_value(self, index), 0.0f, 1.0f);
}

static float control_range(const ObxdLv2* self, int index, float min, float max)
{
    return clampf(control_value(self, index), min, max);
}

static void apply_controls(ObxdLv2* self)
{
    self->synth.processVolume(control_unit(self, CTRL_VOLUME));
    self->synth.setVoiceCount((control_range(self, CTRL_VOICE_COUNT, 1.0f, 8.0f) - 1.0f) / 7.0f);
    self->synth.processTune(control_unit(self, CTRL_TUNE));
    self->synth.processOctave(control_unit(self, CTRL_OCTAVE));
    self->synth.processUnison(control_unit(self, CTRL_UNISON));
    self->synth.processDetune(control_unit(self, CTRL_VOICE_DETUNE));
    self->synth.processOsc2Det(control_unit(self, CTRL_OSC2_DETUNE));
    self->synth.processOsc1Mix(control_unit(self, CTRL_OSC1_MIX));
    self->synth.processOsc2Mix(control_unit(self, CTRL_OSC2_MIX));
    self->synth.processNoiseMix(control_unit(self, CTRL_NOISE_MIX));
    self->synth.processOsc1Saw(control_unit(self, CTRL_OSC1_SAW));
    self->synth.processOsc1Pulse(control_unit(self, CTRL_OSC1_PULSE));
    self->synth.processOsc2Saw(control_unit(self, CTRL_OSC2_SAW));
    self->synth.processOsc2Pulse(control_unit(self, CTRL_OSC2_PULSE));
    self->synth.processPulseWidth(control_unit(self, CTRL_PULSE_WIDTH));
    self->synth.processCutoff(control_unit(self, CTRL_CUTOFF));
    self->synth.processBrightness(control_unit(self, CTRL_BRIGHTNESS));
    self->synth.processResonance(control_unit(self, CTRL_RESONANCE));
    self->synth.processFilterEnvelopeAmt(control_unit(self, CTRL_FILTER_ENV_AMOUNT));
    self->synth.processMultimode(control_unit(self, CTRL_FILTER_MODE));
    self->synth.processBandpassSw(control_unit(self, CTRL_BANDPASS_BLEND));
    self->synth.processFourPole(control_unit(self, CTRL_FOUR_POLE));
    self->synth.processLoudnessEnvelopeAttack(control_range(self, CTRL_AMP_ATTACK, 0.0f, 0.65f));
    self->synth.processLoudnessEnvelopeDecay(control_range(self, CTRL_AMP_DECAY, 0.0f, 0.65f));
    self->synth.processLoudnessEnvelopeSustain(control_unit(self, CTRL_AMP_SUSTAIN));
    self->synth.processLoudnessEnvelopeRelease(control_range(self, CTRL_AMP_RELEASE, 0.0f, 0.65f));
    self->synth.processFilterEnvelopeAttack(control_range(self, CTRL_FILTER_ATTACK, 0.0f, 0.65f));
    self->synth.processFilterEnvelopeDecay(control_range(self, CTRL_FILTER_DECAY, 0.0f, 0.65f));
    self->synth.processFilterEnvelopeSustain(control_unit(self, CTRL_FILTER_SUSTAIN));
    self->synth.processFilterEnvelopeRelease(control_range(self, CTRL_FILTER_RELEASE, 0.0f, 0.65f));
    self->synth.processLfoFrequency(control_unit(self, CTRL_LFO_FREQUENCY));
    self->synth.processLfoAmt1(control_unit(self, CTRL_LFO_PITCH_AMOUNT));
    self->synth.processLfoSine(control_unit(self, CTRL_LFO_SINE));
    self->synth.processLfoSquare(control_unit(self, CTRL_LFO_SQUARE));
    self->synth.processLfoSH(control_unit(self, CTRL_LFO_SAMPLE_HOLD));
    self->synth.processLfoOsc1(control_unit(self, CTRL_LFO_OSC1));
    self->synth.processLfoOsc2(control_unit(self, CTRL_LFO_OSC2));
    self->synth.processLfoFilter(control_unit(self, CTRL_LFO_FILTER));
    self->synth.processOsc2Xmod(control_unit(self, CTRL_XMOD));
    self->synth.processOsc2HardSync(control_unit(self, CTRL_OSC2_HARD_SYNC));
}

static void note_on(ObxdLv2* self, int note, int velocity)
{
    self->synth.procNoteOn(note, clampf(static_cast<float>(velocity) / 127.0f, 0.0f, 1.0f));
}

static void note_off(ObxdLv2* self, int note)
{
    self->synth.procNoteOff(note);
}

static void all_notes_off(ObxdLv2* self)
{
    self->synth.allNotesOff();
}

static void handle_midi(ObxdLv2* self, uint32_t size, const uint8_t* data)
{
    if (size < 1) return;
    switch (data[0] & 0xf0) {
    case 0x80:
        if (size >= 3) note_off(self, data[1]);
        break;
    case 0x90:
        if (size >= 3) {
            if (data[2] > 0) note_on(self, data[1], data[2]);
            else note_off(self, data[1]);
        }
        break;
    case 0xB0:
        if (size >= 3) {
            if (data[1] == 1) self->synth.procModWheel(static_cast<float>(data[2]) / 127.0f);
            if (data[1] == 64) {
                if (data[2] >= 64) self->synth.sustainOn();
                else self->synth.sustainOff();
            }
            if (data[1] == 120 || data[1] == 123) all_notes_off(self);
        }
        break;
    case 0xE0:
        if (size >= 3) {
            const int value = (static_cast<int>(data[2]) << 7) | data[1];
            self->synth.procPitchWheel((static_cast<float>(value) - 8192.0f) / 8192.0f);
        }
        break;
    default:
        break;
    }
}

static float sanitize_audio(float value)
{
    if (!std::isfinite(value)) return 0.0f;
    return std::max(-1.25f, std::min(1.25f, value));
}

static void render_segment(ObxdLv2* self, uint32_t offset, uint32_t frames)
{
    for (uint32_t i = 0; i < frames; ++i) {
        float left = 0.0f;
        float right = 0.0f;
        self->synth.processSample(&left, &right);
        self->out_l[offset + i] = sanitize_audio(left);
        if (self->out_r) self->out_r[offset + i] = sanitize_audio(right);
    }
}

static LV2_Handle instantiate(
    const LV2_Descriptor*,
    double rate,
    const char*,
    const LV2_Feature* const* features)
{
    auto* self = new ObxdLv2();
    for (const LV2_Feature* const* feature = features; feature && *feature; ++feature) {
        if (!std::strcmp((*feature)->URI, LV2_URID__map)) {
            auto* map = static_cast<LV2_URID_Map*>((*feature)->data);
            self->midi_event = map->map(map->handle, LV2_MIDI__MidiEvent);
        }
    }
    self->synth.setSampleRate(static_cast<float>(rate));
    apply_controls(self);
    return self;
}

static void connect_port(LV2_Handle instance, uint32_t port, void* data)
{
    auto* self = static_cast<ObxdLv2*>(instance);
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
    auto* self = static_cast<ObxdLv2*>(instance);
    self->synth.allSoundOff();
    apply_controls(self);
}

static void run(LV2_Handle instance, uint32_t frames)
{
    auto* self = static_cast<ObxdLv2*>(instance);
    if (!self->out_l) return;

    apply_controls(self);
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
    all_notes_off(static_cast<ObxdLv2*>(instance));
}

static void cleanup(LV2_Handle instance)
{
    delete static_cast<ObxdLv2*>(instance);
}

static const void* extension_data(const char*)
{
    return nullptr;
}

static const LV2_Descriptor descriptor = {
    OBXD_URI,
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
        id: 'obxd',
        description: 'Obxd - Oberheim OB-X style virtual analog synthesizer',
        category: 'Instruments',
        sources: [
            'obxd_lv2.cpp',
        ],
        includes: [
            'plugins/obxd',
            'plugins/obxd/Engine',
        ],
        defines: [
            'NDEBUG',
        ],
    };

    const registry = readLv2Registry(ROOT);
    const existing = registry.findIndex(item => item.id === 'obxd');
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
