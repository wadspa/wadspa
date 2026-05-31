#!/usr/bin/env node
/**
 * Setup script for samplv1 — polyphonic sampler LV2 (rncbc).
 *
 * samplv1 follows the same rncbc architecture as synthv1/drumkv1/padthv1:
 *   - Qt dependencies covered by toolchain/qt-stub
 *   - QThread-based scheduler replaced with synchronous WASM version
 *   - samplv1_sample uses libsndfile for audio file I/O — replaced with a stub
 *     that generates a single-cycle sine wave (no file I/O in WASM)
 */

import { copyFileSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC  = join(ROOT, 'samplv1', 'src');
const LV2  = join(ROOT, 'samplv1', 'src', 'samplv1.lv2');
const OUT  = join(ROOT, 'plugins', 'samplv1');

if (!existsSync(SRC)) {
    console.error(`Source not found: ${SRC} — run fetch-sources.js first`);
    process.exit(1);
}

mkdirSync(OUT, { recursive: true });

// ── 1. Copy DSP headers ───────────────────────────────────────────────────────
const COPY_HEADERS = [
    'samplv1.h', 'samplv1_param.h', 'samplv1_programs.h', 'samplv1_controls.h',
    'samplv1_tuning.h', 'samplv1_formant.h', 'samplv1_wave.h',
    'samplv1_sample.h', 'samplv1_sched.h', 'samplv1_lv2.h',
    'samplv1_filter.h', 'samplv1_fx.h', 'samplv1_list.h', 'samplv1_ramp.h',
    'samplv1_reverb.h', 'samplv1_config.h', 'samplv1_pshifter.h',
];
const COPY_SOURCES = [
    'samplv1.cpp', 'samplv1_param.cpp', 'samplv1_programs.cpp',
    'samplv1_controls.cpp', 'samplv1_tuning.cpp', 'samplv1_formant.cpp',
    'samplv1_wave.cpp', 'samplv1_config.cpp', 'samplv1_pshifter.cpp',
    'samplv1_lv2.cpp',
];

for (const f of [...COPY_HEADERS, ...COPY_SOURCES]) {
    const src = join(SRC, f);
    if (existsSync(src)) copyFileSync(src, join(OUT, f));
    else console.warn(`   ⚠ not found: ${f}`);
}

// ── 2. Copy LV2 bundle TTLs ───────────────────────────────────────────────────
for (const f of ['manifest.ttl', 'samplv1.ttl']) {
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
#define PROJECT_NAME    "samplv1"
#define PROJECT_DOMAIN  "samplv1.sourceforge.net"
#define PROJECT_VERSION "0.9.91"
`);

// ── 4. samplv1_sample stub — sine wave instead of libsndfile ─────────────────
// The sampler reads audio files via libsndfile. In WASM there is no filesystem,
// so we replace open() with a single-cycle sine wave generator.
writeFileSync(join(OUT, 'samplv1_sample.cpp'), `\
// samplv1_sample.cpp — WASM stub: sine-wave sample instead of libsndfile.
#include "samplv1_sample.h"
#include <cmath>
#include <cstring>
#include <cstdlib>

samplv1_sample::samplv1_sample(float srate)
    : m_srate(srate), m_ntabs(1),
      m_filename(nullptr), m_nchannels(0),
      m_rate0(srate), m_freq0(440.0f), m_ratio(1.0f),
      m_nframes(0), m_pframes(nullptr), m_reverse(false),
      m_offset(false), m_offset_start(0), m_offset_end(0),
      m_offset_phase0(nullptr), m_offset_end2(0),
      m_loop(false), m_loop_start(0), m_loop_end(0),
      m_loop_phase1(nullptr), m_loop_phase2(nullptr),
      m_loop_xfade(0), m_loop_xzero(false), m_loop_end_release(false)
{}

samplv1_sample::samplv1_sample(const samplv1_sample& s)
    : m_srate(s.m_srate), m_ntabs(0),
      m_filename(nullptr), m_nchannels(0),
      m_rate0(s.m_rate0), m_freq0(s.m_freq0), m_ratio(s.m_ratio),
      m_nframes(0), m_pframes(nullptr), m_reverse(s.m_reverse),
      m_offset(s.m_offset), m_offset_start(s.m_offset_start), m_offset_end(s.m_offset_end),
      m_offset_phase0(nullptr), m_offset_end2(s.m_offset_end2),
      m_loop(s.m_loop), m_loop_start(s.m_loop_start), m_loop_end(s.m_loop_end),
      m_loop_phase1(nullptr), m_loop_phase2(nullptr),
      m_loop_xfade(s.m_loop_xfade), m_loop_xzero(s.m_loop_xzero),
      m_loop_end_release(s.m_loop_end_release)
{}

samplv1_sample::~samplv1_sample() { close(); }

bool samplv1_sample::open(const char *filename, float freq0, uint16_t)
{
    close();
    m_filename  = ::strdup(filename ? filename : "");
    m_freq0     = (freq0 > 0.0f ? freq0 : 440.0f);
    m_rate0     = 44100.0f;

    const uint32_t N = 256;
    m_ntabs     = 1;
    m_nchannels = 1;
    m_nframes   = N;

    m_pframes       = new float **[m_ntabs];
    m_pframes[0]    = new float  *[m_nchannels];
    m_pframes[0][0] = new float   [N];

    for (uint32_t i = 0; i < N; ++i)
        m_pframes[0][0][i] = 0.5f * sinf(2.0f * float(M_PI) * i / N);

    m_ratio       = m_rate0 / (m_freq0 * m_srate);
    m_offset_end  = N;
    m_offset_end2 = N;
    return true;
}

void samplv1_sample::close()
{
    if (m_pframes) {
        for (uint16_t t = 0; t < m_ntabs; ++t) {
            if (m_pframes[t]) {
                for (uint16_t k = 0; k < m_nchannels; ++k)
                    delete[] m_pframes[t][k];
                delete[] m_pframes[t];
            }
        }
        delete[] m_pframes;
        m_pframes = nullptr;
    }
    if (m_filename) { ::free(m_filename); m_filename = nullptr; }
    m_nframes = 0; m_nchannels = 0;
    delete[] m_offset_phase0; m_offset_phase0 = nullptr;
    delete[] m_loop_phase1;   m_loop_phase1   = nullptr;
    delete[] m_loop_phase2;   m_loop_phase2   = nullptr;
}

void samplv1_sample::setOffsetRange(uint32_t start, uint32_t end)
    { m_offset_start = start; m_offset_end = end; updateOffset(); }

void samplv1_sample::setLoopRange(uint32_t start, uint32_t end)
    { m_loop_start = start; m_loop_end = end; updateLoop(); }

void samplv1_sample::reverse_sync() {}

uint32_t samplv1_sample::zero_crossing(uint16_t, uint32_t i, int *) const { return i; }
float    samplv1_sample::zero_crossing_k(uint16_t, uint32_t) const { return 0.0f; }

void samplv1_sample::updateOffset()
    { m_offset_end2 = m_offset ? m_offset_end : m_nframes; }

void samplv1_sample::updateLoop() {}
`);

// ── 5. Synchronous WASM scheduler ────────────────────────────────────────────
writeFileSync(join(OUT, 'samplv1_sched_wasm.cpp'), `\
// samplv1_sched_wasm.cpp — synchronous WASM replacement for samplv1_sched.cpp
#include "samplv1_sched.h"
#include <algorithm>
#include <map>
#include <vector>

static std::map<samplv1 *, std::vector<samplv1_sched *>> g_scheds;
static std::map<samplv1 *, std::vector<samplv1_sched::Notifier *>> g_notifiers;

samplv1_sched::samplv1_sched(samplv1 *pSampl, Type stype, uint32_t nsize)
    : m_pSampl(pSampl), m_stype(stype), m_sync_wait(false)
{
    m_nsize  = (nsize < 4) ? 4 : nsize;
    m_nmask  = m_nsize - 1;
    m_items  = new int[m_nsize]();
    m_iread  = 0;
    m_iwrite = 0;
    g_scheds[pSampl].push_back(this);
}

samplv1_sched::~samplv1_sched()
{
    auto it = g_scheds.find(m_pSampl);
    if (it != g_scheds.end()) {
        auto &v = it->second;
        v.erase(std::remove(v.begin(), v.end(), this), v.end());
    }
    delete[] m_items;
}

samplv1 *samplv1_sched::instance() const { return m_pSampl; }

void samplv1_sched::schedule(int sid)
{
    const uint32_t w = (m_iwrite + 1) & m_nmask;
    if (w != m_iread) { m_items[m_iwrite] = sid; m_iwrite = w; }
    sync_process();
}

bool samplv1_sched::sync_wait() { return false; }

void samplv1_sched::sync_process()
{
    while (m_iread != m_iwrite) {
        const int sid = m_items[m_iread];
        m_iread = (m_iread + 1) & m_nmask;
        process(sid);
    }
}

void samplv1_sched::sync_notify(samplv1 *pSampl, Type stype, int sid)
{
    const auto it = g_notifiers.find(pSampl);
    if (it == g_notifiers.end()) return;
    for (auto *nb : it->second) nb->notify(stype, sid);
}

void samplv1_sched::sync_pending()
{
    for (auto &kv : g_scheds)
        for (auto *s : kv.second) s->sync_process();
}

void samplv1_sched::sync_reset()
{
    for (auto &kv : g_scheds)
        for (auto *s : kv.second) { s->m_iread = 0; s->m_iwrite = 0; }
}

samplv1_sched::Notifier::Notifier(samplv1 *pSampl) : m_pSampl(pSampl)
{
    g_notifiers[pSampl].push_back(this);
}

samplv1_sched::Notifier::~Notifier()
{
    auto it = g_notifiers.find(m_pSampl);
    if (it == g_notifiers.end()) return;
    auto &v = it->second;
    v.erase(std::remove(v.begin(), v.end(), this), v.end());
}
`);

// ── 6. Update plugins/lv2.json ───────────────────────────────────────────────
const lv2JsonPath = join(ROOT, 'plugins', 'lv2.json');
const registry = JSON.parse(readFileSync(lv2JsonPath, 'utf8'));

const entry = {
    id: 'samplv1',
    description: 'samplv1 — polyphonic sampler LV2',
    category: 'Instruments',
    includes: ['toolchain/qt-stub'],
    sources: [
        'samplv1.cpp', 'samplv1_param.cpp', 'samplv1_programs.cpp',
        'samplv1_controls.cpp', 'samplv1_tuning.cpp', 'samplv1_formant.cpp',
        'samplv1_wave.cpp', 'samplv1_sample.cpp', 'samplv1_config.cpp',
        'samplv1_pshifter.cpp', 'samplv1_sched_wasm.cpp', 'samplv1_lv2.cpp',
    ],
};

const existing = registry.findIndex(e => e.id === 'samplv1');
if (existing >= 0) registry[existing] = entry;
else registry.push(entry);
writeFileSync(lv2JsonPath, `${JSON.stringify(registry, null, 2)}\n`);

console.log('✓ samplv1 setup complete');
console.log('  Run: node scripts/build-instruments.js --only samplv1');
