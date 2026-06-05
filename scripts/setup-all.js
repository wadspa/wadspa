#!/usr/bin/env node
/**
 * Run all plugin setup scripts in sequence.
 *
 * Each setup script prepares a plugin directory (copies sources, generates
 * stubs/wrappers, and optionally updates lv2.json). They are idempotent —
 * re-running overwrites any previously generated files.
 *
 * Usage:
 *   node scripts/setup-all.js [--only <source-or-target-id>]
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
    'tap-lv2':           'setup-tap-lv2.js',
    'zam-plugins':       'setup-zam-plugins.js',
};

let ran = 0, skipped = 0, failed = 0;

for (const src of sources) {
    const jobs = setupJobsForSource(src);
    if (jobs.length === 0) continue;

    const repoDir = src.git ? join(ROOT, src.id) : null;
    if (repoDir && !existsSync(repoDir)) {
        for (const job of jobs) {
            console.log(`⏭  ${job.id} — source ${src.id} not cloned (run fetch-sources.js first)`);
            skipped++;
        }
        continue;
    }

    for (const job of jobs) {
        if (job.manualReason) {
            console.log(`⏭  ${job.id} — ${job.manualReason}`);
            skipped++;
            continue;
        }

        console.log(`\n── ${job.id} ${'─'.repeat(Math.max(0, 46 - job.id.length))}`);
        if (job.note) console.log(`   ${job.note}`);
        const result = spawnSync(process.execPath, [job.runScript, ...job.runArgs], {
            cwd: ROOT,
            stdio: 'inherit',
        });

        if (result.status === 0) {
            ran++;
        } else {
            console.error(`   ✗ Setup failed for ${job.id}`);
            failed++;
        }
    }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`✓ ${ran} ran   ⏭ ${skipped} skipped   ✗ ${failed} failed`);
if (failed > 0) process.exit(1);

function setupJobsForSource(src) {
    const jobs = [];
    const sourceMatches = matchesOnly(src);
    const sourceScript = dedicatedScriptFor(src.id, src.setup);

    if (sourceMatches && shouldRunSourceJob(src, sourceScript)) {
        jobs.push(resolveJob({
            id: src.id,
            sourceId: src.id,
            repoDir: src.git ? join(ROOT, src.id) : null,
            scriptName: sourceScript,
            autoSetup: src.autoSetup,
        }));
    }

    for (const target of src.targets ?? []) {
        if (onlyId && onlyId !== src.id && onlyId !== target.id) continue;
        jobs.push(resolveJob({
            id: target.id,
            sourceId: src.id,
            repoDir: src.git ? join(ROOT, src.id) : null,
            scriptName: dedicatedScriptFor(target.id, target.setup),
            autoSetup: target.autoSetup,
            bundle: target.bundle,
        }));
    }

    return jobs;
}

function shouldRunSourceJob(src, sourceScript) {
    if (!sourceScript && (src.targets ?? []).length > 0) return false;
    if (!onlyId || onlyId === src.id) return true;
    return false;
}

function matchesOnly(src) {
    if (!onlyId) return true;
    return onlyId === src.id || (src.targets ?? []).some(target => target.id === onlyId);
}

function dedicatedScriptFor(id, setup) {
    if (SETUPS[id]) return SETUPS[id];
    if (!setup) return null;
    return setup.endsWith('.js') ? setup : `${setup}.js`;
}

function resolveJob({ id, sourceId, repoDir, scriptName, autoSetup, bundle }) {
    const scriptPath = scriptName ? join(ROOT, 'scripts', scriptName) : null;
    if (scriptPath && existsSync(scriptPath)) {
        return {
            id,
            runScript: scriptPath,
            runArgs: [],
        };
    }

    const autoSetupPath = join(ROOT, 'scripts', 'auto-setup.js');
    if (autoSetup === false) {
        return {
            id,
            manualReason: `manual setup required for source ${sourceId}`,
        };
    }
    if (repoDir && existsSync(repoDir) && existsSync(autoSetupPath)) {
        return {
            id,
            runScript: autoSetupPath,
            runArgs: [
                repoDir,
                '--id', id,
                ...(bundle ? ['--bundle', bundle] : []),
            ],
            note: 'no dedicated setup script - using auto-setup.js',
        };
    }

    return {
        id,
        manualReason: 'no setup script and auto-setup unavailable',
    };
}
