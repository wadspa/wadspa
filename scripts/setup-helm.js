#!/usr/bin/env node
/**
 * Setup script for Helm.
 *
 * Helm's synthesis engine is cleanly separated from its JUCE UI in the mopo
 * and src/synthesis trees. This setup hosts that real DSP engine directly and
 * exposes a focused browser control surface that can be proven by the generic
 * MIDI instrument and slider influence tests.
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'helm');
const OUT = join(ROOT, 'plugins', 'helm');

const waveforms = [
    ['Sine', 0],
    ['Triangle', 1],
    ['Square', 2],
    ['Saw Up', 3],
    ['Saw Down', 4],
    ['3 Step', 5],
    ['4 Step', 6],
    ['8 Step', 7],
    ['3 Pyramid', 8],
    ['5 Pyramid', 9],
    ['9 Pyramid', 10],
];

const controls = [
    { symbol: 'volume', name: 'Volume', min: 0, max: 1.4143, def: 0.7071068 },
    { symbol: 'polyphony', name: 'Polyphony', min: 1, max: 32, def: 4, integer: true },
    { symbol: 'legato', name: 'Legato', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'pitch_bend_range', name: 'Pitch Bend Range', min: 0, max: 48, def: 2, integer: true },

    { symbol: 'amp_attack', name: 'Amp Attack', min: 0, max: 4, def: 0.109545 },
    { symbol: 'amp_decay', name: 'Amp Decay', min: 0, max: 4, def: 1.5 },
    { symbol: 'amp_sustain', name: 'Amp Sustain', min: 0, max: 1, def: 1 },
    { symbol: 'amp_release', name: 'Amp Release', min: 0, max: 4, def: 0.3 },

    { symbol: 'osc_1_waveform', name: 'Osc 1 Waveform', min: 0, max: 10, def: 4, integer: true, scalePoints: waveforms },
    { symbol: 'osc_1_transpose', name: 'Osc 1 Transpose', min: -48, max: 48, def: 0, integer: true },
    { symbol: 'osc_1_tune', name: 'Osc 1 Tune', min: -1, max: 1, def: 0 },
    { symbol: 'osc_1_unison_detune', name: 'Osc 1 Unison Detune', min: 0, max: 100, def: 10 },
    { symbol: 'osc_1_unison_voices', name: 'Osc 1 Unison Voices', min: 1, max: 15, def: 1, integer: true },
    { symbol: 'osc_1_volume', name: 'Osc 1 Volume', min: 0, max: 1, def: 0.5477225575 },

    { symbol: 'osc_2_waveform', name: 'Osc 2 Waveform', min: 0, max: 10, def: 4, integer: true, scalePoints: waveforms },
    { symbol: 'osc_2_transpose', name: 'Osc 2 Transpose', min: -48, max: 48, def: 0, integer: true },
    { symbol: 'osc_2_tune', name: 'Osc 2 Tune', min: -1, max: 1, def: 0 },
    { symbol: 'osc_2_unison_detune', name: 'Osc 2 Unison Detune', min: 0, max: 100, def: 10 },
    { symbol: 'osc_2_unison_voices', name: 'Osc 2 Unison Voices', min: 1, max: 15, def: 1, integer: true },
    { symbol: 'osc_2_volume', name: 'Osc 2 Volume', min: 0, max: 1, def: 0.5477225575 },

    { symbol: 'cross_modulation', name: 'Cross Mod', min: 0, max: 0.5, def: 0 },
    { symbol: 'osc_feedback_amount', name: 'Osc Feedback Amount', min: -1, max: 1, def: 0 },
    { symbol: 'osc_feedback_transpose', name: 'Osc Feedback Transpose', min: -24, max: 24, def: 0, integer: true },
    { symbol: 'osc_feedback_tune', name: 'Osc Feedback Tune', min: -1, max: 1, def: 0 },

    { symbol: 'noise_volume', name: 'Noise Volume', min: 0, max: 1, def: 0 },
    { symbol: 'sub_volume', name: 'Sub Osc Volume', min: 0, max: 1, def: 0.35 },
    { symbol: 'sub_octave', name: 'Sub Octave Down', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'sub_waveform', name: 'Sub Osc Waveform', min: 0, max: 10, def: 2, integer: true, scalePoints: waveforms },
    { symbol: 'sub_shuffle', name: 'Sub Osc Shuffle', min: 0, max: 1, def: 0 },

    { symbol: 'filter_on', name: 'Filter On', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'cutoff', name: 'Filter Cutoff', min: 28, max: 84, def: 68 },
    { symbol: 'resonance', name: 'Filter Resonance', min: 0, max: 1, def: 0.5 },
    { symbol: 'filter_drive', name: 'Filter Drive', min: -12, max: 20, def: 0 },
    { symbol: 'filter_blend', name: 'Filter Blend', min: 0, max: 2, def: 0 },
    {
        symbol: 'filter_style',
        name: 'Filter Style',
        min: 0,
        max: 2,
        def: 0,
        integer: true,
        scalePoints: [['12dB', 0], ['24dB', 1], ['Shelf', 2]],
    },
    { symbol: 'fil_env_depth', name: 'Filter Env Depth', min: -128, max: 128, def: 48 },
    { symbol: 'fil_attack', name: 'Filter Attack', min: 0, max: 4, def: 0 },
    { symbol: 'fil_decay', name: 'Filter Decay', min: 0, max: 4, def: 1.5 },
    { symbol: 'fil_sustain', name: 'Filter Sustain', min: 0, max: 1, def: 0.5 },
    { symbol: 'fil_release', name: 'Filter Release', min: 0, max: 1.5, def: 0.8 },

    { symbol: 'distortion_on', name: 'Distortion On', min: 0, max: 1, def: 0, integer: true, toggled: true },
    {
        symbol: 'distortion_type',
        name: 'Distortion Type',
        min: 0,
        max: 3,
        def: 0,
        integer: true,
        scalePoints: [['Soft Clip', 0], ['Hard Clip', 1], ['Linear Fold', 2], ['Sine Fold', 3]],
    },
    { symbol: 'distortion_drive', name: 'Distortion Drive', min: -30, max: 30, def: 0 },
    { symbol: 'distortion_mix', name: 'Distortion Mix', min: 0, max: 1, def: 1 },

    { symbol: 'delay_on', name: 'Delay On', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'delay_dry_wet', name: 'Delay Mix', min: 0, max: 1, def: 0.5 },
    { symbol: 'delay_feedback', name: 'Delay Feedback', min: -1, max: 1, def: 0.4 },
    { symbol: 'delay_frequency', name: 'Delay Frequency', min: -2, max: 5, def: 2 },

    { symbol: 'reverb_on', name: 'Reverb On', min: 0, max: 1, def: 0, integer: true, toggled: true },
    { symbol: 'reverb_dry_wet', name: 'Reverb Mix', min: 0, max: 1, def: 0.5 },
    { symbol: 'reverb_feedback', name: 'Reverb Feedback', min: 0.8, max: 1, def: 0.9 },
    { symbol: 'reverb_damping', name: 'Reverb Damping', min: 0, max: 1, def: 0.5 },
];

if (!existsSync(join(SRC, 'src', 'synthesis', 'helm_engine.cpp'))) {
    console.error(`Source not found: ${SRC} - run fetch-sources.js --only helm first`);
    process.exit(1);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'controls.json'), `${JSON.stringify(controls, null, 2)}\n`);
writeFileSync(join(OUT, 'helm_plugin.cpp'), pluginSource());
registerPlugin();

console.log('Helm setup complete');
console.log('Run: node scripts/build-instruments.js --only helm');

function pluginSource() {
    return `#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <map>
#include <string>

#include "helm_engine.h"
#include "helm_common.h"
#include "value.h"

extern "C" {

constexpr int kBlockSize = 128;
constexpr int kControlCount = ${controls.length};

enum ControlIndex {
${controls.map((port, index) => `    CTRL_${constantName(port.symbol)} = ${index}`).join(',\n')},
};

static const char* kControlNames[kControlCount] = {
${controls.map(port => `    "${port.symbol}"`).join(',\n')}
};

static const double kControlMin[kControlCount] = {
${controls.map(port => `    ${doubleLiteral(port.min)}`).join(',\n')}
};

static const double kControlMax[kControlCount] = {
${controls.map(port => `    ${doubleLiteral(port.max)}`).join(',\n')}
};

static const double kControlDefault[kControlCount] = {
${controls.map(port => `    ${doubleLiteral(port.def)}`).join(',\n')}
};

static mopo::HelmEngine* g_engine = nullptr;
static mopo::control_map g_controls;
static float g_out_l[kBlockSize] = {};
static float g_out_r[kBlockSize] = {};
static int g_buffer_size = kBlockSize;

static double clampd(double value, double min, double max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, value));
}

static mopo::Value* control_for(int index)
{
    if (!g_engine || index < 0 || index >= kControlCount) return nullptr;
    auto it = g_controls.find(kControlNames[index]);
    return it == g_controls.end() ? nullptr : it->second;
}

static void set_control(int index, double value)
{
    mopo::Value* control = control_for(index);
    if (!control) return;
    control->set(clampd(value, kControlMin[index], kControlMax[index]));
}

static void set_internal_control(const char* name, double value)
{
    if (!g_engine) return;
    auto it = g_controls.find(name);
    if (it != g_controls.end() && it->second) it->second->set(value);
}

static double get_control(int index)
{
    mopo::Value* control = control_for(index);
    if (!control) return kControlDefault[index];
    return control->value();
}

void shim_init(int sample_rate)
{
    delete g_engine;
    g_engine = new mopo::HelmEngine();
    g_engine->setSampleRate(sample_rate > 0 ? sample_rate : 44100);
    g_engine->setBufferSize(kBlockSize);
    g_engine->setBpm(120.0);
    g_controls = g_engine->getControls();
    g_buffer_size = kBlockSize;

    for (int i = 0; i < kControlCount; ++i) set_control(i, kControlDefault[i]);
    set_internal_control("delay_sync", 0.0);
    std::memset(g_out_l, 0, sizeof(g_out_l));
    std::memset(g_out_r, 0, sizeof(g_out_r));
}

float* shim_output_buf_out_l()
{
    return g_out_l;
}

float* shim_output_buf_out_r()
{
    return g_out_r;
}

void shim_midi_clear()
{
    if (g_engine) g_engine->allNotesOff(0);
}

void shim_midi_note_on(int channel, int note, int velocity)
{
    if (!g_engine) return;
    const int ch = std::max(0, std::min(15, channel));
    const int midi_note = std::max(0, std::min(127, note));
    const double vel = clampd(static_cast<double>(velocity) / 127.0, 0.0, 1.0);
    g_engine->noteOn(midi_note, vel, 0, ch);
}

void shim_midi_note_off(int, int note)
{
    if (!g_engine) return;
    g_engine->noteOff(std::max(0, std::min(127, note)), 0);
}

void shim_midi_cc(int channel, int controller, int value)
{
    if (!g_engine) return;
    const int ch = std::max(1, std::min(16, channel + 1));
    const double norm = clampd(static_cast<double>(value) / 127.0, 0.0, 1.0);
    if (controller == 1) {
        g_engine->setModWheel(norm, ch);
    } else if (controller == 64) {
        if (value >= 64) g_engine->sustainOn();
        else g_engine->sustainOff();
    } else if (controller == 123) {
        g_engine->allNotesOff(0);
    }
}

void shim_midi_pitch_bend(int channel, int value)
{
    if (!g_engine) return;
    const int ch = std::max(1, std::min(16, channel + 1));
    g_engine->setPitchWheel(clampd(static_cast<double>(value) / 8192.0, -1.0, 1.0), ch);
}

void shim_midi_program_change(int, int)
{
}

void shim_run(int n)
{
    if (!g_engine) return;
    const int frames = std::max(1, std::min(kBlockSize, n));
    if (frames != g_buffer_size) {
        g_engine->setBufferSize(frames);
        g_buffer_size = frames;
    }
    g_engine->process();

    const mopo::mopo_float* left = g_engine->output(0)->buffer;
    const mopo::mopo_float* right = g_engine->output(1)->buffer;
    for (int i = 0; i < frames; ++i) {
        const double l = std::isfinite(left[i]) ? left[i] : 0.0;
        const double r = std::isfinite(right[i]) ? right[i] : 0.0;
        g_out_l[i] = static_cast<float>(clampd(l, -1.0, 1.0));
        g_out_r[i] = static_cast<float>(clampd(r, -1.0, 1.0));
    }
    for (int i = frames; i < kBlockSize; ++i) {
        g_out_l[i] = 0.0f;
        g_out_r[i] = 0.0f;
    }
}

${controls.map((port, index) => `void shim_set_${port.symbol}(float value) { set_control(${index}, value); }
float shim_get_${port.symbol}() { return static_cast<float>(get_control(${index})); }`).join('\n\n')}

} // extern "C"
`;
}

function registerPlugin() {
    const registry = readLv2Registry(ROOT).filter(entry => entry.id !== 'helm');
    registry.push({
        id: 'helm',
        description: 'Helm polyphonic synthesizer',
        category: 'LV2 Instruments',
        buildScript: 'scripts/build-helm.js',
    });
    writeLv2Registry(ROOT, registry);
}

function constantName(symbol) {
    return symbol.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function doubleLiteral(value) {
    return `${Number(value).toPrecision(15)}`;
}
