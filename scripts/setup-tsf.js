#!/usr/bin/env node
/**
 * Setup script for the tsf (TinySoundFont) plugin.
 *
 * Downloads tsf.h from the TinySoundFont GitHub repo and places it
 * alongside tsf_plugin.c in plugins/tsf/.
 *
 * tsf.h is the only external dependency — it is a single-header MIT-licensed
 * library with no further dependencies.
 *
 * Usage:
 *   node scripts/setup-tsf.js
 */

import { createWriteStream, existsSync } from 'fs';
import { join, dirname }                 from 'path';
import { fileURLToPath }                 from 'url';
import { get }                           from 'https';

const ROOT   = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT    = join(ROOT, 'plugins', 'tsf', 'tsf.h');
const TSF_URL = 'https://raw.githubusercontent.com/schellingb/TinySoundFont/master/tsf.h';

if (existsSync(OUT)) {
    console.log('✓ tsf.h already present — skipping download');
    process.exit(0);
}

console.log(`→ Downloading tsf.h from GitHub…`);

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(dest);
        get(url, res => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                file.close();
                download(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                file.close();
                reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
                return;
            }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', err => { file.close(); reject(err); });
    });
}

try {
    await download(TSF_URL, OUT);
    console.log(`✓ tsf.h written to ${OUT}`);
} catch (e) {
    console.error(`✗ Failed to download tsf.h: ${e.message}`);
    process.exit(1);
}
