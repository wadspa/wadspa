#!/usr/bin/env node
/**
 * Setup script for wolf-shaper — waveshaper audio effect LV2.
 *
 * wolf-shaper uses DPF (DISTRHO Plugin Framework). Pipeline:
 *   1. Init DPF git submodule
 *   2. Reuse lv2_ttl_generator from zam-plugins (already built)
 *   3. Native compile → .dylib → TTL generator → patch TTLs
 *   4. Copy DSP sources + DPF to plugins/wolf-shaper/
 *   5. Register in lv2.json as an Effects plugin
 */

import {
    copyFileSync, mkdirSync, writeFileSync, existsSync,
    readFileSync, readdirSync, statSync,
} from 'fs';
import { execSync, spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO    = join(ROOT, 'wolf-shaper');
const SRC     = join(REPO, 'src');
const DPF     = join(REPO, 'dpf');
const DISTRHO = join(DPF, 'distrho');
const ZAM_DPF = join(ROOT, 'zam-plugins', 'dpf');

if (!existsSync(REPO)) {
    console.error(`Source not found: ${REPO} — run fetch-sources.js first`);
    process.exit(1);
}

// ── 1. Init DPF submodule ─────────────────────────────────────────────────
if (!existsSync(join(DISTRHO, 'DistrhoPlugin.hpp'))) {
    console.log('  Initializing DPF submodule...');
    execSync('git submodule update --init dpf', { cwd: REPO, stdio: 'inherit' });
} else {
    console.log('  ✓ DPF submodule already initialized');
}

// ── 2. lv2_ttl_generator ─────────────────────────────────────────────────
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

// ── 3. lv2ui_stub.o ──────────────────────────────────────────────────────
const BUILD  = join(REPO, 'build');
const STUB_C = join(BUILD, '_lv2ui_stub.c');
const STUB_O = join(BUILD, '_lv2ui_stub.o');
mkdirSync(BUILD, { recursive: true });
writeFileSync(STUB_C, 'const void* lv2ui_descriptor(unsigned i){(void)i;return 0;}\n');
execSync(`cc -c "${STUB_C}" -o "${STUB_O}"`, { stdio: 'inherit' });
console.log('  ✓ lv2ui_stub.o compiled');

// ── DSP sources (from src/Makefile FILES_DSP) ─────────────────────────────
// Note: DSPFilters has a duplicate Butterworth.cpp in the Makefile — de-dup here.
const DSP_SOURCES_REL = [
    'WolfShaperPlugin.cpp',
    'Utils/src/Mathf.cpp',
    'Structures/src/Graph.cpp',
    'Structures/src/Oversampler.cpp',
    'Structures/src/ParamSmooth.cpp',
    '../libs/DSPFilters/source/Butterworth.cpp',
    '../libs/DSPFilters/source/Biquad.cpp',
    '../libs/DSPFilters/source/Cascade.cpp',
    '../libs/DSPFilters/source/Filter.cpp',
    '../libs/DSPFilters/source/Param.cpp',
    '../libs/DSPFilters/source/PoleFilter.cpp',
    '../libs/DSPFilters/source/RBJ.cpp',
    '../libs/DSPFilters/source/Bessel.cpp',
    '../libs/DSPFilters/source/RootFinder.cpp',
];

const INCLUDE_DIRS = [
    SRC,                                          // DistrhoPluginInfo.h, WolfShaperPlugin.hpp
    join(SRC, 'Structures'),                      // Graph.hpp, Oversampler.hpp etc.
    join(SRC, 'Utils'),                           // Mathf.hpp
    join(REPO, 'libs', 'DSPFilters', 'include'), // DSP filter headers
    DISTRHO,                                      // DistrhoPlugin.hpp (native build)
    join(DPF, 'dgl'),                             // Geometry.hpp (native build)
];

const PLUGIN_NAME = 'wolf_shaper';
const PLUGIN_ID   = 'wolf-shaper';
const BIN_DIR     = join(BUILD, `${PLUGIN_NAME}.lv2`);
const OUT_DIR     = join(ROOT, 'plugins', PLUGIN_ID);

mkdirSync(BIN_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// ── 4. Native LV2 compile ────────────────────────────────────────────────
const DYLIB = join(BIN_DIR, `${PLUGIN_NAME}.dylib`);
if (!existsSync(DYLIB)) {
    console.log(`\n── wolf-shaper native build ──`);
    const iflags = INCLUDE_DIRS.map(d => `-I"${d}"`).join(' ');
    const defines = [
        'DISTRHO_PLUGIN_TARGET_LV2',
        'DISTRHO_PLUGIN_HAS_UI=0',
        'DISTRHO_UI_USE_NANOVG=0',
    ].map(d => `-D${d}`).join(' ');

    const srcs = [
        ...DSP_SOURCES_REL.map(f => `"${join(SRC, f)}"`),
        `"${join(DISTRHO, 'DistrhoPluginMain.cpp')}"`,    // DPF LV2 entry point
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

// ── 5. TTL generation ────────────────────────────────────────────────────
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
writeFileSync(join(OUT_DIR, 'manifest.ttl'), manifest.trim() + '\n');

const pluginTtlSrc = join(BIN_DIR, `${PLUGIN_NAME}.ttl`);
if (existsSync(pluginTtlSrc)) {
    let ttl = readFileSync(pluginTtlSrc, 'utf8');
    ttl = ttl.replace(/^\s*ui:ui\s+<[^>]+>\s*;/mg, '');
    writeFileSync(join(OUT_DIR, `${PLUGIN_NAME}.ttl`), ttl);
}
console.log('  ✓ TTLs patched and copied');

// ── 7. Copy DPF framework ────────────────────────────────────────────────
function copyDir(src, dst) {
    mkdirSync(dst, { recursive: true });
    for (const name of readdirSync(src)) {
        const s = join(src, name), d = join(dst, name);
        statSync(s).isDirectory() ? copyDir(s, d) : copyFileSync(s, d);
    }
}

// Copy full DPF tree (dgl uses ../distrho/... relative paths, so structure must be preserved)
const dpfOut = join(OUT_DIR, 'dpf_full');
if (!existsSync(dpfOut)) {
    copyDir(DISTRHO,          join(dpfOut, 'distrho'));
    copyDir(join(DPF, 'dgl'), join(dpfOut, 'dgl'));
}

// ── 8. Copy DSP source tree ───────────────────────────────────────────────
// src/ (plugin + DSP, skip UI), libs/DSPFilters
function copyFiltered(srcDir, dstDir, skipUI = true) {
    mkdirSync(dstDir, { recursive: true });
    for (const f of readdirSync(srcDir)) {
        if (skipUI && /^(WolfShaperUI|Widgets|Resources)/.test(f)) continue;
        const s = join(srcDir, f), d = join(dstDir, f);
        if (statSync(s).isDirectory()) copyFiltered(s, d, skipUI);
        else if (!f.endsWith('.png') && !f.endsWith('.ttf')) copyFileSync(s, d);
    }
}
copyFiltered(SRC,                              join(OUT_DIR, 'src'));
copyFiltered(join(REPO, 'libs', 'DSPFilters'), join(OUT_DIR, 'libs', 'DSPFilters'), false);

// ── 9. Patch DistrhoPluginInfo.h: disable UI ─────────────────────────────
const infoPath = join(OUT_DIR, 'src', 'DistrhoPluginInfo.h');
if (existsSync(infoPath)) {
    let info = readFileSync(infoPath, 'utf8');
    info = info.replace(/(#define\s+DISTRHO_PLUGIN_HAS_UI\s+)\d+/, '$10');
    info = info.replace(/(#define\s+DISTRHO_UI_USE_NANOVG\s+)\d+/, '$10');
    // Disable state (requires LV2 State extension the shim doesn't provide)
    info = info.replace(/(#define\s+DISTRHO_PLUGIN_WANT_STATE\s+)\d+/, '$10');
    info = info.replace(/(#define\s+DISTRHO_PLUGIN_WANT_FULL_STATE\s+)\d+/, '$10');
    writeFileSync(infoPath, info);
}

// ── 10. lv2ui_stub.cpp ───────────────────────────────────────────────────
// lv2ui_stub goes at the OUT_DIR root (same level as dpf_full/)
writeFileSync(join(OUT_DIR, 'lv2ui_stub.cpp'), [
    'extern "C" {',
    '    const void* lv2ui_descriptor(unsigned index) { (void)index; return nullptr; }',
    '}',
    '',
].join('\n'));

console.log('  ✓ Sources copied');

// ── 11. Register in lv2.json ─────────────────────────────────────────────
const dspSources = [
    'src/WolfShaperPlugin.cpp',
    'src/Utils/src/Mathf.cpp',
    'src/Structures/src/Graph.cpp',
    'src/Structures/src/Oversampler.cpp',
    'src/Structures/src/ParamSmooth.cpp',
    'libs/DSPFilters/source/Butterworth.cpp',
    'libs/DSPFilters/source/Biquad.cpp',
    'libs/DSPFilters/source/Cascade.cpp',
    'libs/DSPFilters/source/Filter.cpp',
    'libs/DSPFilters/source/Param.cpp',
    'libs/DSPFilters/source/PoleFilter.cpp',
    'libs/DSPFilters/source/RBJ.cpp',
    'libs/DSPFilters/source/Bessel.cpp',
    'libs/DSPFilters/source/RootFinder.cpp',
    'dpf_full/distrho/DistrhoPluginMain.cpp',
    'lv2ui_stub.cpp',
];

const entry = {
    id:          PLUGIN_ID,
    description: 'Wolf Shaper — waveshaper LV2 effect',
    category:    'Effects',
    sources:     dspSources,
    extraExports:  ['_shim_set_plugin_state', '_malloc', '_free'],
    extraFeatures: ['worker'],  // DPF WANT_STATE=1 requires LV2_Worker_Schedule
    shaper:        true,        // expose canvas curve editor in the UI
    includes: [
        `plugins/${PLUGIN_ID}/src`,
        `plugins/${PLUGIN_ID}/src/Structures`,
        `plugins/${PLUGIN_ID}/src/Utils`,
        `plugins/${PLUGIN_ID}/dpf_full/distrho`,
        `plugins/${PLUGIN_ID}/dpf_full/dgl`,
        `plugins/${PLUGIN_ID}/libs/DSPFilters/include`,
    ],
    defines: [
        'DISTRHO_PLUGIN_TARGET_LV2',
        'DISTRHO_PLUGIN_HAS_UI=0',
        'DISTRHO_UI_USE_NANOVG=0',
    ],
};

const registry = readLv2Registry(ROOT);
const existing = registry.findIndex(e => e.id === PLUGIN_ID);
if (existing >= 0) registry[existing] = entry;
else registry.push(entry);
writeLv2Registry(ROOT, registry);

console.log('\n✓ wolf-shaper setup complete');
console.log('  Run: node scripts/build-instruments.js --only wolf-shaper');
