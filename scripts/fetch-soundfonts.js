#!/usr/bin/env node
/**
 * Download default bundled soundfonts into docs/soundfonts/.
 * Also writes docs/soundfonts/catalog.json so the demo UI knows what's available.
 *
 * Usage:
 *   node scripts/fetch-soundfonts.js
 */

import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { get } from 'https';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT  = join(ROOT, 'docs', 'soundfonts');

mkdirSync(OUT, { recursive: true });

const SOUNDFONTS = [
    {
        id:      'timgm6mb',
        name:    'TimGM6mb',
        file:    'TimGM6mb.sf2',
        size_mb: 5.8,
        license: 'GPL v2',
        url:     'https://raw.githubusercontent.com/musescore/MuseScore/3.x/share/sound/TimGM6mb.sf2',
    },
];

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(dest);
        function attempt(u) {
            get(u, res => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    file.close(() => { createWriteStream(dest); attempt(res.headers.location); });
                    return;
                }
                if (res.statusCode !== 200) {
                    file.close();
                    reject(new Error(`HTTP ${res.statusCode} for ${u}`));
                    return;
                }
                res.pipe(file);
                file.on('finish', () => file.close(resolve));
            }).on('error', err => { file.close(); reject(err); });
        }
        attempt(url);
    });
}

let downloaded = 0;
for (const sf of SOUNDFONTS) {
    const dest = join(OUT, sf.file);
    if (existsSync(dest)) {
        console.log(`✓ ${sf.file} already present — skipping`);
        downloaded++;
        continue;
    }
    process.stdout.write(`→ Downloading ${sf.name} (${sf.size_mb} MB)… `);
    try {
        await download(sf.url, dest);
        console.log('done');
        downloaded++;
    } catch (e) {
        console.error(`\n✗ Failed: ${e.message}`);
        console.error(`  You can download ${sf.name} manually from:`);
        console.error(`  https://musescore.org/en/handbook/3/soundfonts-and-sfz-files`);
        console.error(`  and place it at docs/soundfonts/${sf.file}`);
    }
}

// Write catalog so the demo UI can discover available soundfonts.
const catalog = SOUNDFONTS.map(({ id, name, file, size_mb, license }) =>
    ({ id, name, file, size_mb, license })
);
writeFileSync(join(OUT, 'catalog.json'), JSON.stringify(catalog, null, 2));
console.log(`→ catalog.json written (${catalog.length} entries)`);
