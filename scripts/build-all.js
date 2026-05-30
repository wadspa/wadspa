#!/usr/bin/env node
/**
 * Build all plugins listed in plugins/manifest.json.
 *
 * Usage:
 *   node scripts/build-all.js [--only <id>] [--skip-existing]
 *
 * Requirements:
 *   - emcc on PATH (or EMCC env var)
 *   - perl on PATH (for swh-plugins/makestub.pl)
 *   - wadspa on PATH (npm link from toolchain/)
 */

import { execSync }                                          from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname }                                     from 'path';
import { fileURLToPath }                                     from 'url';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const SWH     = join(ROOT, 'swh-plugins');
const PLUGINS = join(ROOT, 'plugins');
const SHARED  = join(PLUGINS, 'shared');
const MAKESTUB = join(SWH, 'makestub.pl');

const manifest = JSON.parse(readFileSync(join(PLUGINS, 'manifest.json'), 'utf8'));

// --- CLI args ---
const args        = process.argv.slice(2);
const onlyId      = args.includes('--only')          ? args[args.indexOf('--only') + 1]     : null;
const skipExisting = args.includes('--skip-existing');

// ---

function run(cmd, opts = {}) {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts });
}

function copyIfMissing(src, dest) {
    if (!existsSync(dest)) copyFileSync(src, dest);
}

let passed = 0, failed = 0, skipped = 0;

for (const entry of manifest) {
    if (onlyId && entry.id !== onlyId) continue;

    const dir    = join(PLUGINS, entry.id);
    const distDir = join(dir, 'dist');

    if (skipExisting && existsSync(distDir)) {
        console.log(`⏭  ${entry.id} — skipping (dist/ exists)`);
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

        // 3. Copy shared base headers (always needed)
        copyIfMissing(join(SHARED, 'ladspa.h'),      join(dir, 'ladspa.h'));
        copyIfMissing(join(SHARED, 'ladspa-util.h'), join(dir, 'ladspa-util.h'));
        copyIfMissing(join(SHARED, 'config.h'),      join(dir, 'config.h'));

        // 4. Copy util headers
        for (const h of entry.util ?? []) {
            copyIfMissing(join(SHARED, 'util', h), join(dir, 'util', h));
        }

        // 5. Copy util .c sources (will be added to sources list)
        for (const s of entry.utilSrc ?? []) {
            copyIfMissing(join(SHARED, 'util', s), join(dir, 'util', s));
        }

        // 5b. Copy extra subdirectories (e.g. gverb/) from plugins/shared/
        for (const d of entry.extraDirs ?? []) {
            const srcD  = join(SHARED, d);
            const destD = join(dir, d);
            mkdirSync(destD, { recursive: true });
            run(`cp -rn "${srcD}/." "${destD}/"`);
        }

        // 6. Build — collect all extra C sources (util/ + extraDir/ *.c files)
        const extraSources = [
            ...(entry.utilSrc ?? []).map(s => `util/${s}`),
            ...(entry.extraDirs ?? []).flatMap(d =>
                readdirSync(join(dir, d))
                    .filter(f => f.endsWith('.c') && !f.includes('test'))
                    .map(f => `${d}/${f}`)
            ),
        ].join(',');
        const sourcesFlag  = extraSources ? `--sources ${entry.id}.c,${extraSources}` : '';
        const nameFlag     = `--name ${entry.npmName}`;

        const cmd = `wadspa build "${dir}" --include "${dir}" ${sourcesFlag} ${nameFlag}`.trim();
        const out  = run(cmd, { cwd: dir });
        console.log(out.trim().split('\n').map(l => '   ' + l).join('\n'));
        passed++;

    } catch (e) {
        console.error(`   ✗ FAILED: ${e.message.split('\n')[0]}`);
        failed++;
    }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`✓ ${passed} built   ✗ ${failed} failed   ⏭ ${skipped} skipped`);
if (failed > 0) process.exit(1);
