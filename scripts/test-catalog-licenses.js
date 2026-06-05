#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOGS = [
    'docs/instruments.json',
    'docs/plugins/catalog.json',
];

let failed = false;

for (const file of CATALOGS) {
    const entries = JSON.parse(readFileSync(join(ROOT, file), 'utf8'));
    const missing = entries.filter(entry => !entry.license).map(entry => entry.id);
    if (missing.length > 0) {
        failed = true;
        console.error(`${file}: missing license metadata for ${missing.length} entries`);
        for (const id of missing) console.error(`  - ${id}`);
    } else {
        console.log(`${file}: ${entries.length} entries include license metadata`);
    }
}

const indexHtml = readFileSync(join(ROOT, 'docs/index.html'), 'utf8');
for (const token of ['license-badge', 'setPluginMenuItemContent']) {
    if (!indexHtml.includes(token)) {
        failed = true;
        console.error(`docs/index.html: missing ${token}`);
    }
}

if (failed) process.exit(1);
