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
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync }  from 'fs';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const sources = JSON.parse(readFileSync(join(ROOT, 'sources.json'), 'utf8'));

const args   = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const SETUPS = {
    'mda-lv2':      'setup-mda-lv2.js',
    'amsynth':      'setup-amsynth.js',
    'synthv1':      'setup-synthv1.js',
    'drumkv1':      'setup-drumkv1.js',
    'So-synth-LV2': 'setup-so-synth.js',
    'padthv1':      'setup-padthv1.js',
    'samplv1':      'setup-samplv1.js',
    'fomp':         'setup-fomp.js',
    'sorcer':       'setup-sorcer.js',
    'setBfree':          'setup-setBfree.js',
    'noise-repellent':   'setup-noise-repellent.js',
};

let ran = 0, skipped = 0, failed = 0;

for (const src of sources) {
    if (onlyId && src.id !== onlyId) continue;

    const scriptName = SETUPS[src.id] || null;

    // Check the source repo is present before running its setup
    const repoDir = src.git ? join(ROOT, src.id) : null;
    if (repoDir && !existsSync(repoDir)) {
        console.log(`⏭  ${src.id} — source not cloned (run fetch-sources.js first)`);
        skipped++;
        continue;
    }

    const scriptPath = scriptName ? join(ROOT, 'scripts', scriptName) : null;
    const autoSetupPath = join(ROOT, 'scripts', 'auto-setup.js');

    // Use dedicated script if it exists, otherwise fall back to auto-setup.js
    let runScript, runArgs;
    if (scriptPath && existsSync(scriptPath)) {
        runScript = scriptPath;
        runArgs   = [];
    } else if (repoDir && existsSync(repoDir) && existsSync(autoSetupPath)) {
        console.log(`   (no setup script — using auto-setup.js)`);
        runScript = autoSetupPath;
        runArgs   = [repoDir, '--id', src.id];
    } else {
        console.log(`⏭  ${src.id} — no setup script and auto-setup unavailable`);
        skipped++;
        continue;
    }

    console.log(`\n── ${src.id} ${'─'.repeat(Math.max(0, 46 - src.id.length))}`);
    const result = spawnSync(process.execPath, [runScript, ...runArgs], {
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
