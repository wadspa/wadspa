#!/usr/bin/env node
/**
 * Setup script for sorcer — wavetable synthesiser LV2.
 *
 * sorcer is a Faust-generated C++ synth with two dependencies:
 *   - boost/circular_buffer.hpp  → stubbed by toolchain/boost/circular_buffer.hpp
 *   - wavetable .h files         → copied from sorcer/wavetables/
 *
 * The SSE AVOIDDENORMALS block in main.cpp is guarded by __SSE__; wasm32 skips it.
 * jboverdrive.c / standalone files are excluded (no JACK in WASM).
 */

import { copyFileSync, mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, 'sorcer');
const OUT  = join(ROOT, 'plugins', 'sorcer');

if (!existsSync(REPO)) {
    console.error(`Source not found: ${REPO} — run fetch-sources.js first`);
    process.exit(1);
}

mkdirSync(OUT, { recursive: true });

// ── 1. Copy manifest + TTL ────────────────────────────────────────────────────
const LV2 = join(REPO, 'sorcer.lv2');
copyFileSync(join(LV2, 'sorcer.ttl'),    join(OUT, 'sorcer.ttl'));

// Generate manifest with .wasm binary reference
writeFileSync(join(OUT, 'manifest.ttl'), `\
@prefix doap: <http://usefulinc.com/ns/doap#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<http://www.openavproductions.com/sorcer>
    a lv2:Plugin ;
    lv2:binary <sorcer.wasm> ;
    rdfs:seeAlso <sorcer.ttl> .
`);

// ── 2. Copy main DSP source ───────────────────────────────────────────────────
copyFileSync(join(REPO, 'faust', 'main.cpp'),          join(OUT, 'main.cpp'));
copyFileSync(join(REPO, 'faust', 'helpers.h'),         join(OUT, 'helpers.h'));
copyFileSync(join(REPO, 'faust', 'wavetableReader.h'), join(OUT, 'wavetableReader.h'));

// ── 3. Copy wavetable headers into wavetables/ subdir ────────────────────────
// wavetableReader.h uses '../wavetables/...' paths relative to faust/.
// Since we flattened to a single dir, patch wavetableReader.h to use 'wavetables/...'
// and put the wavetable .h files in plugins/sorcer/wavetables/.
const WAVETABLES = join(REPO, 'wavetables');
mkdirSync(join(OUT, 'wavetables'), { recursive: true });
for (const f of readdirSync(WAVETABLES)) {
    if (/\.h$/i.test(f)) copyFileSync(join(WAVETABLES, f), join(OUT, 'wavetables', f));
}
// Patch wavetableReader.h to use 'wavetables/' instead of '../wavetables/'
const wtReader = readFileSync(join(OUT, 'wavetableReader.h'), 'utf8')
    .replace(/\.\.\/wavetables\//g, 'wavetables/');
writeFileSync(join(OUT, 'wavetableReader.h'), wtReader);

// ── 4. Update lv2.json ────────────────────────────────────────────────────────
const lv2JsonPath = join(ROOT, 'plugins', 'lv2.json');
const registry = JSON.parse(readFileSync(lv2JsonPath, 'utf8'));

const entry = {
    id: 'sorcer',
    description: 'Sorcer — wavetable synthesiser LV2',
    category: 'Instruments',
    includes: ['toolchain'],
    sources: ['main.cpp'],
};

const existing = registry.findIndex(e => e.id === 'sorcer');
if (existing >= 0) registry[existing] = entry;
else registry.push(entry);
writeFileSync(lv2JsonPath, `${JSON.stringify(registry, null, 2)}\n`);

console.log('✓ sorcer setup complete');
console.log('  Run: node scripts/build-instruments.js --only sorcer');
