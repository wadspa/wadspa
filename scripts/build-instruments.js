#!/usr/bin/env node
/**
 * Build all LV2 plugins listed in plugins/lv2.json.
 *
 * Usage:
 *   node scripts/build-instruments.js [--only <id>] [--skip-existing]
 *
 * After each build (or when skipping an already-built plugin):
 *   - Copies dist/ to docs/plugins/<id>/
 *   - Updates docs/instruments.json with MIDI-driven instruments
 *   - Appends audio-driven LV2 plugins to docs/plugins/catalog.json
 *
 * Requirements:
 *   - emcc on PATH (or EMCC env var)
 *   - wadspa on PATH (npm link from toolchain/)
 *   - LV2 headers (auto-detected at /opt/homebrew/include or /usr/include)
 */

import { execSync }                                                    from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, dirname }                                               from 'path';
import { fileURLToPath }                                               from 'url';
import { readLv2Registry }                                             from './lib/lv2-registry.js';

const ROOT         = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS      = join(ROOT, 'plugins');
const DOCS_PLUGINS = join(ROOT, 'docs', 'plugins');

const lv2Plugins = readLv2Registry(ROOT);

const args         = process.argv.slice(2);
const onlyId       = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const skipExisting = args.includes('--skip-existing');

// Auto-detect the LV2 headers directory.
const LV2_INCLUDE = ['/opt/homebrew/include', '/usr/local/include', '/usr/include']
    .find(p => existsSync(join(p, 'lv2.h'))) ?? '/usr/include';

function run(cmd, opts = {}) {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts });
}

function copyDirContents(srcDir, destDir) {
    mkdirSync(destDir, { recursive: true });
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
        const src = join(srcDir, entry.name);
        const dest = join(destDir, entry.name);
        if (entry.isDirectory()) copyDirContents(src, dest);
        else if (entry.isFile()) writeFileSync(dest, readFileSync(src));
    }
}

function resolveDefault(def, min, max) {
    const s = String(def);
    if (s === 'min')    return min;
    if (s === 'max')    return max;
    if (s === 'low')    return +(min + (max - min) * 0.25).toFixed(6);
    if (s === 'high')   return +(min + (max - min) * 0.75).toFixed(6);
    if (s === 'middle') return +(min + (max - min) * 0.5).toFixed(6);
    const n = parseFloat(s);
    return isNaN(n) ? min : n;
}

function buildCatalogueEntry(manifestEntry, distDir) {
    const indexPath = join(distDir, 'index.js');
    if (!existsSync(indexPath)) return null;

    const src = readFileSync(indexPath, 'utf8');
    const match = src.match(/export const meta\s*=\s*(\{[\s\S]*?\});\s*export/);
    if (!match) return null;

    let meta;
    try { meta = JSON.parse(match[1]); } catch { return null; }

    const wasmFile = readdirSync(distDir).find(f => f.endsWith('.wasm'));
    if (!wasmFile) return null;

    const hasMidiInput = meta.ports.some(p => p.type === 'midi' && p.dir === 'input');

    return {
        id:            manifestEntry.id,
        label:         meta.label,
        name:          meta.name,
        description:   manifestEntry.description ?? '',
        category:      manifestEntry.category ?? (hasMidiInput ? 'LV2 Instruments' : 'LV2 Effects'),
        wasmFile,
        processorFile: 'processor.js',
        ports: meta.ports.map(p => {
            if (p.type !== 'control') return p;
            return { ...p, default: resolveDefault(p.default, p.min, p.max) };
        }),
    };
}

function hasMidiInput(entry) {
    return entry.ports.some(p => p.type === 'midi' && p.dir === 'input');
}

function deploy(manifestEntry, distDir, instrumentEntries, effectEntries) {
    const entry = buildCatalogueEntry(manifestEntry, distDir);
    if (!entry) {
        console.warn(`   ⚠ Could not read meta from ${distDir}/index.js`);
        return;
    }

    if (hasMidiInput(entry)) instrumentEntries.push(entry);
    else effectEntries.push(entry);

    if (!existsSync(DOCS_PLUGINS)) return;
    const dest = join(DOCS_PLUGINS, manifestEntry.id);
    rmSync(dest, { recursive: true, force: true });
    copyDirContents(distDir, dest);
}

let passed = 0, failed = 0, skipped = 0;
const instrumentEntries = [];
const effectEntries = [];
const processedIds = [];

for (const entry of lv2Plugins) {
    if (onlyId && entry.id !== onlyId) continue;
    processedIds.push(entry.id);

    const dir     = join(PLUGINS, entry.id);
    const distDir = join(dir, 'dist');

    if (skipExisting && existsSync(distDir)) {
        console.log(`⏭  ${entry.id} — skipping (dist/ exists)`);
        deploy(entry, distDir, instrumentEntries, effectEntries);
        skipped++;
        continue;
    }

    console.log(`\n▶  ${entry.id}`);
    try {
        if (existsSync(distDir)) rmSync(distDir, { recursive: true, force: true });

        const flags = [`--include "${LV2_INCLUDE}"`];
        if (entry.threads)       flags.push('--threads');
        if (entry.memoryGrowth)  flags.push('--memory-growth');
        for (const f of entry.embedFiles  ?? []) flags.push(`--embed-file "${f}"`);
        for (const i of entry.includes    ?? []) flags.push(`--include "${join(ROOT, i)}"`);
        for (const d of entry.defines     ?? []) flags.push(`--define "${d}"`);
        if (entry.sources) {
            const srcs = (Array.isArray(entry.sources) ? entry.sources : [entry.sources])
                .map(s => join(dir, s)).join(',');
            flags.push(`--sources "${srcs}"`);
        }

        const cmd = `wadspa build-lv2 "${dir}" ${flags.join(' ')}`;
        const out = run(cmd, { cwd: dir });
        console.log(out.trim().split('\n').map(l => '   ' + l).join('\n'));

        deploy(entry, distDir, instrumentEntries, effectEntries);
        passed++;
    } catch (e) {
        console.error(`   ✗ FAILED: ${e.message.split('\n')[0]}`);
        failed++;
    }
}

if (instrumentEntries.length > 0 || !onlyId) {
    const instrumentsPath = join(ROOT, 'docs', 'instruments.json');
    let instrumentsCatalog = [];
    if (onlyId && existsSync(instrumentsPath)) {
        instrumentsCatalog = JSON.parse(readFileSync(instrumentsPath, 'utf8'));
    }
    const processed = new Set(processedIds);
    instrumentsCatalog = instrumentsCatalog.filter(e => !processed.has(e.id));
    instrumentsCatalog.push(...instrumentEntries);
    writeFileSync(instrumentsPath, JSON.stringify(instrumentsCatalog, null, 2));
    console.log(`\nInstruments catalog: ${instrumentsCatalog.length} → docs/instruments.json`);
}

if (effectEntries.length > 0 || (!onlyId && processedIds.length > 0)) {
    const catalogPath = join(DOCS_PLUGINS, 'catalog.json');
    let effectsCatalog = [];
    if (existsSync(catalogPath)) {
        effectsCatalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    }
    const processed = new Set(processedIds);
    effectsCatalog = effectsCatalog.filter(entry => !processed.has(entry.id));
    effectsCatalog.push(...effectEntries);
    writeFileSync(catalogPath, JSON.stringify(effectsCatalog, null, 2));
    console.log(`LV2 effects catalog: ${effectEntries.length} → docs/plugins/catalog.json`);
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`✓ ${passed} built   ✗ ${failed} failed   ⏭ ${skipped} skipped`);
if (failed > 0) process.exit(1);
