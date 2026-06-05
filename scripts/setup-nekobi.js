#!/usr/bin/env node
/**
 * Setup script for DISTRHO Nekobi.
 *
 * The upstream DPF framework is a submodule, but the actual Nekobi DSP is a
 * compact C/C++ synth core. This setup wraps that core directly as an LV2
 * instrument with atom MIDI input, stereo audio output, and the eight upstream
 * parameters.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, 'nekobi');
const SRC = join(REPO, 'plugins', 'Nekobi');
const CORE = join(SRC, 'nekobee-src');
const OUT = join(ROOT, 'plugins', 'nekobi');
const OUT_CORE = join(OUT, 'nekobee-src');

if (!existsSync(REPO)) {
    console.error(`Source not found: ${REPO} - run fetch-sources.js first`);
    process.exit(1);
}

const coreFiles = [
    'nekobee.h',
    'nekobee_synth.c',
    'nekobee_synth.h',
    'nekobee_types.h',
    'nekobee_voice.c',
    'nekobee_voice.h',
    'nekobee_voice_render.c',
    'minblep_tables.c',
];

mkdirSync(OUT_CORE, { recursive: true });
for (const file of coreFiles) {
    copyFileSync(join(CORE, file), join(OUT_CORE, file));
}

writeFileSync(join(OUT, 'nekobi_lv2.cpp'), lv2WrapperSource());
writeFileSync(join(OUT, 'nekobi.ttl'), ttlSource());
writeFileSync(join(OUT, 'manifest.ttl'), manifestSource());
registerPlugin();

console.log('Nekobi setup complete');
console.log('Run: node scripts/build-instruments.js --only nekobi');

function manifestSource() {
    return `@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<http://distrho.sf.net/plugins/Nekobi>
    a lv2:Plugin ;
    lv2:binary <nekobi.so> ;
    rdfs:seeAlso <nekobi.ttl> .
`;
}

function ttlSource() {
    return `@prefix atom:  <http://lv2plug.in/ns/ext/atom#> .
@prefix doap:  <http://usefulinc.com/ns/doap#> .
@prefix lv2:   <http://lv2plug.in/ns/lv2core#> .
@prefix midi:  <http://lv2plug.in/ns/ext/midi#> .
@prefix pprop: <http://lv2plug.in/ns/ext/port-props#> .
@prefix rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#> .
@prefix urid:  <http://lv2plug.in/ns/ext/urid#> .

<http://distrho.sf.net/plugins/Nekobi>
    a lv2:InstrumentPlugin, lv2:Plugin ;
    doap:name "DISTRHO Nekobi" ;
    doap:description "Single-oscillator TB-303-style acid bass synthesizer" ;

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
        lv2:symbol "waveform" ;
        lv2:name "Waveform" ;
        lv2:minimum 0 ;
        lv2:maximum 1 ;
        lv2:default 0 ;
        lv2:portProperty pprop:integer , pprop:enumeration ;
        lv2:scalePoint [ rdfs:label "Square" ; rdf:value 0 ] ;
        lv2:scalePoint [ rdfs:label "Triangle" ; rdf:value 1 ] ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 4 ;
        lv2:symbol "tuning" ;
        lv2:name "Tuning" ;
        lv2:minimum -12 ;
        lv2:maximum 12 ;
        lv2:default 0 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 5 ;
        lv2:symbol "cutoff" ;
        lv2:name "Cutoff" ;
        lv2:minimum 0 ;
        lv2:maximum 100 ;
        lv2:default 25 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 6 ;
        lv2:symbol "resonance" ;
        lv2:name "VCF Resonance" ;
        lv2:minimum 0 ;
        lv2:maximum 95 ;
        lv2:default 25 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 7 ;
        lv2:symbol "env_mod" ;
        lv2:name "Env Mod" ;
        lv2:minimum 0 ;
        lv2:maximum 100 ;
        lv2:default 50 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 8 ;
        lv2:symbol "decay" ;
        lv2:name "Decay" ;
        lv2:minimum 0 ;
        lv2:maximum 100 ;
        lv2:default 75 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 9 ;
        lv2:symbol "accent" ;
        lv2:name "Accent" ;
        lv2:minimum 0 ;
        lv2:maximum 100 ;
        lv2:default 25 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 10 ;
        lv2:symbol "volume" ;
        lv2:name "Volume" ;
        lv2:minimum 0 ;
        lv2:maximum 100 ;
        lv2:default 75 ;
    ] .
`;
}

function lv2WrapperSource() {
    return `#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <cstring>

#include "lv2/core/lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"

#include "nekobee-src/nekobee_synth.h"
#include "nekobee-src/nekobee_voice.h"

#include "nekobee-src/nekobee_synth.c"
#include "nekobee-src/nekobee_voice.c"
#include "nekobee-src/nekobee_voice_render.c"
#include "nekobee-src/minblep_tables.c"

#define NEKOBI_URI "http://distrho.sf.net/plugins/Nekobi"

enum PortIndex {
    PORT_MIDI_IN = 0,
    PORT_OUT_L,
    PORT_OUT_R,
    PORT_WAVEFORM,
    PORT_TUNING,
    PORT_CUTOFF,
    PORT_RESONANCE,
    PORT_ENV_MOD,
    PORT_DECAY,
    PORT_ACCENT,
    PORT_VOLUME,
};

struct NekobiParams {
    float waveform = 0.0f;
    float tuning = 0.0f;
    float cutoff = 25.0f;
    float resonance = 25.0f;
    float env_mod = 50.0f;
    float decay = 75.0f;
    float accent = 25.0f;
    float volume = 75.0f;
};

struct Nekobi {
    const LV2_Atom_Sequence* midi_in = nullptr;
    float* out_l = nullptr;
    float* out_r = nullptr;
    float* ports[8] = {};
    NekobiParams params;
    nekobee_synth_t synth;
    LV2_URID midi_event = 0;
};

static float clampf(float value, float min, float max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, value));
}

static void apply_param(Nekobi* self, uint32_t index, float value)
{
    switch (index) {
    case 0:
        self->params.waveform = value >= 0.5f ? 1.0f : 0.0f;
        self->synth.waveform = self->params.waveform;
        break;
    case 1:
        self->params.tuning = clampf(value, -12.0f, 12.0f);
        self->synth.tuning = exp2f(self->params.tuning / 12.0f);
        break;
    case 2:
        self->params.cutoff = clampf(value, 0.0f, 100.0f);
        self->synth.cutoff = self->params.cutoff / 2.5f;
        break;
    case 3:
        self->params.resonance = clampf(value, 0.0f, 95.0f);
        self->synth.resonance = self->params.resonance / 100.0f;
        break;
    case 4:
        self->params.env_mod = clampf(value, 0.0f, 100.0f);
        self->synth.envmod = self->params.env_mod / 100.0f;
        break;
    case 5:
        self->params.decay = clampf(value, 0.0f, 100.0f);
        self->synth.decay = self->params.decay / 100.0f * 0.000491f + 0.000009f;
        break;
    case 6:
        self->params.accent = clampf(value, 0.0f, 100.0f);
        self->synth.accent = self->params.accent / 100.0f;
        break;
    case 7:
        self->params.volume = clampf(value, 0.0f, 100.0f);
        self->synth.volume = self->params.volume / 100.0f;
        break;
    default:
        break;
    }
}

static void apply_controls(Nekobi* self)
{
    const float defaults[8] = { 0.0f, 0.0f, 25.0f, 25.0f, 50.0f, 75.0f, 25.0f, 75.0f };
    for (uint32_t i = 0; i < 8; ++i) {
        apply_param(self, i, self->ports[i] ? *self->ports[i] : defaults[i]);
    }
}

static void init_synth(Nekobi* self, double sample_rate)
{
    nekobee_init_tables();

    self->synth.sample_rate = static_cast<unsigned long>(sample_rate);
    self->synth.deltat = 1.0f / static_cast<float>(sample_rate);
    self->synth.nugget_remains = 0;
    self->synth.note_id = 0;
    self->synth.polyphony = XSYNTH_DEFAULT_POLYPHONY;
    self->synth.voices = XSYNTH_DEFAULT_POLYPHONY;
    self->synth.monophonic = XSYNTH_MONO_MODE_ONCE;
    self->synth.glide = 0;
    self->synth.last_noteon_pitch = 0.0f;
    self->synth.vcf_accent = 0.0f;
    self->synth.vca_accent = 0.0f;

    for (int i = 0; i < 8; ++i) self->synth.held_keys[i] = -1;

    self->synth.voice = nekobee_voice_new();
    self->synth.voicelist_mutex_grab_failed = 0;
    self->synth.channel_pressure = 0;
    self->synth.pitch_wheel_sensitivity = 0;
    self->synth.pitch_wheel = 0;

    for (int i = 0; i < 128; ++i) {
        self->synth.key_pressure[i] = 0;
        self->synth.cc[i] = 0;
    }
    self->synth.cc[7] = 127;
    self->synth.mod_wheel = 1.0f;
    self->synth.pitch_bend = 1.0f;
    self->synth.cc_volume = 1.0f;

    apply_param(self, 0, 0.0f);
    apply_param(self, 1, 0.0f);
    apply_param(self, 2, 25.0f);
    apply_param(self, 3, 25.0f);
    apply_param(self, 4, 50.0f);
    apply_param(self, 5, 75.0f);
    apply_param(self, 6, 25.0f);
    apply_param(self, 7, 75.0f);

    if (self->synth.voice != nullptr) {
        nekobee_synth_all_voices_off(&self->synth);
    }
}

static void handle_midi(Nekobi* self, uint32_t size, const uint8_t* data)
{
    if (size != 3) return;

    switch (data[0] & 0xf0) {
    case 0x80:
        nekobee_synth_note_off(&self->synth, data[1], data[2]);
        break;
    case 0x90:
        if (data[2] > 0) {
            nekobee_synth_note_on(&self->synth, data[1], data[2]);
        } else {
            nekobee_synth_note_off(&self->synth, data[1], 64);
        }
        break;
    case 0xB0:
        nekobee_synth_control_change(&self->synth, data[1], data[2]);
        break;
    default:
        break;
    }
}

static void render_segment(Nekobi* self, float* out, uint32_t offset, uint32_t frames)
{
    uint32_t done = 0;
    while (done < frames) {
        if (self->synth.nugget_remains == 0) {
            self->synth.nugget_remains = XSYNTH_NUGGET_SIZE;
        }

        uint32_t burst = XSYNTH_NUGGET_SIZE;
        if (self->synth.nugget_remains < burst) burst = self->synth.nugget_remains;
        if (frames - done < burst) burst = frames - done;

        nekobee_synth_render_voices(
            &self->synth,
            out + offset + done,
            burst,
            burst == self->synth.nugget_remains);

        done += burst;
        self->synth.nugget_remains -= burst;
    }
}

static LV2_Handle instantiate(
    const LV2_Descriptor*,
    double rate,
    const char*,
    const LV2_Feature* const* features)
{
    auto* self = new Nekobi();

    for (const LV2_Feature* const* feature = features; feature && *feature; ++feature) {
        if (!std::strcmp((*feature)->URI, LV2_URID__map)) {
            auto* map = static_cast<LV2_URID_Map*>((*feature)->data);
            self->midi_event = map->map(map->handle, LV2_MIDI__MidiEvent);
        }
    }

    init_synth(self, rate);
    return self;
}

static void connect_port(LV2_Handle instance, uint32_t port, void* data)
{
    auto* self = static_cast<Nekobi*>(instance);
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
    case PORT_WAVEFORM:
    case PORT_TUNING:
    case PORT_CUTOFF:
    case PORT_RESONANCE:
    case PORT_ENV_MOD:
    case PORT_DECAY:
    case PORT_ACCENT:
    case PORT_VOLUME:
        self->ports[port - PORT_WAVEFORM] = static_cast<float*>(data);
        break;
    default:
        break;
    }
}

static void activate(LV2_Handle instance)
{
    auto* self = static_cast<Nekobi*>(instance);
    self->synth.nugget_remains = 0;
    self->synth.note_id = 0;
    if (self->synth.voice != nullptr) {
        nekobee_synth_all_voices_off(&self->synth);
    }
}

static void run(LV2_Handle instance, uint32_t frames)
{
    auto* self = static_cast<Nekobi*>(instance);
    if (!self->out_l) return;

    apply_controls(self);

    uint32_t rendered = 0;
    if (self->midi_in) {
        LV2_ATOM_SEQUENCE_FOREACH(self->midi_in, event) {
            if (event->body.type != self->midi_event) continue;
            const uint32_t frame = std::min<uint32_t>(event->time.frames, frames);
            if (frame > rendered) {
                render_segment(self, self->out_l, rendered, frame - rendered);
                rendered = frame;
            }
            handle_midi(self, event->body.size, static_cast<const uint8_t*>(LV2_ATOM_BODY(&event->body)));
        }
    }

    if (rendered < frames) {
        render_segment(self, self->out_l, rendered, frames - rendered);
    }

    if (self->out_r) {
        std::memcpy(self->out_r, self->out_l, sizeof(float) * frames);
    }
}

static void deactivate(LV2_Handle instance)
{
    auto* self = static_cast<Nekobi*>(instance);
    if (self->synth.voice != nullptr) {
        nekobee_synth_all_voices_off(&self->synth);
    }
}

static void cleanup(LV2_Handle instance)
{
    auto* self = static_cast<Nekobi*>(instance);
    std::free(self->synth.voice);
    delete self;
}

static const void* extension_data(const char*)
{
    return nullptr;
}

static const LV2_Descriptor descriptor = {
    NEKOBI_URI,
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
        id: 'nekobi',
        description: 'DISTRHO Nekobi - TB-303-style acid bass synthesizer',
        category: 'Instruments',
        sources: ['nekobi_lv2.cpp'],
        includes: [
            'plugins/nekobi',
            'plugins/nekobi/nekobee-src',
        ],
    };

    const registry = readLv2Registry(ROOT);
    const existing = registry.findIndex(item => item.id === 'nekobi');
    if (existing >= 0) registry[existing] = entry;
    else registry.push(entry);
    writeLv2Registry(ROOT, registry);
}
