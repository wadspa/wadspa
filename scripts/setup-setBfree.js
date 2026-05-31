#!/usr/bin/env node
/**
 * Setup script for setBfree — Hammond B3 organ component plugins.
 *
 * Builds two LV2 plugins from the setBfree repo:
 *   - setBfree-reverb   (spring reverb)
 *   - setBfree-overdrive (preamp distortion)
 *
 * Both depend on setBfree/src/cfgParser.h and src/midi.h for types,
 * but their lv2.c wrappers already stub useMIDIControlFunction and
 * getConfigParameter_* inline — so we only need the type definitions,
 * not the full cfg/MIDI machinery.
 *
 * Strategy: generate a minimal cfgParser.h stub (types + inline no-op
 * getConfigParameter functions) and a minimal midi.h stub (just the
 * prototype — lv2.c provides the real stub definition).
 * Both are placed in a src/ subdir so the relative #include "../src/..."
 * paths in the source files resolve correctly.
 */

import { copyFileSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, 'setBfree');

if (!existsSync(REPO)) {
    console.error(`Source not found: ${REPO} — run fetch-sources.js first`);
    process.exit(1);
}

// ── Shared stubs ──────────────────────────────────────────────────────────────
// reverb.h / overdrive.h include "../src/cfgParser.h" and "../src/midi.h".
// When compiled from plugins/setBfree-reverb/ or plugins/setBfree-overdrive/,
// "../src/" resolves to "plugins/src/". Create the stubs there.
const STUB_SRC = join(ROOT, 'plugins', 'src');
mkdirSync(STUB_SRC, { recursive: true });

writeFileSync(join(STUB_SRC, 'cfgParser.h'), `\
/* setBfree cfgParser.h — minimal WASM stub (types only, no implementation) */
#pragma once
#include <stdio.h>
#include <stdint.h>

#define INCOMPLETE_DOC "", 0, 0, 0
#define DOC_SENTINEL {NULL, CFG_TEXT, "", "", "", 0, 0, 0}
#define DENORMAL_HACK (1e-14)

typedef struct _configContext {
  const char *fname;
  int         linenr;
  const char *name;
  const char *value;
} ConfigContext;

enum conftype { CFG_TEXT=0, CFG_DOUBLE, CFG_DECIBEL, CFG_FLOAT, CFG_INT, CFG_LAST };

typedef struct _configDoc {
  const char   *name;
  enum conftype type;
  char const   *dflt;
  char const   *desc;
  char const   *unit;
  double        ui_min;
  double        ui_max;
  double        ui_step;
} ConfigDoc;

/* Declarations only — lv2.c in each plugin provides the actual stub implementations. */
int getConfigParameter_d(const char *n, ConfigContext *c, double *v);
int getConfigParameter_dr(const char *n, ConfigContext *c, double *v, double lo, double hi);
int getConfigParameter_f(const char *n, ConfigContext *c, float *v);
int getConfigParameter_fr(const char *n, ConfigContext *c, float *v, float lo, float hi);
int getConfigParameter_i(const char *n, ConfigContext *c, int *v);
int getConfigParameter_ir(const char *n, ConfigContext *c, int *v, int lo, int hi);
`);

writeFileSync(join(STUB_SRC, 'midi.h'), `\
/* setBfree midi.h — minimal WASM stub (type declaration only) */
#pragma once
#include "cfgParser.h"
#include <stdint.h>
/* lv2.c in each plugin provides its own inline stub for this function. */
void useMIDIControlFunction(void *m, const char *cfname, void (*f)(void *, unsigned char), void *d);
`);

console.log('  ✓ Created plugins/setBfree-src/cfgParser.h + midi.h stubs');

// ── Helper: build one setBfree sub-plugin ─────────────────────────────────────
const lv2JsonPath = join(ROOT, 'plugins', 'lv2.json');
const registry = JSON.parse(readFileSync(lv2JsonPath, 'utf8'));

function setupSubPlugin({ id, subdir, sources, description, ttlIn, ttlName, ttlVars }) {
    const BDIR = join(REPO, subdir);
    const OUT  = join(ROOT, 'plugins', id);
    mkdirSync(OUT, { recursive: true });

    // Copy source files
    for (const f of sources) {
        if (existsSync(join(BDIR, f))) copyFileSync(join(BDIR, f), join(OUT, f));
        else console.warn(`  ⚠ not found: ${f}`);
    }

    // Resolve TTL from template
    let ttlSrc = readFileSync(join(BDIR, ttlIn), 'utf8');
    for (const [k, v] of Object.entries(ttlVars)) ttlSrc = ttlSrc.replace(new RegExp(`@${k}@`, 'g'), v);
    writeFileSync(join(OUT, ttlName), ttlSrc);

    // Write manifest — apply ttlVars first, then replace @LIB_EXT@, then blank leftovers
    let manifestSrc = readFileSync(join(BDIR, 'manifest.ttl.in'), 'utf8');
    for (const [k, v] of Object.entries(ttlVars)) manifestSrc = manifestSrc.replace(new RegExp(`@${k}@`, 'g'), v);
    const manifest = manifestSrc
        .replace(/@LIB_EXT@/g, '.wasm')
        .replace(/@[A-Z_]+@/g, '');
    writeFileSync(join(OUT, 'manifest.ttl'), manifest);

    // lv2.json sources: only compilable files (exclude headers)
    const compilableSources = sources.filter(f => /\.(c|cpp|cc)$/.test(f));

    // Update lv2.json
    const entry = { id, description, category: 'Effects', sources: compilableSources };
    const existing = registry.findIndex(e => e.id === id);
    if (existing >= 0) registry[existing] = entry;
    else registry.push(entry);

    console.log(`  ✓ ${id} (${compilableSources.length} sources)`);
}

// ── b_reverb ─────────────────────────────────────────────────────────────────
setupSubPlugin({
    id: 'setBfree-reverb',
    subdir: 'b_reverb',
    sources: ['lv2.c', 'reverb.c', 'reverb.h'],
    description: 'setBfree: Spring Reverb (LV2)',
    ttlIn: 'b_reverb.ttl.in',
    ttlName: 'b_reverb.ttl',
    ttlVars: { VERSION: '', MODBRAND: 'setBfree', MODLABEL: 'B_Reverb' },
});

// ── b_overdrive ───────────────────────────────────────────────────────────────
// overdrive.c is pre-generated by the overmaker code-generator tool;
// overmaker.c / ovt_biased.c / filterTools.c are build-time only and not compiled into the LV2.
setupSubPlugin({
    id: 'setBfree-overdrive',
    subdir: 'b_overdrive',
    sources: ['lv2.c', 'overdrive.c', 'overdrive.h'],
    description: 'setBfree: Overdrive Preamp (LV2)',
    ttlIn: 'b_overdrive.ttl.in',
    ttlName: 'b_overdrive.ttl',
    ttlVars: { VERSION: '', MODBRAND: 'setBfree', MODLABEL: 'B_Overdrive', LV2NAME: 'b_overdrive' },
});

writeFileSync(lv2JsonPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log('\n✓ setBfree setup complete');
console.log('  Run: node scripts/build-instruments.js --only setBfree-reverb');
