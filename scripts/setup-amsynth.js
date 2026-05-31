#!/usr/bin/env node
/**
 * Set up the amsynth LV2 plugin directory for wadspa compilation.
 *
 * amsynth is a polyphonic analog-modeling synthesizer with 38 parameters.
 * Its core DSP is pure C++ (no Qt, no GTK) — only the standalone and UI
 * layers have system dependencies. We copy just the LV2 plugin + core synth
 * sources into plugins/amsynth/ and add a minimal config.h stub so the
 * build system can compile it without autoconf.
 *
 * Usage:
 *   node scripts/setup-amsynth.js
 */

import { existsSync, mkdirSync, copyFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT      = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC       = join(ROOT, 'amsynth');
const PLUGIN_ID = 'amsynth';
const DEST      = join(ROOT, 'plugins', PLUGIN_ID);

if (!existsSync(SRC)) {
    console.error('amsynth not found. Run: node scripts/fetch-sources.js --only amsynth');
    process.exit(1);
}

mkdirSync(DEST, { recursive: true });
mkdirSync(join(DEST, 'core', 'synth'), { recursive: true });
mkdirSync(join(DEST, 'core', 'midi'), { recursive: true });
mkdirSync(join(DEST, 'freeverb'), { recursive: true });

console.log(`▶  ${PLUGIN_ID}`);

// TTL files
const ttlBundle = join(SRC, 'data', 'amsynth.lv2');
for (const f of readdirSync(ttlBundle)) {
    if (f.endsWith('.ttl')) {
        copyFileSync(join(ttlBundle, f), join(DEST, f));
        console.log(`   ✓ ${f}`);
    }
}

// LV2 plugin entry point
const lv2Src = join(SRC, 'src', 'plugins', 'lv2');
for (const f of ['lv2plugin.cpp', 'lv2plugin.h']) {
    copyFileSync(join(lv2Src, f), join(DEST, f));
    console.log(`   ✓ ${f}`);
}

// Core synth DSP files (no Qt, no GTK, no GUI)
const coreSynth = join(SRC, 'src', 'core', 'synth');
for (const f of readdirSync(coreSynth)) {
    if (f.endsWith('.cpp') || f.endsWith('.h')) {
        copyFileSync(join(coreSynth, f), join(DEST, 'core', 'synth', f));
    }
}
console.log('   ✓ core/synth/');

// Core headers needed by core/synth
for (const f of ['controls.h', 'types.h', 'midi.h', 'filesystem.h', 'gettext.h']) {
    const s = join(SRC, 'src', 'core', f);
    if (existsSync(s)) {
        copyFileSync(s, join(DEST, 'core', f));
        console.log(`   ✓ core/${f}`);
    }
}

// Stub filesystem.cpp — preset bank file I/O is not needed in WASM
writeFileSync(join(DEST, 'core', 'filesystem.cpp'), `\
#include "filesystem.h"
filesystem& filesystem::get() { static filesystem fs; return fs; }
filesystem::filesystem() {}
bool filesystem::copy(const std::string&, const std::string&) { return false; }
bool filesystem::create_dir(const std::string&) { return false; }
bool filesystem::exists(const std::string&) { return false; }
bool filesystem::move(const std::string&, const std::string&) { return false; }
`);
console.log('   ✓ core/filesystem.cpp (stub)');

// Freeverb reverb engine (external dependency bundled in amsynth)
const freeverbSrc = join(SRC, 'external', 'freeverb');
for (const f of readdirSync(freeverbSrc)) {
    if (f.endsWith('.cpp') || f.endsWith('.hpp') || f.endsWith('.h')) {
        copyFileSync(join(freeverbSrc, f), join(DEST, 'freeverb', f));
    }
}
console.log('   ✓ freeverb/');

// Minimal config.h stub (replaces autoconf-generated file)
writeFileSync(join(DEST, 'config.h'), `\
#pragma once
/* wadspa stub — replaces autoconf config.h for WASM builds */
#define PACKAGE_STRING "amsynth"
/* MTS-ESP microtuning: disabled (submodule not present) */
/* #undef WITH_MTS_ESP */
`);
console.log('   ✓ config.h (stub)');

// lv2.json entry to add
const entry = {
    id:          PLUGIN_ID,
    description: 'amsynth — analog modeling synthesizer, 32-voice polyphonic',
    category:    'Instruments',
    sources: [
        'lv2plugin.cpp',
        'core/synth/Synthesizer.cpp',
        'core/synth/VoiceAllocationUnit.cpp',
        'core/synth/VoiceBoard.cpp',
        'core/synth/ADSR.cpp',
        'core/synth/Oscillator.cpp',
        'core/synth/LowPassFilter.cpp',
        'core/synth/Distortion.cpp',
        'core/synth/SoftLimiter.cpp',
        'core/synth/MidiController.cpp',
        'core/synth/Parameter.cpp',
        'core/synth/Preset.cpp',
        'core/synth/PresetController.cpp',
        'core/synth/TuningMap.cpp',
        'freeverb/revmodel.cpp',
        'freeverb/allpass.cpp',
        'freeverb/comb.cpp',
        'core/filesystem.cpp',
    ],
};

console.log('\n── Add to plugins/lv2.json ──────────────────────────────\n');
console.log(JSON.stringify(entry, null, 2));
