#!/usr/bin/env node
/**
 * Setup script for fomp — port of Fons Adriaensen's LV2 plugins.
 *
 * fomp builds each plugin as a separate shared library. We mirror that structure
 * by creating one plugin dir per sub-binary (fomp-autowah, fomp-blvco, etc.).
 * The *_if.cc LADSPA bridge files are not needed for LV2 builds (not in wscript).
 */

import { copyFileSync, mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, 'fomp');
const SRC  = join(REPO, 'src');
const LV2  = join(REPO, 'fomp.lv2');

if (!existsSync(REPO)) {
    console.error(`Source not found: ${REPO} — run fetch-sources.js first`);
    process.exit(1);
}

// fomp prefix header shared by all manifests
const MANIFEST_PREFIX = `\
@prefix doap: <http://usefulinc.com/ns/doap#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix fomp: <http://drobilla.net/plugins/fomp/> .
@prefix lv2: <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
`;

// Each sub-plugin: sources from src/, TTLs from fomp.lv2/
// Ordered so lv2_descriptor(0) matches the first TTL entry (first plugin exposed in WASM).
const SUBPLUGINS = [
    {
        id: 'fomp-autowah',
        sources: ['autowah.cc', 'autowah_lv2.cc'],
        description: 'fomp: Autowah (LV2)',
        category: 'Effects',
        manifest: [
            'fomp:autowah a lv2:Plugin ; rdfs:seeAlso <autowah.ttl> ; lv2:binary <autowah.wasm> .',
        ],
        ttls: ['autowah.ttl'],
    },
    {
        id: 'fomp-blvco',
        sources: ['blvco.cc', 'blvco_lv2.cc'],
        description: 'fomp: Band-limited VCOs (LV2)',
        category: 'Instruments',
        manifest: [
            'fomp:pulse_vco a lv2:Plugin ; rdfs:seeAlso <pulse_vco.ttl> ; lv2:binary <blvco.wasm> .',
            'fomp:saw_vco a lv2:Plugin ; rdfs:seeAlso <saw_vco.ttl> ; lv2:binary <blvco.wasm> .',
            'fomp:rec_vco a lv2:Plugin ; rdfs:seeAlso <rec_vco.ttl> ; lv2:binary <blvco.wasm> .',
        ],
        ttls: ['pulse_vco.ttl', 'saw_vco.ttl', 'rec_vco.ttl'],
    },
    {
        id: 'fomp-cs_chorus',
        sources: ['cs_chorus.cc', 'cs_chorus_lv2.cc'],
        description: 'fomp: CS Chorus (LV2)',
        category: 'Effects',
        manifest: [
            'fomp:cs_chorus1 a lv2:Plugin ; rdfs:seeAlso <cs_chorus1.ttl> ; lv2:binary <cs_chorus.wasm> .',
            'fomp:cs_chorus2 a lv2:Plugin ; rdfs:seeAlso <cs_chorus2.ttl> ; lv2:binary <cs_chorus.wasm> .',
            'fomp:triple_chorus a lv2:Plugin ; rdfs:seeAlso <triple_chorus.ttl> ; lv2:binary <cs_chorus.wasm> .',
        ],
        ttls: ['cs_chorus1.ttl', 'cs_chorus2.ttl', 'triple_chorus.ttl'],
    },
    {
        id: 'fomp-cs_phaser',
        sources: ['cs_phaser.cc', 'cs_phaser_lv2.cc'],
        description: 'fomp: CS Phaser (LV2)',
        category: 'Effects',
        manifest: [
            'fomp:cs_phaser1 a lv2:Plugin ; rdfs:seeAlso <cs_phaser1.ttl> ; lv2:binary <cs_phaser.wasm> .',
            'fomp:cs_phaser1_lfo a lv2:Plugin ; rdfs:seeAlso <cs_phaser1_lfo.ttl> ; lv2:binary <cs_phaser.wasm> .',
        ],
        ttls: ['cs_phaser1.ttl', 'cs_phaser1_lfo.ttl'],
    },
    {
        id: 'fomp-filters',
        sources: ['filters.cc', 'filters_lv2.cc'],
        description: 'fomp: Parametric EQ (LV2)',
        category: 'Effects',
        manifest: [
            'fomp:parametric1 a lv2:Plugin ; rdfs:seeAlso <parametric1.ttl> ; lv2:binary <filters.wasm> .',
        ],
        ttls: ['parametric1.ttl'],
    },
    {
        id: 'fomp-mvchpf24',
        sources: ['mvchpf24.cc', 'mvchpf24_lv2.cc'],
        description: 'fomp: Moog HPF (LV2)',
        category: 'Effects',
        manifest: [
            'fomp:mvchpf1 a lv2:Plugin ; rdfs:seeAlso <mvchpf1.ttl> ; lv2:binary <mvchpf24.wasm> .',
        ],
        ttls: ['mvchpf1.ttl'],
    },
    {
        id: 'fomp-mvclpf24',
        sources: ['mvclpf24.cc', 'mvclpf24_lv2.cc'],
        description: 'fomp: Moog LPF (LV2)',
        category: 'Effects',
        manifest: [
            'fomp:mvclpf1 a lv2:Plugin ; rdfs:seeAlso <mvclpf1.ttl> ; lv2:binary <mvclpf24.wasm> .',
            'fomp:mvclpf2 a lv2:Plugin ; rdfs:seeAlso <mvclpf2.ttl> ; lv2:binary <mvclpf24.wasm> .',
            'fomp:mvclpf3 a lv2:Plugin ; rdfs:seeAlso <mvclpf3.ttl> ; lv2:binary <mvclpf24.wasm> .',
            'fomp:mvclpf4 a lv2:Plugin ; rdfs:seeAlso <mvclpf4.ttl> ; lv2:binary <mvclpf24.wasm> .',
        ],
        ttls: ['mvclpf1.ttl', 'mvclpf2.ttl', 'mvclpf3.ttl', 'mvclpf4.ttl'],
    },
    {
        id: 'fomp-reverbs',
        sources: ['reverbs.cc', 'pareq.cc', 'zreverb.cc', 'reverbs_lv2.cc'],
        description: 'fomp: Reverb (LV2)',
        category: 'Effects',
        manifest: [
            'fomp:reverb a lv2:Plugin ; rdfs:seeAlso <reverb.ttl> ; lv2:binary <reverbs.wasm> .',
            'fomp:reverb_amb a lv2:Plugin ; rdfs:seeAlso <reverb_amb.ttl> ; lv2:binary <reverbs.wasm> .',
        ],
        ttls: ['reverb.ttl', 'reverb_amb.ttl'],
    },
];

// Shared headers copied to every sub-plugin dir
const SHARED_HEADERS = readdirSync(SRC).filter(f => /\.h$/i.test(f));

// Update lv2.json
const lv2JsonPath = join(ROOT, 'plugins', 'lv2.json');
const registry = JSON.parse(readFileSync(lv2JsonPath, 'utf8'));

// Remove old monolithic 'fomp' entry if present
const oldIdx = registry.findIndex(e => e.id === 'fomp');
if (oldIdx >= 0) registry.splice(oldIdx, 1);

let built = 0;
for (const sp of SUBPLUGINS) {
    const OUT = join(ROOT, 'plugins', sp.id);
    mkdirSync(OUT, { recursive: true });

    // Copy shared headers
    for (const h of SHARED_HEADERS) {
        copyFileSync(join(SRC, h), join(OUT, h));
    }

    // Copy sources
    for (const s of sp.sources) {
        copyFileSync(join(SRC, s), join(OUT, s));
    }

    // Copy plugin TTLs
    for (const t of sp.ttls) {
        if (existsSync(join(LV2, t))) copyFileSync(join(LV2, t), join(OUT, t));
        else console.warn(`  ⚠ TTL not found: ${t}`);
    }

    // Write manifest.ttl
    writeFileSync(join(OUT, 'manifest.ttl'), MANIFEST_PREFIX + '\n' + sp.manifest.join('\n') + '\n');

    // Update lv2.json entry
    const entry = {
        id: sp.id,
        description: sp.description,
        category: sp.category,
        sources: sp.sources,
    };
    const existing = registry.findIndex(e => e.id === sp.id);
    if (existing >= 0) registry[existing] = entry;
    else registry.push(entry);

    console.log(`✓ ${sp.id} (${sp.sources.length} sources)`);
    built++;
}

writeFileSync(lv2JsonPath, `${JSON.stringify(registry, null, 2)}\n`);

console.log(`\n✓ fomp setup complete — ${built} sub-plugins`);
console.log('  Run: node scripts/build-instruments.js --only fomp-autowah');
