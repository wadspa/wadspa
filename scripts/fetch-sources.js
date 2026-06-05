#!/usr/bin/env node
/**
 * Clone or update all external source repositories listed in sources.json.
 *
 * Usage:
 *   node scripts/fetch-sources.js [--only <source-or-target-id>] [--no-update]
 *
 * --only <id>    Only fetch the source with this id, or the source that owns
 *                a target with this id
 * --no-update    Skip git pull on repos that already exist (clone-only)
 */

import { execSync }    from 'child_process';
import { existsSync }  from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync }  from 'fs';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const sources = JSON.parse(readFileSync(join(ROOT, 'sources.json'), 'utf8'));

const args     = process.argv.slice(2);
const onlyId   = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const noUpdate = args.includes('--no-update');

function run(cmd, opts = {}) {
    return execSync(cmd, { encoding: 'utf8', stdio: 'inherit', ...opts });
}

let cloned = 0, updated = 0, skipped = 0, failed = 0;

for (const src of sources) {
    if (!matchesOnly(src)) continue;
    if (!src.git) { skipped++; continue; }

    const destDir = join(ROOT, src.id);
    const targetNote = onlyId && onlyId !== src.id ? ` for ${onlyId}` : '';
    process.stdout.write(`▶  ${src.id}${targetNote}  `);

    try {
        if (!existsSync(destDir)) {
            console.log('(cloning…)');
            run(`git clone --depth 1 "${src.git}" "${destDir}"`);
            cloned++;
        } else if (noUpdate) {
            console.log('(exists — skipped)');
            skipped++;
        } else {
            console.log('(updating…)');
            run('git pull --ff-only', { cwd: destDir });
            updated++;
        }
    } catch (e) {
        console.error(`   ✗ FAILED: ${e.message.split('\n')[0]}`);
        failed++;
    }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`↓ ${cloned} cloned   ↑ ${updated} updated   ⏭ ${skipped} skipped   ✗ ${failed} failed`);
if (failed > 0) process.exit(1);

function matchesOnly(src) {
    if (!onlyId) return true;
    return src.id === onlyId || (src.targets ?? []).some(target => target.id === onlyId);
}
