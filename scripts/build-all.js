#!/usr/bin/env node
/**
 * Build all plugins listed in plugins/manifest.json.
 *
 * Usage:
 *   node scripts/build-all.js [--only <id>] [--skip-existing]
 *
 * After each successful build (or when skipping an already-built plugin):
 *   - Copies dist/ to docs/plugins/<id>/
 *   - Updates docs/plugins/catalog.json
 *
 * Requirements:
 *   - emcc on PATH (or EMCC env var)
 *   - perl on PATH (for swh-plugins/makestub.pl)
 *   - wadspa on PATH (npm link from toolchain/)
 */

import { execSync }                                                              from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, dirname }                                                          from 'path';
import { fileURLToPath }                                                          from 'url';

const ROOT        = join(dirname(fileURLToPath(import.meta.url)), '..');
const SWH         = join(ROOT, 'swh-plugins');
const PLUGINS     = join(ROOT, 'plugins');
const SHARED      = join(PLUGINS, 'shared');
const MAKESTUB    = join(SWH, 'makestub.pl');
const DOCS_PLUGINS = join(ROOT, 'docs', 'plugins');

const manifest = JSON.parse(readFileSync(join(PLUGINS, 'manifest.json'), 'utf8'));

// --- CLI args ---
const args         = process.argv.slice(2);
const onlyId       = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const skipExisting = args.includes('--skip-existing');

// ---

function run(cmd, opts = {}) {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts });
}

function copyIfMissing(src, dest) {
    if (!existsSync(dest)) writeFileSync(dest, readFileSync(src));
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

// Resolve LADSPA default hint strings to numeric values.
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

// Read the generated dist/index.js and build a catalog entry.
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
        category:      manifestEntry.category ?? 'Uncategorized',
        wasmFile,
        processorFile: 'processor.js',
        ports: meta.ports.map(p => {
            if (p.type !== 'control') return p;
            return { ...p, default: resolveDefault(p.default, p.min, p.max) };
        }),
    };
}

// Copy dist/ to docs/plugins/<id>/ and update catalog list.
function deploy(manifestEntry, distDir, catalogEntries) {
    const entry = buildCatalogueEntry(manifestEntry, distDir);
    if (!entry) {
        console.warn(`   ⚠ Could not read meta from ${distDir}/index.js — skipping catalog`);
        return;
    }
    catalogEntries.push(entry);

    if (!existsSync(DOCS_PLUGINS)) return;
    const dest = join(DOCS_PLUGINS, manifestEntry.id);
    rmSync(dest, { recursive: true, force: true });
    copyDirContents(distDir, dest);
}

// ---

let passed = 0, failed = 0, skipped = 0;
const catalogEntries = [];

for (const entry of manifest) {
    if (onlyId && entry.id !== onlyId) continue;

    const dir     = join(PLUGINS, entry.id);
    const distDir = join(dir, 'dist');

    if (skipExisting && existsSync(distDir)) {
        console.log(`⏭  ${entry.id} — skipping (dist/ exists)`);
        deploy(entry, distDir, catalogEntries);
        skipped++;
        continue;
    }

    console.log(`\n▶  ${entry.id} (${entry.npmName})`);

    try {
        // 1. Create plugin dir
        mkdirSync(dir, { recursive: true });
        if (entry.util?.length) mkdirSync(join(dir, 'util'), { recursive: true });

        // 2. Generate C from XML
        const xml = join(SWH, entry.xml);
        if (!existsSync(xml)) throw new Error(`XML not found: ${xml}`);
        const cSrc = run(`perl "${MAKESTUB}" "${xml}"`);
        const cFile = join(dir, `${entry.id}.c`);
        writeFileSync(cFile, cSrc);

        // 3. Copy shared base headers
        copyIfMissing(join(SHARED, 'ladspa.h'),      join(dir, 'ladspa.h'));
        copyIfMissing(join(SHARED, 'ladspa-util.h'), join(dir, 'ladspa-util.h'));
        copyIfMissing(join(SHARED, 'config.h'),      join(dir, 'config.h'));

        // 4. Copy util headers
        for (const h of entry.util ?? []) {
            copyIfMissing(join(SHARED, 'util', h), join(dir, 'util', h));
        }

        // 5. Copy util .c sources
        for (const s of entry.utilSrc ?? []) {
            copyIfMissing(join(SHARED, 'util', s), join(dir, 'util', s));
        }

        // 5b. Copy extra subdirectories (e.g. gverb/)
        for (const d of entry.extraDirs ?? []) {
            const srcD  = join(SHARED, d);
            const destD = join(dir, d);
            mkdirSync(destD, { recursive: true });
            run(`cp -rn "${srcD}/." "${destD}/"`);
        }

        // 6. Build
        const extraSources = [
            ...(entry.utilSrc ?? []).map(s => `util/${s}`),
            ...(entry.extraDirs ?? []).flatMap(d =>
                readdirSync(join(dir, d))
                    .filter(f => f.endsWith('.c') && !f.includes('test'))
                    .map(f => `${d}/${f}`)
            ),
        ].join(',');
        const sourcesFlag = extraSources ? `--sources ${entry.id}.c,${extraSources}` : '';
        const nameFlag    = `--name ${entry.npmName}`;

        const cmd = `wadspa build "${dir}" --include "${dir}" ${sourcesFlag} ${nameFlag}`.trim();
        const out = run(cmd, { cwd: dir });
        console.log(out.trim().split('\n').map(l => '   ' + l).join('\n'));

        deploy(entry, distDir, catalogEntries);
        passed++;

    } catch (e) {
        console.error(`   ✗ FAILED: ${e.message.split('\n')[0]}`);
        failed++;
    }
}

// Write catalog
if (catalogEntries.length > 0 && existsSync(DOCS_PLUGINS)) {
    writeFileSync(
        join(DOCS_PLUGINS, 'catalog.json'),
        JSON.stringify(catalogEntries, null, 2)
    );
    console.log(`\nCatalogue: ${catalogEntries.length} plugins → docs/plugins/catalog.json`);
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`✓ ${passed} built   ✗ ${failed} failed   ⏭ ${skipped} skipped`);
if (failed > 0) process.exit(1);
