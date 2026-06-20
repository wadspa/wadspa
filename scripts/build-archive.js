#!/usr/bin/env node
/**
 * Build the full wadspa browser archive.
 *
 * Pipeline:
 *   1. fetch-sources   — clone / update all external repos listed in sources.json
 *   2. setup-all       — copy sources and generate stubs for each plugin collection
 *   3. build-all       — compile LADSPA/SWH effects
 *   4. build-instruments — compile LV2 instruments and effects
 *   5. build-ui-hints  — derive browser UI hints from native LV2 UI metadata
 *   6. sync-demo       — sync built assets to the local demo directory
 *
 * Usage:
 *   node scripts/build-archive.js [options]
 *
 * Options:
 *   --skip-fetch      Skip step 1 (assume repos are already cloned)
 *   --skip-setup      Skip step 2 (assume plugin dirs are already set up)
 *   --skip-existing   Skip plugins whose dist/ already exists (incremental build)
 */

import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const skipFetch    = args.includes('--skip-fetch');
const skipSetup    = args.includes('--skip-setup');
const skipExisting = args.includes('--skip-existing');

function run(label, command, commandArgs) {
    console.log(`\n── ${label} ${'─'.repeat(Math.max(0, 46 - label.length))}`);
    const proc = spawnSync(command, commandArgs, {
        cwd: ROOT,
        stdio: 'inherit',
        shell: false,
    });
    if (proc.status !== 0) process.exit(proc.status ?? 1);
}

const maybeSkip     = skipExisting ? ['--skip-existing'] : [];
const maybeNoUpdate = skipFetch    ? ['--no-update']     : [];

if (!skipFetch)
    run('1/5  fetch sources', process.execPath, ['scripts/fetch-sources.js', ...maybeNoUpdate]);

if (!skipSetup)
    run('2/5  setup plugins', process.execPath, ['scripts/setup-all.js']);

run('3/5  LADSPA effects',   process.execPath, ['scripts/build-all.js',         ...maybeSkip]);
run('4/5  LV2 plugins',      process.execPath, ['scripts/build-instruments.js', ...maybeSkip]);
run('5/6  UI hints',         process.execPath, ['scripts/build-ui-hints.js']);
run('6/6  sync demo',        process.execPath, ['scripts/sync-demo.js']);

console.log('\nArchive build complete.');
