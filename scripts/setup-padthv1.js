#!/usr/bin/env node
/**
 * Setup script for padthv1 — polyphonic additive (PADsynth) synthesizer LV2.
 *
 * padthv1 uses the same rncbc architecture as synthv1/drumkv1:
 *   - Qt dependencies covered by toolchain/qt-stub
 *   - QThread-based scheduler replaced with synchronous WASM version
 *   - padthv1_sample uses PADsynth (algorithmic, no file I/O needed)
 */

import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC  = join(ROOT, 'padthv1', 'src');
const LV2  = join(ROOT, 'padthv1', 'src', 'padthv1.lv2');
const OUT  = join(ROOT, 'plugins', 'padthv1');

if (!existsSync(SRC)) {
    console.error(`Source not found: ${SRC} — run fetch-sources.js first`);
    process.exit(1);
}

mkdirSync(OUT, { recursive: true });

// ── 1. Copy DSP headers ───────────────────────────────────────────────────────
const COPY_HEADERS = [
    'padthv1.h', 'padthv1_param.h', 'padthv1_programs.h', 'padthv1_controls.h',
    'padthv1_tuning.h', 'padthv1_formant.h', 'padthv1_wave.h',
    'padthv1_sample.h', 'padthv1_sched.h', 'padthv1_lv2.h',
    'padthv1_filter.h', 'padthv1_fx.h', 'padthv1_list.h', 'padthv1_ramp.h',
    'padthv1_reverb.h', 'padthv1_config.h',
];
const COPY_SOURCES = [
    'padthv1.cpp', 'padthv1_param.cpp', 'padthv1_programs.cpp',
    'padthv1_controls.cpp', 'padthv1_tuning.cpp', 'padthv1_formant.cpp',
    'padthv1_wave.cpp', 'padthv1_sample.cpp', 'padthv1_config.cpp',
    'padthv1_lv2.cpp',
];

for (const f of [...COPY_HEADERS, ...COPY_SOURCES]) {
    const src = join(SRC, f);
    if (existsSync(src)) copyFileSync(src, join(OUT, f));
    else console.warn(`   ⚠ not found: ${f}`);
}

// ── 2. Copy LV2 bundle TTLs ───────────────────────────────────────────────────
for (const f of ['manifest.ttl', 'padthv1.ttl']) {
    const src = join(LV2, f);
    if (existsSync(src)) copyFileSync(src, join(OUT, f));
}

// ── 3. Generate config.h ─────────────────────────────────────────────────────
writeFileSync(join(OUT, 'config.h'), `\
#pragma once
#define CONFIG_LV2 1
#define CONFIG_LV2_ATOM_FORGE_OBJECT 1
#define CONFIG_LV2_ATOM_FORGE_KEY    1
/* #undef CONFIG_LV2_OLD_HEADERS */
/* #undef CONFIG_LV2_PROGRAMS */
/* #undef CONFIG_LV2_PATCH */
/* #undef CONFIG_LV2_TIME_POSITION */
#define PROJECT_NAME    "padthv1"
#define PROJECT_DOMAIN  "padthv1.sourceforge.net"
#define PROJECT_VERSION "0.9.91"
`);

// ── 4. Synchronous WASM scheduler ────────────────────────────────────────────
writeFileSync(join(OUT, 'padthv1_sched_wasm.cpp'), `\
// padthv1_sched_wasm.cpp — synchronous WASM replacement for padthv1_sched.cpp
// All scheduling is synchronous and inline; no threads used in WASM.
#include "padthv1_sched.h"
#include <algorithm>
#include <map>
#include <vector>

// Registry of all active sched instances, grouped by padthv1* owner
static std::map<padthv1 *, std::vector<padthv1_sched *>> g_scheds;
// Registry of Notifier listeners, grouped by padthv1* owner
static std::map<padthv1 *, std::vector<padthv1_sched::Notifier *>> g_notifiers;

padthv1_sched::padthv1_sched(padthv1 *pPadth, Type stype, uint32_t nsize)
    : m_pPadth(pPadth), m_stype(stype), m_sync_wait(false)
{
    m_nsize  = (nsize < 4) ? 4 : nsize;
    m_nmask  = m_nsize - 1;
    m_items  = new int[m_nsize]();
    m_iread  = 0;
    m_iwrite = 0;
    g_scheds[pPadth].push_back(this);
}

padthv1_sched::~padthv1_sched()
{
    auto it = g_scheds.find(m_pPadth);
    if (it != g_scheds.end()) {
        auto &v = it->second;
        v.erase(std::remove(v.begin(), v.end(), this), v.end());
    }
    delete[] m_items;
}

padthv1 *padthv1_sched::instance() const { return m_pPadth; }

void padthv1_sched::schedule(int sid)
{
    const uint32_t w = (m_iwrite + 1) & m_nmask;
    if (w != m_iread) { m_items[m_iwrite] = sid; m_iwrite = w; }
    sync_process();
}

bool padthv1_sched::sync_wait() { return false; }

void padthv1_sched::sync_process()
{
    while (m_iread != m_iwrite) {
        const int sid = m_items[m_iread];
        m_iread = (m_iread + 1) & m_nmask;
        process(sid);
    }
}

void padthv1_sched::sync_notify(padthv1 *pPadth, Type stype, int sid)
{
    const auto it = g_notifiers.find(pPadth);
    if (it == g_notifiers.end()) return;
    for (auto *nb : it->second) nb->notify(stype, sid);
}

void padthv1_sched::sync_pending()
{
    for (auto &kv : g_scheds)
        for (auto *s : kv.second) s->sync_process();
}

void padthv1_sched::sync_reset()
{
    for (auto &kv : g_scheds)
        for (auto *s : kv.second) { s->m_iread = 0; s->m_iwrite = 0; }
}

padthv1_sched::Notifier::Notifier(padthv1 *pPadth)
    : m_pPadth(pPadth)
{
    g_notifiers[pPadth].push_back(this);
}

padthv1_sched::Notifier::~Notifier()
{
    auto it = g_notifiers.find(m_pPadth);
    if (it == g_notifiers.end()) return;
    auto &v = it->second;
    v.erase(std::remove(v.begin(), v.end(), this), v.end());
}
`);

// ── 5. Update plugins/lv2.json ───────────────────────────────────────────────
import { readFileSync, writeFileSync as wfs } from 'fs';
const lv2JsonPath = join(ROOT, 'plugins', 'lv2.json');
const registry = JSON.parse(readFileSync(lv2JsonPath, 'utf8'));

const entry = {
    id: 'padthv1',
    description: 'padthv1 — polyphonic additive (PADsynth) synthesizer',
    category: 'Instruments',
    includes: ['toolchain/qt-stub'],
    sources: [
        'padthv1.cpp', 'padthv1_param.cpp', 'padthv1_programs.cpp',
        'padthv1_controls.cpp', 'padthv1_tuning.cpp', 'padthv1_formant.cpp',
        'padthv1_wave.cpp', 'padthv1_sample.cpp', 'padthv1_config.cpp',
        'padthv1_sched_wasm.cpp', 'padthv1_lv2.cpp',
    ],
};

const existing = registry.findIndex(e => e.id === 'padthv1');
if (existing >= 0) registry[existing] = entry;
else registry.push(entry);
wfs(lv2JsonPath, `${JSON.stringify(registry, null, 2)}\n`);

console.log('✓ padthv1 setup complete');
console.log('  Run: node scripts/build-instruments.js --only padthv1');
