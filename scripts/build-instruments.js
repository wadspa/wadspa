#!/usr/bin/env node
/**
 * Build all LV2 instruments listed in plugins/instruments.json.
 *
 * Usage:
 *   node scripts/build-instruments.js [--only <id>] [--skip-existing]
 *
 * After each build (or when skipping an already-built instrument):
 *   - Copies dist/ to docs/plugins/<id>/
 *   - Updates docs/instruments.json
 *
 * Requirements:
 *   - emcc on PATH (or EMCC env var)
 *   - wadspa on PATH (npm link from toolchain/)
 *   - LV2 headers (auto-detected at /opt/homebrew/include or /usr/include)
 */

import { execSync }                                                    from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname }                                               from 'path';
import { fileURLToPath }                                               from 'url';

const ROOT         = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS      = join(ROOT, 'plugins');
const DOCS_PLUGINS = join(ROOT, 'docs', 'plugins');

const instruments = JSON.parse(readFileSync(join(PLUGINS, 'instruments.json'), 'utf8'));

const args         = process.argv.slice(2);
const onlyId       = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const skipExisting = args.includes('--skip-existing');

// Auto-detect the LV2 headers directory.
const LV2_INCLUDE = ['/opt/homebrew/include', '/usr/local/include', '/usr/include']
    .find(p => existsSync(join(p, 'lv2.h'))) ?? '/usr/include';

function run(cmd, opts = {}) {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts });
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

    return {
        id:            manifestEntry.id,
        label:         meta.label,
        name:          meta.name,
        description:   manifestEntry.description ?? '',
        wasmFile,
        processorFile: 'processor.js',
        ports: meta.ports.map(p => {
            if (p.type !== 'control') return p;
            return { ...p, default: resolveDefault(p.default, p.min, p.max) };
        }),
    };
}

function deploy(manifestEntry, distDir, catalogEntries) {
    const entry = buildCatalogueEntry(manifestEntry, distDir);
    if (!entry) {
        console.warn(`   ⚠ Could not read meta from ${distDir}/index.js`);
        return;
    }
    catalogEntries.push(entry);

    if (!existsSync(DOCS_PLUGINS)) return;
    const dest = join(DOCS_PLUGINS, manifestEntry.id);
    mkdirSync(dest, { recursive: true });
    run(`cp -r "${distDir}/." "${dest}/"`);
}

let passed = 0, failed = 0, skipped = 0;
const catalogEntries = [];

for (const entry of instruments) {
    if (onlyId && entry.id !== onlyId) continue;

    const dir     = join(PLUGINS, entry.id);
    const distDir = join(dir, 'dist');

    if (skipExisting && existsSync(distDir)) {
        console.log(`⏭  ${entry.id} — skipping (dist/ exists)`);
        deploy(entry, distDir, catalogEntries);
        skipped++;
        continue;
    }

    console.log(`\n▶  ${entry.id}`);
    try {
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

        deploy(entry, distDir, catalogEntries);
        passed++;
    } catch (e) {
        console.error(`   ✗ FAILED: ${e.message.split('\n')[0]}`);
        failed++;
    }
}

if (catalogEntries.length > 0) {
    writeFileSync(
        join(ROOT, 'docs', 'instruments.json'),
        JSON.stringify(catalogEntries, null, 2)
    );
    console.log(`\nInstruments catalog: ${catalogEntries.length} → docs/instruments.json`);
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`✓ ${passed} built   ✗ ${failed} failed   ⏭ ${skipped} skipped`);
if (failed > 0) process.exit(1);
