#!/usr/bin/env node
/**
 * Setup script for zam-plugins — ZamAudio LV2 compressor/gate/EQ suite.
 *
 * zam-plugins uses the DPF (DISTRHO Plugin Framework) which generates TTL
 * metadata at build time by compiling a native binary and running an extractor.
 *
 * Pipeline:
 *   1. Init DPF git submodule
 *   2. Compile lv2_ttl_generator (native tool)
 *   3. Compile lv2ui_stub.o (stub for lv2ui_descriptor — not used in WASM)
 *   4. For each plugin: native LV2 build → run TTL generator → copy TTL
 *   5. For each plugin: copy DSP sources + DPF framework → plugins/<id>/
 *   6. Register in lv2.json with DPF compile flags
 */

import {
    copyFileSync, mkdirSync, writeFileSync, existsSync,
    readFileSync, readdirSync, statSync, cpSync,
} from 'fs';
import { execSync, spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT   = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO   = join(ROOT, 'zam-plugins');
const DPF    = join(REPO, 'dpf');
const DISTRHO = join(DPF, 'distrho');

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

// ── 2. Build lv2_ttl_generator ─────────────────────────────────────────────
const TTL_GEN = join(DPF, 'utils', 'lv2_ttl_generator');
if (!existsSync(TTL_GEN)) {
    console.log('  Building lv2_ttl_generator...');
    execSync('make -C dpf/utils/lv2-ttl-generator', { cwd: REPO, stdio: 'inherit' });
} else {
    console.log('  ✓ lv2_ttl_generator already built');
}

// ── 3. Compile lv2ui_stub.o ───────────────────────────────────────────────
// DPF forces lv2ui_descriptor to be defined in the binary even when HAS_UI=0.
// We provide a no-op stub so the native LV2 .dylib links correctly.
const STUB_C  = join(REPO, 'build', '_lv2ui_stub.c');
const STUB_O  = join(REPO, 'build', '_lv2ui_stub.o');
mkdirSync(join(REPO, 'build'), { recursive: true });
writeFileSync(STUB_C, 'const void* lv2ui_descriptor(unsigned i){(void)i;return 0;}\n');
execSync(`cc -c "${STUB_C}" -o "${STUB_O}"`, { stdio: 'inherit' });
console.log('  ✓ lv2ui_stub.o compiled');

// ── Plugin list (from Makefile PLUGINS variable) ───────────────────────────
const PLUGINS = [
    'ZamComp', 'ZamCompX2', 'ZaMultiComp', 'ZaMultiCompX2',
    'ZamTube', 'ZamEQ2', 'ZamAutoSat', 'ZamGEQ31',
    'ZamGate', 'ZamGateX2', 'ZaMaximX2',
    'ZamDelay', 'ZamNoise', 'ZamPhono', 'ZamVerb',
    'ZamDynamicEQ', 'ZamHeadX2', 'ZamGrains', 'ZamEcho',
];

const registry = readLv2Registry(ROOT);

// Helper: copy a directory recursively
function copyDir(src, dst) {
    mkdirSync(dst, { recursive: true });
    for (const name of readdirSync(src)) {
        const s = join(src, name), d = join(dst, name);
        if (statSync(s).isDirectory()) copyDir(s, d);
        else copyFileSync(s, d);
    }
}

let succeeded = 0, failed = 0;

for (const name of PLUGINS) {
    const pluginSrc = join(REPO, 'plugins', name);
    if (!existsSync(pluginSrc)) {
        console.warn(`  ⚠ ${name} — source dir not found, skipping`);
        failed++;
        continue;
    }

    const id     = name; // e.g. "ZamComp"
    const binDir = join(REPO, 'bin', `${name}.lv2`);
    const outDir = join(ROOT, 'plugins', id);
    mkdirSync(outDir, { recursive: true });

    // ── 4a. Native LV2 build (without DGL, with lv2ui stub) ─────────────
    if (!existsSync(join(binDir, `${name}.dylib`))) {
        console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 46 - name.length))}`);
        const buildResult = spawnSync(
            'make', ['-C', `plugins/${name}`, 'lv2', `HAVE_DGL=false`, `LDFLAGS=${STUB_O}`],
            { cwd: REPO, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
        if (buildResult.status !== 0) {
            console.error(`  ✗ native build failed for ${name}:`);
            console.error((buildResult.stderr || '').split('\n').filter(l => /error:/.test(l)).slice(0, 5).join('\n'));
            failed++;
            continue;
        }
    }

    // ── 4b. Run TTL generator (from bundle dir so TTL lands there) ───────
    if (!existsSync(join(binDir, 'manifest.ttl'))) {
        const genResult = spawnSync(
            TTL_GEN, [`./${name}.dylib`],
            { cwd: binDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
        if (genResult.status !== 0) {
            console.error(`  ✗ TTL generation failed for ${name}: ${genResult.stderr?.trim()}`);
            failed++;
            continue;
        }
    }

    // ── 4c. Copy and fix TTL: .dylib → .wasm, strip UI entries ──────────
    let manifest = readFileSync(join(binDir, 'manifest.ttl'), 'utf8');
    // Replace native extension with .wasm
    manifest = manifest.replace(/\.dylib>/g, '.wasm>').replace(/\.so>/g, '.wasm>');
    // Strip UI entry (we don't build the WebGL UI)
    manifest = manifest.replace(/^<[^>]*#DPF_UI>[\s\S]*?(?=\n<|\n$|$)/mg, '').replace(/\n{3,}/g, '\n\n');
    // Strip preset entries (optional — presets not yet supported)
    manifest = manifest.replace(/^<[^>]*#preset[^>]*>[\s\S]*?(?=\n<|\n$|$)/mg, '').replace(/\n{3,}/g, '\n\n');
    writeFileSync(join(outDir, 'manifest.ttl'), manifest.trim() + '\n');

    // Copy main plugin TTL (keep as-is — port definitions are correct)
    const pluginTtl = join(binDir, `${name}.ttl`);
    if (existsSync(pluginTtl)) {
        let ttl = readFileSync(pluginTtl, 'utf8');
        // Strip ui:ui reference since we're not building UI
        ttl = ttl.replace(/^\s*ui:ui\s+<[^>]+>\s*;/mg, '');
        writeFileSync(join(outDir, `${name}.ttl`), ttl);
    }

    // ── 5a. Copy DPF framework (distrho/) to plugin dir ─────────────────
    const dpfOut = join(outDir, 'dpf');
    if (!existsSync(dpfOut)) {
        copyDir(DISTRHO, dpfOut);
    }

    // ── 5b. Copy plugin DSP source files (exclude UI, keep Plugin + hpp) ─
    const pluginFiles = readdirSync(pluginSrc).filter(f => {
        if (f === 'Makefile' || f.endsWith('.rdf')) return false;
        if (/UI\.(cpp|hpp)$/.test(f)) return false;   // skip UI
        if (/Artwork\.(cpp|hpp)$/.test(f)) return false; // skip artwork (removed from Info.h)
        if (f === 'artwork' && statSync(join(pluginSrc, f)).isDirectory()) return false;
        return f.endsWith('.cpp') || f.endsWith('.hpp') || f.endsWith('.h');
    });
    for (const f of pluginFiles) {
        copyFileSync(join(pluginSrc, f), join(outDir, f));
    }

    // ── 5c. Patch DistrhoPluginInfo.h: disable UI and remove artwork include
    const infoPath = join(outDir, 'DistrhoPluginInfo.h');
    if (existsSync(infoPath)) {
        let info = readFileSync(infoPath, 'utf8');
        // Remove artwork include
        info = info.replace(/^#include\s+"[^"]*Artwork\.hpp"\s*$/mg, '');
        // Force HAS_UI to 0 (override the plugin's original setting)
        info = info.replace(/(#define\s+DISTRHO_PLUGIN_HAS_UI\s+)\d+/, '$10');
        // Remove UI dimension macros (they referenced artwork constants)
        info = info.replace(/^#define\s+DISTRHO_UI_DEFAULT_WIDTH\s+.*$/mg, '');
        info = info.replace(/^#define\s+DISTRHO_UI_DEFAULT_HEIGHT\s+.*$/mg, '');
        writeFileSync(infoPath, info);
    }

    // ── 5d. Write lv2ui_stub.cpp (provides no-op lv2ui_descriptor) ───────
    writeFileSync(join(outDir, 'lv2ui_stub.cpp'), [
        'extern "C" {',
        '    const void* lv2ui_descriptor(unsigned index) { (void)index; return nullptr; }',
        '}',
        '',
    ].join('\n'));

    // ── 6. Register in lv2.json ──────────────────────────────────────────
    // Include all plugin-specific .cpp files (excludes UI, artwork, DPF framework)
    const dspSources = pluginFiles.filter(f => f.endsWith('.cpp'));
    if (dspSources.length === 0) {
        console.warn(`  ⚠ ${name} — no .cpp sources found, skipping lv2.json entry`);
        failed++;
        continue;
    }

    const entry = {
        id,
        description: `${name} (ZamAudio LV2)`,
        category: 'Effects',
        sources: [...dspSources, 'dpf/DistrhoPluginMain.cpp', 'lv2ui_stub.cpp'],
        includes: [`plugins/${id}`, `plugins/${id}/dpf`],
        defines: ['DISTRHO_PLUGIN_TARGET_LV2'],
    };
    const existing = registry.findIndex(e => e.id === id);
    if (existing >= 0) registry[existing] = entry;
    else registry.push(entry);

    console.log(`  ✓ ${name}`);
    succeeded++;
}

writeLv2Registry(ROOT, registry);
console.log(`\n✓ zam-plugins setup: ${succeeded} plugins   ✗ ${failed} failed`);
console.log('  Run: node scripts/build-instruments.js --only ZamComp');
