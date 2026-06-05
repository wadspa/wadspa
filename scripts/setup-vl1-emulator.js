#!/usr/bin/env node
/**
 * Setup script for VL1-emulator.
 *
 * Upstream uses DPF, but the Casio VL-Tone engine is self-contained C++.
 * This setup copies the DSP-side engine and provides a tiny DPF compatibility
 * header so the original PluginVL1 class can be hosted by a generated LV2
 * wrapper for Web Audio.
 */

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, 'vl1-emulator');
const SRC = join(REPO, 'sources');
const OUT = join(ROOT, 'plugins', 'vl1-emulator');

if (!existsSync(SRC)) {
    console.error(`Source not found: ${SRC} - run fetch-sources.js first`);
    process.exit(1);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, 'plugin'), { recursive: true });
mkdirSync(join(OUT, 'plugin', 'meta'), { recursive: true });

const engineFiles = [
    'ADSR.cpp',
    'ADSR.h',
    'Calculator.cpp',
    'Calculator.h',
    'Clock.cpp',
    'Clock.h',
    'DemoSong.cpp',
    'DemoSong.h',
    'EnvelopeShaper.cpp',
    'EnvelopeShaper.h',
    'EventManager.cpp',
    'EventManager.h',
    'Filters.cpp',
    'Filters.h',
    'LFO.cpp',
    'LFO.h',
    'LcdBuffer.cpp',
    'LcdBuffer.h',
    'LineInTime.cpp',
    'LineInTime.h',
    'MidiDefs.h',
    'Noise.cpp',
    'Noise.h',
    'Rhythm.cpp',
    'Rhythm.h',
    'Sequencer.cpp',
    'Sequencer.h',
    'SharedData.h',
    'Utils.cpp',
    'Utils.h',
    'VL1Defs.cpp',
    'VL1Defs.h',
    'VL1Program.h',
    'VL1String.cpp',
    'VL1String.h',
    'Voice.cpp',
    'Voice.h',
    'VoiceManager.cpp',
    'VoiceManager.h',
    'Wave.cpp',
    'Wave.h',
    'WaveSet.cpp',
    'WaveSet.h',
];

for (const file of engineFiles) {
    copyFileSync(join(SRC, file), join(OUT, file));
}

for (const file of ['PluginVL1.cpp', 'PluginVL1.h', 'SharedVL1.cpp', 'SharedVL1.h']) {
    copyFileSync(join(SRC, 'plugin', file), join(OUT, 'plugin', file));
}
copyFileSync(join(SRC, 'plugin', 'meta', 'PluginVL1Meta.cpp'), join(OUT, 'plugin', 'meta', 'PluginVL1Meta.cpp'));

writeFileSync(join(OUT, 'plugin', 'DistrhoPlugin.hpp'), dpfCompatHeader());
writeFileSync(join(OUT, 'vl1_lv2.cpp'), lv2WrapperSource());
writeFileSync(join(OUT, 'vl1.ttl'), ttlSource());
writeFileSync(join(OUT, 'manifest.ttl'), manifestSource());
registerPlugin();

console.log('VL1-emulator setup complete');
console.log('Run: node scripts/build-instruments.js --only vl1-emulator');

function manifestSource() {
    return `@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<https://polyvalens.com/plugins/VL1>
    a lv2:Plugin, lv2:InstrumentPlugin ;
    lv2:binary <vl1.so> ;
    rdfs:seeAlso <vl1.ttl> .
`;
}

function ttlSource() {
    const enumScale = values => values.map(([label, value]) =>
        `        lv2:scalePoint [ rdfs:label "${label}" ; rdf:value ${value} ] ;`).join('\n');

    return `@prefix atom:  <http://lv2plug.in/ns/ext/atom#> .
@prefix doap:  <http://usefulinc.com/ns/doap#> .
@prefix lv2:   <http://lv2plug.in/ns/lv2core#> .
@prefix midi:  <http://lv2plug.in/ns/ext/midi#> .
@prefix pprop: <http://lv2plug.in/ns/ext/port-props#> .
@prefix rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#> .
@prefix urid:  <http://lv2plug.in/ns/ext/urid#> .

<https://polyvalens.com/plugins/VL1>
    a lv2:InstrumentPlugin, lv2:Plugin ;
    doap:name "VL1-emulator" ;
    doap:description "Casio VL-Tone VL1 emulator" ;
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
        lv2:symbol "mode" ;
        lv2:name "Mode" ;
        lv2:minimum 0 ;
        lv2:maximum 3 ;
        lv2:default 0 ;
        lv2:portProperty pprop:integer , pprop:enumeration ;
${enumScale([['Play', 0], ['Rec', 1], ['Cal', 2], ['Off', 3]])}
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 4 ;
        lv2:symbol "volume" ;
        lv2:name "Volume" ;
        lv2:minimum 0 ;
        lv2:maximum 100 ;
        lv2:default 80 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 5 ;
        lv2:symbol "balance" ;
        lv2:name "Balance" ;
        lv2:minimum 0 ;
        lv2:maximum 100 ;
        lv2:default 50 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 6 ;
        lv2:symbol "octave" ;
        lv2:name "Octave" ;
        lv2:minimum 0 ;
        lv2:maximum 2 ;
        lv2:default 1 ;
        lv2:portProperty pprop:integer , pprop:enumeration ;
${enumScale([['Low', 0], ['Middle', 1], ['High', 2]])}
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 7 ;
        lv2:symbol "tune" ;
        lv2:name "Tune" ;
        lv2:minimum 0 ;
        lv2:maximum 100 ;
        lv2:default 50 ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 8 ;
        lv2:symbol "sound" ;
        lv2:name "Sound" ;
        lv2:minimum 0 ;
        lv2:maximum 9 ;
        lv2:default 0 ;
        lv2:portProperty pprop:integer , pprop:enumeration ;
${enumScale([
    ['Piano', 0],
    ['Fantasy', 1],
    ['Violin', 2],
    ['Flute', 3],
    ['Guitar 1', 4],
    ['Guitar 2', 5],
    ['English Horn', 6],
    ['Electro 1', 7],
    ['Electro 2', 8],
    ['Electro 3', 9],
])}
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 9 ;
        lv2:symbol "attack" ;
        lv2:name "Attack" ;
        lv2:minimum 0 ;
        lv2:maximum 9 ;
        lv2:default 0 ;
        lv2:portProperty pprop:integer ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 10 ;
        lv2:symbol "decay" ;
        lv2:name "Decay" ;
        lv2:minimum 0 ;
        lv2:maximum 9 ;
        lv2:default 4 ;
        lv2:portProperty pprop:integer ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 11 ;
        lv2:symbol "sustain_level" ;
        lv2:name "Sustain Level" ;
        lv2:minimum 0 ;
        lv2:maximum 9 ;
        lv2:default 5 ;
        lv2:portProperty pprop:integer ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 12 ;
        lv2:symbol "sustain_time" ;
        lv2:name "Sustain Time" ;
        lv2:minimum 0 ;
        lv2:maximum 9 ;
        lv2:default 3 ;
        lv2:portProperty pprop:integer ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 13 ;
        lv2:symbol "release" ;
        lv2:name "Release" ;
        lv2:minimum 0 ;
        lv2:maximum 9 ;
        lv2:default 2 ;
        lv2:portProperty pprop:integer ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 14 ;
        lv2:symbol "vibrato" ;
        lv2:name "Vibrato" ;
        lv2:minimum 0 ;
        lv2:maximum 9 ;
        lv2:default 0 ;
        lv2:portProperty pprop:integer ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 15 ;
        lv2:symbol "tremolo" ;
        lv2:name "Tremolo" ;
        lv2:minimum 0 ;
        lv2:maximum 9 ;
        lv2:default 0 ;
        lv2:portProperty pprop:integer ;
    ] , [
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index 16 ;
        lv2:symbol "tempo" ;
        lv2:name "Tempo" ;
        lv2:minimum -9 ;
        lv2:maximum 9 ;
        lv2:default 4 ;
        lv2:portProperty pprop:integer ;
    ] .
`;
}

function dpfCompatHeader() {
    return `#pragma once

#include <cstdint>

#define DISTRHO_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(ClassName)
#define DISTRHO_SAFE_ASSERT(cond) do { (void)sizeof(cond); } while (0)
#define DISTRHO_SAFE_ASSERT_RETURN(cond, ret) do { if (!(cond)) return ret; } while (0)

#ifndef d_version
#define d_version(major, minor, micro) (((uint32_t)(major) << 16) | ((uint32_t)(minor) << 8) | (uint32_t)(micro))
#endif

#ifndef d_cconst
#define d_cconst(a, b, c, d) ((((int64_t)(a)) << 24) | (((int64_t)(b)) << 16) | (((int64_t)(c)) << 8) | ((int64_t)(d)))
#endif

using uint = unsigned int;

namespace DISTRHO {

enum ParameterHints {
    kParameterIsAutomable = 1u << 0,
    kParameterIsInteger = 1u << 1,
};

struct AudioPort {
    const char* symbol = nullptr;
    const char* name = nullptr;
};

struct ParameterRanges {
    float def = 0.0f;
    float min = 0.0f;
    float max = 1.0f;
};

struct ParameterEnumerationValue {
    float value = 0.0f;
    const char* label = nullptr;
};

struct ParameterEnumerationValues {
    ParameterEnumerationValue* values = nullptr;
    uint32_t count = 0;
    bool restrictedMode = false;
};

struct Parameter {
    const char* symbol = nullptr;
    const char* name = nullptr;
    const char* unit = nullptr;
    uint32_t hints = 0;
    ParameterRanges ranges;
    ParameterEnumerationValues enumValues;
};

class String {
public:
    String& operator=(const char* value)
    {
        text = value;
        return *this;
    }

    operator const char*() const { return text; }

private:
    const char* text = "";
};

struct MidiEvent {
    uint32_t frame = 0;
    uint32_t size = 0;
    uint8_t data[4] = {};
};

class Plugin {
public:
    Plugin(uint32_t parameterCount, uint32_t programCount, uint32_t stateCount)
        : parameterCount(parameterCount), programCount(programCount), stateCount(stateCount)
    {
    }

    virtual ~Plugin() = default;

    double getSampleRate() const noexcept { return sampleRate_; }

protected:
    virtual const char* getLabel() const noexcept { return ""; }
    virtual const char* getDescription() const { return ""; }
    virtual const char* getMaker() const noexcept { return ""; }
    virtual const char* getHomePage() const { return ""; }
    virtual const char* getLicense() const noexcept { return ""; }
    virtual uint32_t getVersion() const noexcept { return 0; }
    virtual int64_t getUniqueId() const noexcept { return 0; }
    virtual void initAudioPort(bool, uint32_t, AudioPort&) {}
    virtual void initParameter(uint32_t, Parameter&) {}
    virtual void initProgramName(uint32_t, String&) {}
    virtual float getParameterValue(uint32_t) const { return 0.0f; }
    virtual void setParameterValue(uint32_t, float) {}
    virtual void loadProgram(uint32_t) {}
    virtual void sampleRateChanged(double) {}
    virtual void activate() {}
    virtual void deactivate() {}
    virtual void run(const float**, float**, uint32_t, const MidiEvent*, uint32_t) {}

    double sampleRate_ = 44100.0;
    uint32_t parameterCount = 0;
    uint32_t programCount = 0;
    uint32_t stateCount = 0;
};

Plugin* createPlugin();

} // namespace DISTRHO

using DISTRHO::AudioPort;
using DISTRHO::MidiEvent;
using DISTRHO::Parameter;
using DISTRHO::ParameterEnumerationValue;
using DISTRHO::ParameterEnumerationValues;
using DISTRHO::Plugin;
using DISTRHO::String;
using DISTRHO::kParameterIsAutomable;
using DISTRHO::kParameterIsInteger;
`;
}

function lv2WrapperSource() {
    return `#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <vector>

#include "lv2/core/lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"

#include "plugin/PluginVL1.h"

#define VL1_URI "https://polyvalens.com/plugins/VL1"

enum PortIndex {
    PORT_MIDI_IN = 0,
    PORT_OUT_L,
    PORT_OUT_R,
    PORT_MODE,
    PORT_VOLUME,
    PORT_BALANCE,
    PORT_OCTAVE,
    PORT_TUNE,
    PORT_SOUND,
    PORT_ATTACK,
    PORT_DECAY,
    PORT_SUSTAIN_LEVEL,
    PORT_SUSTAIN_TIME,
    PORT_RELEASE,
    PORT_VIBRATO,
    PORT_TREMOLO,
    PORT_TEMPO,
};

class HostedVL1 final : public PluginVL1 {
public:
    void setSampleRateForHost(double sampleRate)
    {
        sampleRate_ = sampleRate;
        sampleRateChanged(sampleRate);
    }

    void setParameterForHost(uint32_t index, float value)
    {
        setParameterValue(index, value);
    }

    void activateForHost()
    {
        activate();
    }

    void runForHost(float** outputs, uint32_t frames, const std::vector<MidiEvent>& events)
    {
        run(nullptr, outputs, frames, events.data(), static_cast<uint32_t>(events.size()));
    }
};

struct VL1LV2 {
    const LV2_Atom_Sequence* midi_in = nullptr;
    float* out_l = nullptr;
    float* out_r = nullptr;
    const float* controls[14] = {};
    float last_controls[14] = {};
    bool have_last_controls = false;
    LV2_URID midi_event = 0;
    HostedVL1* synth = nullptr;
};

static float port_value(const float* port, float fallback)
{
    return port ? *port : fallback;
}

static float clampf_local(float value, float min, float max)
{
    return std::max(min, std::min(max, value));
}

static void apply_controls(VL1LV2* self, bool force)
{
    static const float defaults[14] = {
        0.0f, 80.0f, 50.0f, 1.0f, 50.0f, 0.0f, 0.0f,
        4.0f, 5.0f, 3.0f, 2.0f, 0.0f, 0.0f, 4.0f,
    };
    static const float mins[14] = {
        0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f,
        0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, -9.0f,
    };
    static const float maxs[14] = {
        3.0f, 100.0f, 100.0f, 2.0f, 100.0f, 9.0f, 9.0f,
        9.0f, 9.0f, 9.0f, 9.0f, 9.0f, 9.0f, 9.0f,
    };

    for (uint32_t i = 0; i < 14; ++i) {
        float value = clampf_local(port_value(self->controls[i], defaults[i]), mins[i], maxs[i]);
        if (!force
            && self->have_last_controls
            && std::fabs(value - self->last_controls[i]) <= 1.0e-6f) {
            continue;
        }
        self->last_controls[i] = value;
        self->synth->setParameterForHost(i, value);
    }
    self->have_last_controls = true;
}

static LV2_Handle instantiate(const LV2_Descriptor*, double sample_rate, const char*, const LV2_Feature* const* features)
{
    VL1LV2* self = new VL1LV2();
    self->synth = new HostedVL1();
    self->synth->setSampleRateForHost(sample_rate);

    for (int i = 0; features && features[i]; ++i) {
        if (std::strcmp(features[i]->URI, LV2_URID__map) == 0) {
            LV2_URID_Map* map = static_cast<LV2_URID_Map*>(features[i]->data);
            self->midi_event = map->map(map->handle, LV2_MIDI__MidiEvent);
            break;
        }
    }

    return self;
}

static void connect_port(LV2_Handle instance, uint32_t port, void* data)
{
    VL1LV2* self = static_cast<VL1LV2*>(instance);
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
        if (port >= PORT_MODE && port <= PORT_TEMPO) {
            self->controls[port - PORT_MODE] = static_cast<const float*>(data);
        }
        break;
    }
}

static void activate(LV2_Handle instance)
{
    VL1LV2* self = static_cast<VL1LV2*>(instance);
    apply_controls(self, true);
    self->synth->activateForHost();
}

static void run(LV2_Handle instance, uint32_t n_samples)
{
    VL1LV2* self = static_cast<VL1LV2*>(instance);
    if (!self->out_l || !self->out_r) return;

    apply_controls(self, false);

    std::vector<MidiEvent> events;
    if (self->midi_in && self->midi_event) {
        LV2_ATOM_SEQUENCE_FOREACH(self->midi_in, event) {
            if (event->body.type != self->midi_event) continue;
            const uint8_t* data = static_cast<const uint8_t*>(LV2_ATOM_BODY(&event->body));
            MidiEvent midi = {};
            midi.frame = event->time.frames < n_samples ? event->time.frames : n_samples - 1;
            midi.size = std::min<uint32_t>(event->body.size, 4);
            std::memcpy(midi.data, data, midi.size);
            events.push_back(midi);
        }
    }

    float* outputs[2] = { self->out_l, self->out_r };
    self->synth->runForHost(outputs, n_samples, events);
}

static void cleanup(LV2_Handle instance)
{
    VL1LV2* self = static_cast<VL1LV2*>(instance);
    delete self->synth;
    delete self;
}

static const LV2_Descriptor descriptor = {
    VL1_URI,
    instantiate,
    connect_port,
    activate,
    run,
    nullptr,
    cleanup,
    nullptr,
};

LV2_SYMBOL_EXPORT
const LV2_Descriptor* lv2_descriptor(uint32_t index)
{
    return index == 0 ? &descriptor : nullptr;
}
`;
}

function registerPlugin() {
    const registry = readLv2Registry(ROOT).filter(entry => entry.id !== 'vl1-emulator');
    registry.push({
        id: 'vl1-emulator',
        description: 'VL1-emulator - Casio VL-Tone VL1 instrument',
        category: 'Instruments',
        sources: [
            'vl1_lv2.cpp',
            'plugin/PluginVL1.cpp',
            'plugin/SharedVL1.cpp',
            'plugin/meta/PluginVL1Meta.cpp',
            'ADSR.cpp',
            'Calculator.cpp',
            'Clock.cpp',
            'DemoSong.cpp',
            'EnvelopeShaper.cpp',
            'EventManager.cpp',
            'Filters.cpp',
            'LFO.cpp',
            'LcdBuffer.cpp',
            'LineInTime.cpp',
            'Noise.cpp',
            'Rhythm.cpp',
            'Sequencer.cpp',
            'Utils.cpp',
            'VL1Defs.cpp',
            'VL1String.cpp',
            'Voice.cpp',
            'VoiceManager.cpp',
            'Wave.cpp',
            'WaveSet.cpp',
        ],
        includes: [
            'plugins/vl1-emulator',
            'plugins/vl1-emulator/plugin',
            'plugins/vl1-emulator/plugin/meta',
        ],
        defines: [
            'NDEBUG',
        ],
    });
    writeLv2Registry(ROOT, registry);
}
