#!/usr/bin/env node
/**
 * Setup script for the Infamous Cellular Automaton Synth.
 *
 * The upstream plugin is already a compact LV2 C instrument. This setup copies
 * the DSP sources and TTL metadata into a browser-buildable plugin directory,
 * trimming the desktop-only UI manifest entry.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, 'infamous-plugins');
const SRC = join(REPO, 'src', 'casynth');
const OUT = join(ROOT, 'plugins', 'casynth');

if (!existsSync(SRC)) {
    console.error(`Source not found: ${SRC} - run fetch-sources.js first`);
    process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const files = [
    'casynth.c',
    'casynth.h',
    'cellgrid.h',
    'constants.h',
    'note.c',
    'note.h',
    'waves.c',
    'waves.h',
    'casynth.ttl',
    'casynth_presets.ttl',
];

for (const file of files) {
    copyFileSync(join(SRC, file), join(OUT, file));
}

writeFileSync(
    join(OUT, 'waves.c'),
    readFileSync(join(OUT, 'waves.c'), 'utf8')
        .replace('srand ((uint16_t) time (NULL));', 'srand(1);')
);

writeFileSync(join(OUT, 'manifest.ttl'), manifestSource());
registerPlugin();

console.log('Infamous Cellular Automaton Synth setup complete');
console.log('Run: node scripts/build-instruments.js --only casynth');

function manifestSource() {
    return `@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<http://ssj71.github.io/infamousPlugins/plugs.html#casynth>
    a lv2:Plugin, lv2:InstrumentPlugin ;
    lv2:binary <casynth.so> ;
    rdfs:seeAlso <casynth.ttl> .
`;
}

function registerPlugin() {
    const registry = readLv2Registry(ROOT).filter(entry => entry.id !== 'casynth');
    registry.push({
        id: 'casynth',
        description: 'Infamous Cellular Automaton Synth - additive synth controlled by an elementary cellular automaton',
        category: 'Instruments',
        sources: [
            'casynth.c',
            'note.c',
            'waves.c',
        ],
        includes: [
            'plugins/casynth',
        ],
    });
    writeLv2Registry(ROOT, registry);
}
