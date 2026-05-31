#!/usr/bin/env node
/**
 * Setup script for So-synth-LV2 plugins.
 *
 * Builds three separate WASM-ready plugin directories from the So-synth-LV2
 * source repo (so-404, so-kl5, so-666). Each gets its own directory under
 * plugins/ with:
 *   - the plugin's .c/.h source files
 *   - the plugin's .ttl metadata
 *   - a generated manifest.ttl referencing just that plugin
 *   - a generated lv2_entry.c that exports lv2_descriptor(0) for that plugin
 *
 * So-synth uses the pre-atom LV2 event port API (~2008-2013). The shim
 * generator handles this via the legacy MIDI path in shim-lv2.js.
 */

import { copyFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname }                           from 'path';
import { fileURLToPath }                           from 'url';

const ROOT   = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC    = join(ROOT, 'So-synth-LV2');
const PLUGINS = join(ROOT, 'plugins');

// Each entry: { id, uri, header, descriptor, c, h, ttl, desc }
const PLUGINS_DEF = [
    {
        id:         'so-404',
        uri:        'urn:50m30n3:plugins:SO-404',
        c:          'so-404.c',
        h:          'so-404.h',
        ttl:        'so-404.ttl',
        descriptor: 'so_404_Descriptor',
        desc:       'SO-404 Bass Synthesizer — TB-303-style bass synth clone',
    },
    {
        id:         'so-kl5',
        uri:        'urn:50m30n3:plugins:SO-kl5',
        c:          'so-kl5.c',
        h:          'so-kl5.h',
        ttl:        'so-kl5.ttl',
        descriptor: 'so_kl5_Descriptor',
        desc:       'SO-kl5 Piano Synthesizer — electric piano clone',
    },
    {
        id:         'so-666',
        uri:        'urn:50m30n3:plugins:SO-666',
        c:          'so-666.c',
        h:          'so-666.h',
        ttl:        'so-666.ttl',
        descriptor: 'so_666_Descriptor',
        desc:       'SO-666 Feedback Synthesizer — feedback synth',
    },
];

for (const p of PLUGINS_DEF) {
    const outDir = join(PLUGINS, p.id);
    mkdirSync(outDir, { recursive: true });

    // Copy source and header
    copyFileSync(join(SRC, p.c), join(outDir, p.c));
    copyFileSync(join(SRC, p.h), join(outDir, p.h));
    copyFileSync(join(SRC, p.ttl), join(outDir, p.ttl));

    // Generate manifest.ttl for this plugin only
    writeFileSync(join(outDir, 'manifest.ttl'), `\
@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<${p.uri}> a lv2:Plugin ;
  lv2:binary   <${p.id}.so> ;
  rdfs:seeAlso <${p.ttl}> .
`);

    // Generate lv2_entry.c — exports lv2_descriptor(0) for just this plugin.
    // The descriptor is defined static in the plugin's .h; the function
    // implementations are in the plugin's .c. Both TUs are linked together.
    writeFileSync(join(outDir, 'lv2_entry.c'), `\
/* wadspa: expose ${p.id} as lv2_descriptor(0) */
#include "${p.h}"

LV2_SYMBOL_EXPORT const LV2_Descriptor *lv2_descriptor(uint32_t index) {
    return (index == 0) ? &${p.descriptor} : NULL;
}
`);

    console.log(`✓  ${p.id} — ${outDir}`);
}

console.log('\nSo-synth-LV2 setup complete.');
