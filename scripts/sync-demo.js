#!/usr/bin/env node
/**
 * Sync the GitHub Pages test page into demo/ for local development servers.
 *
 * The single browser test page lives in docs/index.html. demo/ mirrors it so a
 * plain `cd demo && python3 -m http.server ...` server exercises the same UI.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const DEMO = join(ROOT, 'demo');

function copy(src, dest) {
    const stat = statSync(src);
    if (stat.isDirectory()) {
        mkdirSync(dest, { recursive: true });
        for (const entry of readdirSync(src)) {
            copy(join(src, entry), join(dest, entry));
        }
        return;
    }
    writeFileSync(dest, readFileSync(src));
}

mkdirSync(DEMO, { recursive: true });
rmSync(join(DEMO, 'plugins'), { recursive: true, force: true });
mkdirSync(join(DEMO, 'plugins'), { recursive: true });

copy(join(DOCS, 'index.html'),       join(DEMO, 'index.html'));
copy(join(DOCS, 'index.html'),       join(DEMO, 'synth.html'));
copy(join(DOCS, 'core.js'),          join(DEMO, 'core.js'));
copy(join(DOCS, 'instruments.json'), join(DEMO, 'instruments.json'));

const coi = join(DOCS, 'coi-serviceworker.js');
if (existsSync(coi)) copy(coi, join(DEMO, 'coi-serviceworker.js'));

copy(join(DOCS, 'plugins'), join(DEMO, 'plugins'));

console.log('demo/ synced from docs/');
