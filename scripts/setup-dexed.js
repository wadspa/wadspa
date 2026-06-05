#!/usr/bin/env node
/**
 * Setup script for Dexed.
 *
 * Dexed's JUCE wrapper is large, but the original DX7 FM voice engine under
 * source/msfa is self-contained. This setup extracts that engine from either a
 * standalone Dexed checkout or the bundled DISTRHO-Ports copy and wraps it as a
 * browser-buildable LV2 MIDI instrument.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'plugins', 'dexed');
const OUT_MSFA = join(OUT, 'msfa');

const SOURCE_CANDIDATES = [
    join(ROOT, 'dexed', 'Source'),
    join(ROOT, 'dexed', 'source'),
    join(ROOT, 'distrho-ports', 'ports-juce5', 'dexed', 'source'),
];

const SRC = SOURCE_CANDIDATES.find(path => existsSync(join(path, 'msfa', 'dx7note.cc')));
if (!SRC) {
    console.error('Dexed source not found - run fetch-sources.js first');
    process.exit(1);
}

mkdirSync(OUT_MSFA, { recursive: true });

copyTextFile(join(SRC, 'Dexed.h'), join(OUT, 'Dexed.h'));

const msfaFiles = [
    'aligned_buf.h',
    'controllers.h',
    'dx7note.cc',
    'dx7note.h',
    'env.cc',
    'env.h',
    'exp2.cc',
    'exp2.h',
    'fm_core.cc',
    'fm_core.h',
    'fm_op_kernel.cc',
    'fm_op_kernel.h',
    'freqlut.cc',
    'freqlut.h',
    'lfo.cc',
    'lfo.h',
    'module.h',
    'pitchenv.cc',
    'pitchenv.h',
    'sin.cc',
    'sin.h',
    'synth.h',
];

for (const file of msfaFiles) {
    copyTextFile(join(SRC, 'msfa', file), join(OUT_MSFA, file));
}

patchDx7Note();
writeFileSync(join(OUT, 'dexed_lv2.cpp'), lv2WrapperSource());
writeFileSync(join(OUT, 'dexed.ttl'), ttlSource());
writeFileSync(join(OUT, 'manifest.ttl'), manifestSource());
registerPlugin();

console.log('Dexed setup complete');
console.log('Run: node scripts/build-instruments.js --only dexed');

function patchDx7Note() {
    const path = join(OUT_MSFA, 'dx7note.cc');
    const src = readFileSync(path, 'utf8');
    writeFileSync(path, src.replace(
        `Dx7Note::Dx7Note() {
    for(int op=0;op<6;op++) {
        params_[op].phase = 0;
        params_[op].gain_out = 0;
    }
}`,
        `Dx7Note::Dx7Note() {
    for(int op=0;op<6;op++) {
        params_[op].phase = 0;
        params_[op].gain_out = 0;
    }
    fb_buf_[0] = 0;
    fb_buf_[1] = 0;
    fb_shift_ = 16;
    algorithm_ = 0;
    pitchmoddepth_ = 0;
    pitchmodsens_ = 0;
    ampmoddepth_ = 0;
}`
    ));
}

function copyTextFile(src, dest) {
    const text = readFileSync(src, 'utf8')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+$/gm, '')
        .replace(/\n+$/g, '\n');
    writeFileSync(dest, text);
}

function manifestSource() {
    return `@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<https://asb2m10.github.io/dexed#instrument>
    a lv2:Plugin, lv2:InstrumentPlugin ;
    lv2:binary <dexed.so> ;
    rdfs:seeAlso <dexed.ttl> .
`;
}

function ttlSource() {
    const ports = [
        integerPort(3, 'algorithm', 'Algorithm', 0, 31, 0),
        integerPort(4, 'feedback', 'Feedback', 0, 7, 7),
        integerPort(5, 'transpose', 'Transpose', -24, 24, 0),
        integerPort(6, 'lfo_rate', 'LFO Rate', 0, 99, 35),
        integerPort(7, 'lfo_delay', 'LFO Delay', 0, 99, 0),
        integerPort(8, 'lfo_pitch_depth', 'LFO Pitch Depth', 0, 99, 0),
        controlPort(9, 'output_gain', 'Output Gain', 0.1, 1.25, 0.7),
        ...operatorPorts(10),
    ].join(' , ');

    return `@prefix atom:  <http://lv2plug.in/ns/ext/atom#> .
@prefix doap:  <http://usefulinc.com/ns/doap#> .
@prefix lv2:   <http://lv2plug.in/ns/lv2core#> .
@prefix midi:  <http://lv2plug.in/ns/ext/midi#> .
@prefix pprop: <http://lv2plug.in/ns/ext/port-props#> .
@prefix rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#> .
@prefix urid:  <http://lv2plug.in/ns/ext/urid#> .

<https://asb2m10.github.io/dexed#instrument>
    a lv2:InstrumentPlugin, lv2:Plugin ;
    doap:name "Dexed" ;
    doap:description "DX7-compatible six-operator FM synthesizer" ;
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

function operatorPorts(startIndex) {
    const ports = [];
    let index = startIndex;
    for (let op = 1; op <= 6; op++) {
        ports.push(integerPort(index++, `op${op}_level`, `Operator ${op} Level`, 0, 99, 99));
        ports.push(integerPort(index++, `op${op}_coarse`, `Operator ${op} Coarse`, 0, 31, 1));
        ports.push(integerPort(index++, `op${op}_fine`, `Operator ${op} Fine`, 0, 99, 0));
        ports.push(integerPort(index++, `op${op}_detune`, `Operator ${op} Detune`, -7, 7, 0));
    }
    return ports;
}

function controlPort(index, symbol, name, min, max, def) {
    return `[
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index ${index} ;
        lv2:symbol "${symbol}" ;
        lv2:name "${name}" ;
        lv2:minimum ${min} ;
        lv2:maximum ${max} ;
        lv2:default ${def} ;
    ]`;
}

function integerPort(index, symbol, name, min, max, def) {
    return `[
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index ${index} ;
        lv2:symbol "${symbol}" ;
        lv2:name "${name}" ;
        lv2:minimum ${min} ;
        lv2:maximum ${max} ;
        lv2:default ${def} ;
        lv2:portProperty pprop:integer ;
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

#include "msfa/aligned_buf.h"
#include "msfa/controllers.h"
#include "msfa/dx7note.h"
#include "msfa/env.h"
#include "msfa/exp2.h"
#include "msfa/fm_core.h"
#include "msfa/freqlut.h"
#include "msfa/lfo.h"
#include "msfa/pitchenv.h"
#include "msfa/sin.h"

#define DEXED_URI "https://asb2m10.github.io/dexed#instrument"

enum PortIndex {
    PORT_MIDI_IN = 0,
    PORT_OUT_L,
    PORT_OUT_R,
    PORT_ALGORITHM,
    PORT_FEEDBACK,
    PORT_TRANSPOSE,
    PORT_LFO_RATE,
    PORT_LFO_DELAY,
    PORT_LFO_PITCH_DEPTH,
    PORT_OUTPUT_GAIN,
    PORT_OP_CONTROLS,
};

constexpr int kVoiceCount = 16;
constexpr int kOperatorCount = 6;
constexpr int kOperatorControlCount = 4;
constexpr int kControlCount = 7 + kOperatorCount * kOperatorControlCount;

struct Voice {
    Dx7Note note;
    int midi_note = -1;
    int velocity = 0;
    bool live = false;
    bool keydown = false;
};

struct Dexed {
    const LV2_Atom_Sequence* midi_in = nullptr;
    float* out_l = nullptr;
    float* out_r = nullptr;
    float* controls[kControlCount] = {};
    float output_gain = 0.7f;
    uint8_t patch[156] = {};
    uint8_t last_lfo[6] = {};
    Voice voices[kVoiceCount];
    int next_voice = 0;
    FmCore core;
    Controllers controllers;
    Lfo lfo;
    LV2_URID midi_event = 0;
};

static const uint8_t kInitVoice[156] = {
    99, 99, 99, 99, 99, 99, 99, 0, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 7,
    99, 99, 99, 99, 99, 99, 99, 0, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 7,
    99, 99, 99, 99, 99, 99, 99, 0, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 7,
    99, 99, 99, 99, 99, 99, 99, 0, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 7,
    99, 99, 99, 99, 99, 99, 99, 0, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 7,
    99, 99, 99, 99, 99, 99, 99, 0, 39, 0, 0, 0, 0, 0, 0, 0, 99, 0, 1, 0, 7,
    99, 99, 99, 99, 50, 50, 50, 50, 0, 0, 1, 35, 0, 0, 0, 1, 0, 3, 24,
    73, 78, 73, 84, 32, 86, 79, 73, 67, 69, 0
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

static void init_tables(double sample_rate)
{
    static bool once = false;
    if (!once) {
        Exp2::init();
        Tanh::init();
        Sin::init();
        once = true;
    }
    Freqlut::init(sample_rate);
    Lfo::init(sample_rate);
    PitchEnv::init(sample_rate);
    Env::init_sr(sample_rate);
}

static void init_controllers(Dexed* self)
{
    std::memset(self->controllers.values_, 0, sizeof(self->controllers.values_));
    self->controllers.values_[kControllerPitch] = 0x2000;
    self->controllers.values_[kControllerPitchRange] = 3;
    self->controllers.values_[kControllerPitchStep] = 0;
    self->controllers.modwheel_cc = 0;
    self->controllers.foot_cc = 0;
    self->controllers.breath_cc = 0;
    self->controllers.aftertouch_cc = 0;
    self->controllers.masterTune = 0;
    std::strcpy(self->controllers.opSwitch, "111111");
    self->controllers.core = &self->core;
    self->controllers.refresh();
}

static void reset_patch(Dexed* self)
{
    std::memcpy(self->patch, kInitVoice, sizeof(self->patch));
    std::memcpy(self->last_lfo, self->patch + 137, sizeof(self->last_lfo));
    self->output_gain = 0.7f;
    self->lfo.reset(self->patch + 137);
}

static void update_live_voices(Dexed* self)
{
    for (Voice& voice : self->voices) {
        if (!voice.live) continue;
        voice.note.update(self->patch, voice.midi_note, voice.velocity);
    }
}

static bool apply_controls(Dexed* self)
{
    bool patch_changed = false;
    bool lfo_changed = false;
    auto set_byte = [&](int offset, int value) {
        const uint8_t byte = static_cast<uint8_t>(std::max(0, std::min(127, value)));
        if (self->patch[offset] == byte) return;
        self->patch[offset] = byte;
        patch_changed = true;
        if (offset >= 137 && offset <= 142) lfo_changed = true;
    };
    auto value = [&](int index, float fallback) {
        return self->controls[index] ? *self->controls[index] : fallback;
    };

    set_byte(134, clampi(value(0, 0.0f), 0, 31));
    set_byte(135, clampi(value(1, 7.0f), 0, 7));
    set_byte(144, clampi(value(2, 0.0f), -24, 24) + 24);
    set_byte(137, clampi(value(3, 35.0f), 0, 99));
    set_byte(138, clampi(value(4, 0.0f), 0, 99));
    const int lfo_pitch_depth = clampi(value(5, 0.0f), 0, 99);
    set_byte(139, lfo_pitch_depth);
    set_byte(143, lfo_pitch_depth > 0 ? 7 : 3);

    self->output_gain = clampf(value(6, 0.7f), 0.1f, 1.25f);

    for (int op = 0; op < kOperatorCount; ++op) {
        const int control = 7 + op * kOperatorControlCount;
        const int offset = op * 21;
        set_byte(offset + 16, clampi(value(control, 99.0f), 0, 99));
        set_byte(offset + 18, clampi(value(control + 1, 1.0f), 0, 31));
        set_byte(offset + 19, clampi(value(control + 2, 0.0f), 0, 99));
        set_byte(offset + 20, clampi(value(control + 3, 0.0f), -7, 7) + 7);
    }

    if (lfo_changed && std::memcmp(self->last_lfo, self->patch + 137, sizeof(self->last_lfo)) != 0) {
        std::memcpy(self->last_lfo, self->patch + 137, sizeof(self->last_lfo));
        self->lfo.reset(self->patch + 137);
    }

    if (patch_changed) update_live_voices(self);
    return patch_changed;
}

static Voice* allocate_voice(Dexed* self)
{
    for (int i = 0; i < kVoiceCount; ++i) {
        Voice& candidate = self->voices[(self->next_voice + i) % kVoiceCount];
        if (!candidate.keydown) {
            self->next_voice = (self->next_voice + i + 1) % kVoiceCount;
            return &candidate;
        }
    }
    Voice& stolen = self->voices[self->next_voice];
    self->next_voice = (self->next_voice + 1) % kVoiceCount;
    return &stolen;
}

static void note_on(Dexed* self, int note, int velocity)
{
    Voice* voice = allocate_voice(self);
    const int dx_note = note + static_cast<int>(self->patch[144]) - 24;
    self->lfo.keydown();
    voice->midi_note = dx_note;
    voice->velocity = std::max(1, std::min(127, velocity));
    voice->keydown = true;
    voice->live = true;
    voice->note.init(self->patch, dx_note, voice->velocity);
    if (self->patch[136] != 0) voice->note.oscSync();
}

static void note_off(Dexed* self, int note)
{
    const int dx_note = note + static_cast<int>(self->patch[144]) - 24;
    for (Voice& voice : self->voices) {
        if (voice.keydown && voice.midi_note == dx_note) {
            voice.keydown = false;
            voice.note.keyup();
            return;
        }
    }
}

static void all_notes_off(Dexed* self)
{
    for (Voice& voice : self->voices) {
        if (voice.live || voice.keydown) {
            voice.keydown = false;
            voice.live = false;
            voice.note.keyup();
        }
    }
}

static void handle_midi(Dexed* self, uint32_t size, const uint8_t* data)
{
    if (size < 1) return;
    const uint8_t status = data[0] & 0xf0;
    switch (status) {
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
            if (data[1] == 1) self->controllers.modwheel_cc = data[2];
            if (data[1] == 2) self->controllers.breath_cc = data[2];
            if (data[1] == 4) self->controllers.foot_cc = data[2];
            if (data[1] == 123 || data[1] == 120) all_notes_off(self);
            self->controllers.refresh();
        }
        break;
    case 0xD0:
        if (size >= 2) {
            self->controllers.aftertouch_cc = data[1];
            self->controllers.refresh();
        }
        break;
    case 0xE0:
        if (size >= 3) {
            self->controllers.values_[kControllerPitch] = (static_cast<int>(data[2]) << 7) | data[1];
        }
        break;
    default:
        break;
    }
}

static float fixed_to_float(int32_t value)
{
    int32_t scaled = value >> 4;
    const int clip = scaled < -(1 << 24) ? 0x8000 : scaled >= (1 << 24) ? 0x7fff : scaled >> 9;
    return std::max(-1.0f, std::min(1.0f, static_cast<float>(clip) / static_cast<float>(0x8000)));
}

static void render_segment(Dexed* self, uint32_t offset, uint32_t frames)
{
    if (!self->out_l) return;
    uint32_t done = 0;
    while (done < frames) {
        AlignedBuf<int32_t, N> buffer;
        for (int i = 0; i < N; ++i) buffer.get()[i] = 0;

        const int32_t lfo_value = self->lfo.getsample();
        const int32_t lfo_delay = self->lfo.getdelay();
        for (Voice& voice : self->voices) {
            if (voice.live) voice.note.compute(buffer.get(), lfo_value, lfo_delay, &self->controllers);
        }

        const uint32_t count = std::min<uint32_t>(N, frames - done);
        for (uint32_t i = 0; i < count; ++i) {
            const float sample = fixed_to_float(buffer.get()[i]) * self->output_gain;
            self->out_l[offset + done + i] = sample;
            if (self->out_r) self->out_r[offset + done + i] = sample;
        }
        done += count;
    }
}

static LV2_Handle instantiate(
    const LV2_Descriptor*,
    double rate,
    const char*,
    const LV2_Feature* const* features)
{
    auto* self = new Dexed();
    for (const LV2_Feature* const* feature = features; feature && *feature; ++feature) {
        if (!std::strcmp((*feature)->URI, LV2_URID__map)) {
            auto* map = static_cast<LV2_URID_Map*>((*feature)->data);
            self->midi_event = map->map(map->handle, LV2_MIDI__MidiEvent);
        }
    }

    init_tables(rate);
    init_controllers(self);
    reset_patch(self);
    return self;
}

static void connect_port(LV2_Handle instance, uint32_t port, void* data)
{
    auto* self = static_cast<Dexed*>(instance);
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
        if (port >= PORT_ALGORITHM && port < PORT_ALGORITHM + kControlCount) {
            self->controls[port - PORT_ALGORITHM] = static_cast<float*>(data);
        }
        break;
    }
}

static void activate(LV2_Handle instance)
{
    auto* self = static_cast<Dexed*>(instance);
    all_notes_off(self);
    self->next_voice = 0;
    self->controllers.values_[kControllerPitch] = 0x2000;
    self->lfo.reset(self->patch + 137);
}

static void run(LV2_Handle instance, uint32_t frames)
{
    auto* self = static_cast<Dexed*>(instance);
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

    if (rendered < frames) {
        render_segment(self, rendered, frames - rendered);
    }
}

static void deactivate(LV2_Handle instance)
{
    all_notes_off(static_cast<Dexed*>(instance));
}

static void cleanup(LV2_Handle instance)
{
    delete static_cast<Dexed*>(instance);
}

static const void* extension_data(const char*)
{
    return nullptr;
}

static const LV2_Descriptor descriptor = {
    DEXED_URI,
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
        id: 'dexed',
        description: 'Dexed - DX7-compatible six-operator FM synthesizer',
        category: 'Instruments',
        sources: [
            'dexed_lv2.cpp',
            'msfa/dx7note.cc',
            'msfa/env.cc',
            'msfa/exp2.cc',
            'msfa/fm_core.cc',
            'msfa/fm_op_kernel.cc',
            'msfa/freqlut.cc',
            'msfa/lfo.cc',
            'msfa/pitchenv.cc',
            'msfa/sin.cc',
        ],
        includes: [
            'plugins/dexed',
            'plugins/dexed/msfa',
        ],
        defines: [
            'NDEBUG',
        ],
    };

    const registry = readLv2Registry(ROOT);
    const existing = registry.findIndex(item => item.id === 'dexed');
    if (existing >= 0) registry[existing] = entry;
    else registry.push(entry);
    writeLv2Registry(ROOT, registry);
}
