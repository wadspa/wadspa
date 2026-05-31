#!/usr/bin/env node
/**
 * Run all plugin setup scripts in sequence.
 *
 * Each setup script prepares a plugin directory (copies sources, generates
 * stubs/wrappers, and optionally updates lv2.json). They are idempotent —
 * re-running overwrites any previously generated files.
 *
 * Usage:
 *   node scripts/setup-all.js [--only <id>]
 */

import { spawnSync }    from 'child_process';
import { existsSync }   from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync }  from 'fs';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const sources = JSON.parse(readFileSync(join(ROOT, 'sources.json'), 'utf8'));

const args   = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const SETUPS = {
    'mda-lv2':   'setup-mda-lv2.js',
    'amsynth':   'setup-amsynth.js',
    'synthv1':   'setup-synthv1.js',
    'drumkv1':   'setup-drumkv1.js',
};

let ran = 0, skipped = 0, failed = 0;

for (const src of sources) {
    if (onlyId && src.id !== onlyId) continue;

    const scriptName = SETUPS[src.id];
    if (!scriptName) {
        if (!onlyId) { skipped++; }
        continue;
    }

    const scriptPath = join(ROOT, 'scripts', scriptName);
    if (!existsSync(scriptPath)) {
        console.log(`⏭  ${src.id} — setup script not yet written (${scriptName})`);
        skipped++;
        continue;
    }

    // Check the source repo is present before running its setup
    const repoDir = src.git ? join(ROOT, src.id) : null;
    if (repoDir && !existsSync(repoDir)) {
        console.log(`⏭  ${src.id} — source not cloned (run fetch-sources.js first)`);
        skipped++;
        continue;
    }

    console.log(`\n── ${src.id} ${'─'.repeat(Math.max(0, 46 - src.id.length))}`);
    const result = spawnSync(process.execPath, [scriptPath], {
        cwd: ROOT,
        stdio: 'inherit',
    });

    if (result.status === 0) {
        ran++;
    } else {
        console.error(`   ✗ Setup failed for ${src.id}`);
        failed++;
    }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`✓ ${ran} ran   ⏭ ${skipped} skipped   ✗ ${failed} failed`);
if (failed > 0) process.exit(1);
