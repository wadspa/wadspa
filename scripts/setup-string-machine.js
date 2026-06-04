#!/usr/bin/env node
/**
 * Setup script for string-machine — polyphonic string ensemble synthesizer LV2.
 *
 * string-machine uses DPF (DISTRHO Plugin Framework). Pipeline:
 *   1. Init DPF git submodule
 *   2. Reuse lv2_ttl_generator from zam-plugins (already built)
 *   3. Native compile → .dylib → run TTL generator → patch TTLs
 *   4. Copy all DSP sources + DPF + gen/ headers to plugins/string-machine/
 *   5. Register in lv2.json
 *
 * DSP sources (from Makefile FILES_DSP):
 *   StringMachinePlugin.cpp, StringMachineShared.cpp, StringMachinePresets.cpp,
 *   sources/*.cpp, sources/bbd/*.cpp, sources/dsp/*.cpp,
 *   gen/dsp/*.cpp (pre-generated from Faust),
 *   thirdparty/vco/OscillatorBlepRect.cpp
 */

import {
    copyFileSync, mkdirSync, writeFileSync, existsSync,
    readFileSync, readdirSync, statSync, cpSync,
} from 'fs';
import { execSync, spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT     = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO     = join(ROOT, 'string-machine');
const PLUGIN   = join(REPO, 'plugins', 'string-machine');
const DPF      = join(REPO, 'dpf');
const DISTRHO  = join(DPF, 'distrho');
const ZAM_DPF  = join(ROOT, 'zam-plugins', 'dpf');  // fallback TTL generator

if (!existsSync(REPO)) {
    console.error(`Source not found: ${REPO} — run fetch-sources.js first`);
    process.exit(1);
}

// ── 1. Init DPF submodule ─────────────────────────────────────────────────
if (!existsSync(join(DISTRHO, 'DistrhoPlugin.hpp'))) {
    console.log('  Initializing DPF submodule...');
    // submodule key is "DPF" (capital) per .gitmodules
    execSync('git submodule update --init dpf', { cwd: REPO, stdio: 'inherit' });
} else {
    console.log('  ✓ DPF submodule already initialized');
}

// ── 2. lv2_ttl_generator: prefer string-machine's DPF, fall back to zam-plugins ─
let TTL_GEN = join(DPF, 'utils', 'lv2_ttl_generator');
if (!existsSync(TTL_GEN)) {
    const zamGen = join(ZAM_DPF, 'utils', 'lv2_ttl_generator');
    if (existsSync(zamGen)) {
        TTL_GEN = zamGen;
        console.log('  ✓ Using lv2_ttl_generator from zam-plugins');
    } else {
        console.log('  Building lv2_ttl_generator...');
        execSync('make -C dpf/utils/lv2-ttl-generator', { cwd: REPO, stdio: 'inherit' });
    }
} else {
    console.log('  ✓ lv2_ttl_generator already built');
}

// ── 3. Compile lv2ui_stub.o (no-op lv2ui_descriptor for native link) ─────
const BUILD   = join(REPO, 'build');
const STUB_C  = join(BUILD, '_lv2ui_stub.c');
const STUB_O  = join(BUILD, '_lv2ui_stub.o');
mkdirSync(BUILD, { recursive: true });
writeFileSync(STUB_C, 'const void* lv2ui_descriptor(unsigned i){(void)i;return 0;}\n');
execSync(`cc -c "${STUB_C}" -o "${STUB_O}"`, { stdio: 'inherit' });
console.log('  ✓ lv2ui_stub.o compiled');

// ── DSP source list (from Makefile FILES_DSP) ────────────────────────────
// Paths are relative to the plugin dir. No UI sources included.
const DSP_SOURCES = [
    'StringMachinePlugin.cpp',
    'StringMachineShared.cpp',
    'StringMachinePresets.cpp',
    'sources/StringOsc.cpp',
    'sources/StringSynth.cpp',
    'sources/StringFilters.cpp',
    'sources/SolinaChorus.cpp',
    'sources/SolinaChorusStereo.cpp',
    'sources/MidiDefs.cpp',
    'sources/bbd/bbd_line.cpp',
    'sources/bbd/bbd_filter.cpp',
    'sources/dsp/AHDSREnvelope.cpp',
    'sources/dsp/Delay3Phase.cpp',
    'sources/dsp/Delay3PhaseStereo.cpp',
    'sources/dsp/OnePoleFilter.cpp',
    'gen/dsp/Delay3PhaseDigital.cpp',
    'gen/dsp/Delay3PhaseDigitalStereo.cpp',
    'gen/dsp/LFO3PhaseDual.cpp',
    'gen/dsp/StringFiltersHighshelf.cpp',
    'gen/dsp/NoiseLFO.cpp',
    'gen/dsp/PwmOscillator.cpp',
    'gen/dsp/AsymWaveshaper.cpp',
    'thirdparty/vco/OscillatorBlepRect.cpp',
];

// Include paths for native + WASM compile
const INCLUDE_DIRS = [
    PLUGIN,                                   // StringMachinePlugin.hpp etc.
    join(PLUGIN, 'sources'),                  // StringOsc.h, StringSynth.h etc.
    join(PLUGIN, 'gen'),                      // generated hpp files
    join(PLUGIN, 'meta'),                     // DistrhoPluginInfo.h
    join(PLUGIN, 'thirdparty', 'pl_list'),   // pl_list.hpp
    join(PLUGIN, 'thirdparty', 'vco'),        // OscillatorBlepRect.h
    join(PLUGIN, 'thirdparty', 'blink'),      // DenormalDisabler.h
    DISTRHO,                                  // DistrhoPlugin.hpp etc.
];

const PLUGIN_NAME = 'string_machine';
const PLUGIN_ID   = 'string-machine';
const BIN_DIR     = join(BUILD, `${PLUGIN_NAME}.lv2`);
const OUT_DIR     = join(ROOT, 'plugins', PLUGIN_ID);

mkdirSync(BIN_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// ── 4. Native LV2 compile → .dylib ───────────────────────────────────────
const DYLIB = join(BIN_DIR, `${PLUGIN_NAME}.dylib`);

if (!existsSync(DYLIB)) {
    console.log(`\n── string-machine native build ──`);
    const iflags = INCLUDE_DIRS.map(d => `-I"${d}"`).join(' ');
    const defines = [
        'DISTRHO_PLUGIN_TARGET_LV2',
        'DISTRHO_PLUGIN_HAS_UI=0',
        '__MOD_DEVICES__=0',
    ].map(d => `-D${d}`).join(' ');

    const srcs = [
        ...DSP_SOURCES.map(f => `"${join(PLUGIN, f)}"`),
        `"${join(DISTRHO, 'DistrhoPluginMain.cpp')}"`,
    ].join(' \\\n    ');

    const cmd = [
        `cc -shared -fPIC -O2 -std=c++14`,
        iflags, defines, srcs,
        `"${STUB_O}"`,
        `-lc++`,
        `-o "${DYLIB}"`,
    ].join(' ');

    const r = spawnSync('sh', ['-c', cmd], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (r.status !== 0) {
        const errs = (r.stderr || '').split('\n').filter(l => /error:|fatal:/.test(l)).slice(0, 10);
        console.error('  ✗ native build failed:\n' + errs.join('\n'));
        process.exit(1);
    }
    console.log('  ✓ native .dylib built');
} else {
    console.log('  ✓ native .dylib already exists');
}

// ── 5. Run TTL generator ─────────────────────────────────────────────────
if (!existsSync(join(BIN_DIR, 'manifest.ttl'))) {
    const r = spawnSync(TTL_GEN, [`./${PLUGIN_NAME}.dylib`], {
        cwd: BIN_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    });
    if (r.status !== 0) {
        console.error(`  ✗ TTL generation failed: ${r.stderr?.trim()}`);
        process.exit(1);
    }
    console.log('  ✓ TTL generated');
} else {
    console.log('  ✓ TTL already generated');
}

// ── 6. Patch and copy TTLs ───────────────────────────────────────────────
let manifest = readFileSync(join(BIN_DIR, 'manifest.ttl'), 'utf8');
manifest = manifest.replace(/\.dylib>/g, '.wasm>').replace(/\.so>/g, '.wasm>');
manifest = manifest.replace(/^<[^>]*#DPF_UI>[\s\S]*?(?=\n<|\n$|$)/mg, '').replace(/\n{3,}/g, '\n\n');
manifest = manifest.replace(/^<[^>]*#preset[^>]*>[\s\S]*?(?=\n<|\n$|$)/mg, '').replace(/\n{3,}/g, '\n\n');
writeFileSync(join(OUT_DIR, 'manifest.ttl'), manifest.trim() + '\n');

const pluginTtlSrc = join(BIN_DIR, `${PLUGIN_NAME}.ttl`);
if (existsSync(pluginTtlSrc)) {
    let ttl = readFileSync(pluginTtlSrc, 'utf8');
    ttl = ttl.replace(/^\s*ui:ui\s+<[^>]+>\s*;/mg, '');
    writeFileSync(join(OUT_DIR, `${PLUGIN_NAME}.ttl`), ttl);
}
console.log('  ✓ TTLs patched and copied');

// Helper: recursive copy
function copyDir(src, dst) {
    mkdirSync(dst, { recursive: true });
    for (const name of readdirSync(src)) {
        const s = join(src, name), d = join(dst, name);
        statSync(s).isDirectory() ? copyDir(s, d) : copyFileSync(s, d);
    }
}

// ── 7. Copy DPF framework ────────────────────────────────────────────────
const dpfOut = join(OUT_DIR, 'dpf');
if (!existsSync(dpfOut)) copyDir(DISTRHO, dpfOut);

// ── 8. Copy DSP source tree ───────────────────────────────────────────────
// Copy: plugin root files, sources/, gen/, meta/, thirdparty/pl_list, thirdparty/vco
function copyPluginDir(relDir) {
    const srcDir = join(PLUGIN, relDir);
    const dstDir = join(OUT_DIR, relDir);
    if (!existsSync(srcDir)) return;
    mkdirSync(dstDir, { recursive: true });
    for (const f of readdirSync(srcDir)) {
        const s = join(srcDir, f), d = join(dstDir, f);
        if (statSync(s).isDirectory()) {
            // recurse into non-UI subdirs
            if (f !== 'ui' && f !== 'artwork' && f !== 'layouts') copyDir(s, d);
        } else if (!f.endsWith('.png') && !f.endsWith('.ttf') && !f.endsWith('.fl')) {
            copyFileSync(s, d);
        }
    }
}

// Plugin root (cpp/hpp/h/inc only, skip UI and Makefile)
for (const f of readdirSync(PLUGIN)) {
    const s = join(PLUGIN, f);
    if (statSync(s).isDirectory()) continue;
    if (/(UI\.|Artwork\.|Makefile|\.png$|\.ttf$|\.fl$)/.test(f)) continue;
    if (f.endsWith('.cpp') || f.endsWith('.hpp') || f.endsWith('.h') || f.endsWith('.inc')) {
        copyFileSync(s, join(OUT_DIR, f));
    }
}
copyPluginDir('sources');
copyPluginDir('gen');
copyPluginDir('meta');
copyDir(join(PLUGIN, 'thirdparty', 'pl_list'), join(OUT_DIR, 'thirdparty', 'pl_list'));
copyDir(join(PLUGIN, 'thirdparty', 'vco'),     join(OUT_DIR, 'thirdparty', 'vco'));
copyDir(join(PLUGIN, 'thirdparty', 'blink'),   join(OUT_DIR, 'thirdparty', 'blink'));

// ── 9. Patch DistrhoPluginInfo.h: disable UI ─────────────────────────────
const infoPath = join(OUT_DIR, 'meta', 'DistrhoPluginInfo.h');
if (existsSync(infoPath)) {
    let info = readFileSync(infoPath, 'utf8');
    info = info.replace(/(#define\s+DISTRHO_PLUGIN_HAS_UI\s+)\d+/, '$10');
    info = info.replace(/(#define\s+DISTRHO_PLUGIN_HAS_EMBED_UI\s+)\d+/, '$10');
    writeFileSync(infoPath, info);
}

// ── 10. Write lv2ui_stub.cpp ─────────────────────────────────────────────
writeFileSync(join(OUT_DIR, 'lv2ui_stub.cpp'), [
    'extern "C" {',
    '    const void* lv2ui_descriptor(unsigned index) { (void)index; return nullptr; }',
    '}',
    '',
].join('\n'));

console.log('  ✓ Sources copied');

// ── 11. Register in lv2.json ─────────────────────────────────────────────
// Source paths relative to OUT_DIR (how build-instruments.js resolves them)
const dspSourcesRelative = [
    'StringMachinePlugin.cpp',
    'StringMachineShared.cpp',
    'StringMachinePresets.cpp',
    'sources/StringOsc.cpp',
    'sources/StringSynth.cpp',
    'sources/StringFilters.cpp',
    'sources/SolinaChorus.cpp',
    'sources/SolinaChorusStereo.cpp',
    'sources/MidiDefs.cpp',
    'sources/bbd/bbd_line.cpp',
    'sources/bbd/bbd_filter.cpp',
    'sources/dsp/AHDSREnvelope.cpp',
    'sources/dsp/Delay3Phase.cpp',
    'sources/dsp/Delay3PhaseStereo.cpp',
    'sources/dsp/OnePoleFilter.cpp',
    'gen/dsp/Delay3PhaseDigital.cpp',
    'gen/dsp/Delay3PhaseDigitalStereo.cpp',
    'gen/dsp/LFO3PhaseDual.cpp',
    'gen/dsp/StringFiltersHighshelf.cpp',
    'gen/dsp/NoiseLFO.cpp',
    'gen/dsp/PwmOscillator.cpp',
    'gen/dsp/AsymWaveshaper.cpp',
    'thirdparty/vco/OscillatorBlepRect.cpp',
    'dpf/DistrhoPluginMain.cpp',
    'lv2ui_stub.cpp',
];

const entry = {
    id:          PLUGIN_ID,
    description: 'String machine — polyphonic string ensemble synthesizer LV2',
    category:    'Instruments',
    sources:     dspSourcesRelative,
    includes: [
        `plugins/${PLUGIN_ID}`,
        `plugins/${PLUGIN_ID}/sources`,
        `plugins/${PLUGIN_ID}/gen`,
        `plugins/${PLUGIN_ID}/meta`,
        `plugins/${PLUGIN_ID}/thirdparty/pl_list`,
        `plugins/${PLUGIN_ID}/thirdparty/vco`,
        `plugins/${PLUGIN_ID}/thirdparty/blink`,
        `plugins/${PLUGIN_ID}/dpf`,
    ],
    defines: [
        'DISTRHO_PLUGIN_TARGET_LV2',
        'DISTRHO_PLUGIN_HAS_UI=0',
    ],
};

const registry = readLv2Registry(ROOT);
const existing = registry.findIndex(e => e.id === PLUGIN_ID);
if (existing >= 0) registry[existing] = entry;
else registry.push(entry);
writeLv2Registry(ROOT, registry);

console.log('\n✓ string-machine setup complete');
console.log('  Run: node scripts/build-instruments.js --only string-machine');
