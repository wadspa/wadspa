#!/usr/bin/env node
/**
 * Setup script for drumkv1 — sample-based drum synthesizer LV2.
 *
 * drumkv1 depends on Qt (QSettings, QMap, QStringList, etc.) and libsndfile
 * for sample loading. This script:
 *   1. Copies the Qt-free DSP sources from the source repo
 *   2. Generates a synchronous WASM scheduler (replaces QThread-based sched.cpp)
 *   3. Generates a sample stub (replaces libsndfile-dependent sample.cpp;
 *      produces synthetic noise so drums are audible without sample files)
 *   4. Generates a config.h with the feature flags drumkv1 expects
 *   5. Copies the LV2 manifest and plugin TTL
 *
 * The shared toolchain/qt-stub/ directory is referenced via lv2.json includes.
 */

import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname }   from 'path';
import { fileURLToPath }   from 'url';

const ROOT  = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC   = join(ROOT, 'drumkv1', 'src');
const OUT   = join(ROOT, 'plugins', 'drumkv1');

if (!existsSync(SRC)) {
    console.error(`Source not found: ${SRC} — run fetch-sources.js first`);
    process.exit(1);
}

mkdirSync(OUT, { recursive: true });

// ── 1. Copy DSP headers and sources ──────────────────────────────────────────
const COPY_HEADERS = [
    'drumkv1.h', 'drumkv1_param.h', 'drumkv1_programs.h', 'drumkv1_controls.h',
    'drumkv1_tuning.h', 'drumkv1_formant.h', 'drumkv1_wave.h', 'drumkv1_resampler.h',
    'drumkv1_sample.h', 'drumkv1_sched.h', 'drumkv1_lv2.h', 'drumkv1_filter.h',
    'drumkv1_fx.h', 'drumkv1_list.h', 'drumkv1_ramp.h', 'drumkv1_reverb.h',
];
const COPY_SOURCES = [
    'drumkv1.cpp', 'drumkv1_param.cpp', 'drumkv1_programs.cpp',
    'drumkv1_controls.cpp', 'drumkv1_tuning.cpp', 'drumkv1_formant.cpp',
    'drumkv1_wave.cpp', 'drumkv1_resampler.cpp', 'drumkv1_config.cpp',
    'drumkv1_lv2.cpp',
];
for (const f of [...COPY_HEADERS, ...COPY_SOURCES]) {
    copyFileSync(join(SRC, f), join(OUT, f));
}

// ── 2. Copy drumkv1_config.h (uses Qt includes, but stub lib covers them) ────
copyFileSync(join(SRC, 'drumkv1_config.h'), join(OUT, 'drumkv1_config.h'));

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
#define PROJECT_NAME   "drumkv1"
#define PROJECT_DOMAIN "drumkv1.sourceforge.net"
#define PROJECT_VERSION "0.9.91"
`);

// ── 4. Synchronous WASM scheduler (replaces QThread-based drumkv1_sched.cpp) ─
writeFileSync(join(OUT, 'drumkv1_sched_wasm.cpp'), `\
// drumkv1_sched_wasm.cpp — synchronous WASM replacement for drumkv1_sched.cpp
// All scheduled work is executed inline (no threads in WASM).
#include "drumkv1_sched.h"
#include <cstring>
#include <map>
#include <vector>

static std::map<drumkv1 *, std::vector<drumkv1_sched::Notifier *>> g_notifiers;

drumkv1_sched::drumkv1_sched(drumkv1 *pDrumk, Type stype, uint32_t nsize)
    : m_pDrumk(pDrumk), m_stype(stype), m_sync_wait(false)
{
    m_nsize = 8;
    while (m_nsize < nsize) m_nsize <<= 1;
    m_nmask = m_nsize - 1;
    m_items = new int[m_nsize]();
    m_iread = m_iwrite = 0;
}

drumkv1_sched::~drumkv1_sched()
{
    delete[] m_items;
}

drumkv1 *drumkv1_sched::instance() const { return m_pDrumk; }

void drumkv1_sched::schedule(int sid)
{
    const uint32_t w = (m_iwrite + 1) & m_nmask;
    if (w != m_iread) { m_items[m_iwrite] = sid; m_iwrite = w; }
    sync_process();
}

bool drumkv1_sched::sync_wait()
{
    bool was = m_sync_wait;
    if (!was) m_sync_wait = true;
    return was;
}

void drumkv1_sched::sync_process()
{
    uint32_t r = m_iread;
    while (r != m_iwrite) {
        const int sid = m_items[r];
        process(sid);
        sync_notify(m_pDrumk, m_stype, sid);
        m_items[r] = 0;
        ++r &= m_nmask;
    }
    m_iread = r;
    m_sync_wait = false;
}

void drumkv1_sched::sync_notify(drumkv1 *pDrumk, Type stype, int sid)
{
    auto it = g_notifiers.find(pDrumk);
    if (it == g_notifiers.end()) return;
    for (auto *n : it->second) n->notify(stype, sid);
}

void drumkv1_sched::sync_pending() {}
void drumkv1_sched::sync_reset()   {}

drumkv1_sched::Notifier::Notifier(drumkv1 *pDrumk) : m_pDrumk(pDrumk)
{
    g_notifiers[pDrumk].push_back(this);
}

drumkv1_sched::Notifier::~Notifier()
{
    auto it = g_notifiers.find(m_pDrumk);
    if (it == g_notifiers.end()) return;
    auto &v = it->second;
    v.erase(std::remove(v.begin(), v.end(), this), v.end());
    if (v.empty()) g_notifiers.erase(it);
}
`);

// ── 5. Sample stub — replaces libsndfile with a synthetic noise burst ─────────
//    Without real samples drumkv1 produces silence; the stub injects a short
//    noise burst so the synth engine (ADSR, filter, panning) is audible.
writeFileSync(join(OUT, 'drumkv1_sample_stub.cpp'), `\
// drumkv1_sample_stub.cpp — libsndfile-free sample implementation.
// open() generates 0.5s of white noise so drums are audible without files.
#include "drumkv1_sample.h"
#include <cstdlib>
#include <cstring>
#include <cmath>

// ── drumkv1_sample ──────────────────────────────────────────────────────────

drumkv1_sample::drumkv1_sample(float srate)
    : m_srate(srate), m_filename(nullptr), m_nchannels(0),
      m_rate0(srate), m_freq0(440.0f), m_ratio(1.0f), m_nframes(0),
      m_pframes(nullptr), m_reverse(false),
      m_offset(false), m_offset_start(0), m_offset_end(0),
      m_offset_phase0(0.0f), m_offset_end2(0) {}

drumkv1_sample::drumkv1_sample(const drumkv1_sample& s)
    : m_srate(s.m_srate), m_filename(nullptr), m_nchannels(0),
      m_rate0(s.m_rate0), m_freq0(s.m_freq0), m_ratio(s.m_ratio),
      m_nframes(0), m_pframes(nullptr),
      m_reverse(false), m_offset(false),
      m_offset_start(0), m_offset_end(0),
      m_offset_phase0(0.0f), m_offset_end2(0)
{
    if (s.m_filename) open(s.m_filename, s.m_freq0);
}

drumkv1_sample::~drumkv1_sample() { close(); }

bool drumkv1_sample::open(const char *filename, float freq0)
{
    close();

    // Generate a short (0.5s) white-noise burst as placeholder sample.
    const uint32_t nframes = (uint32_t)(m_srate * 0.5f) + 4; // +4 for interp guard
    m_nchannels = 1;
    m_rate0     = m_srate;
    m_freq0     = freq0 > 0.0f ? freq0 : 440.0f;
    m_ratio     = m_rate0 / (m_freq0 * m_srate);
    m_nframes   = nframes;

    m_pframes = new float *[1];
    m_pframes[0] = new float[nframes + 4](); // +4 for hermite overread
    // Fill with white noise, amplitude decays over time
    unsigned rng = 0x12345678u;
    for (uint32_t i = 0; i < nframes; ++i) {
        rng = rng * 1664525u + 1013904223u;
        float n = (float)(int)rng / 2147483648.0f; // -1..1
        float env = 1.0f - (float)i / (float)nframes;
        m_pframes[0][i] = n * env * 0.5f;
    }

    // Store filename
    if (filename) {
        size_t len = ::strlen(filename);
        m_filename = new char[len + 1];
        ::memcpy(m_filename, filename, len + 1);
    }

    m_offset_start = 0;
    m_offset_end   = m_nframes;
    m_offset_end2  = m_nframes;
    m_offset_phase0 = 0.0f;
    m_reverse = false;
    m_offset  = false;

    return true;
}

void drumkv1_sample::close()
{
    if (m_pframes) {
        for (uint16_t k = 0; k < m_nchannels; ++k) delete[] m_pframes[k];
        delete[] m_pframes;
        m_pframes = nullptr;
    }
    delete[] m_filename;
    m_filename  = nullptr;
    m_nchannels = 0;
    m_nframes   = 0;
    m_offset_start = m_offset_end = m_offset_end2 = 0;
}

void drumkv1_sample::setOffsetRange(uint32_t start, uint32_t end)
{
    m_offset_start = start;
    m_offset_end   = end < m_nframes ? end : m_nframes;
    updateOffset();
}

void drumkv1_sample::updateOffset()
{
    m_offset_end2   = m_offset ? m_offset_end : m_nframes;
    m_offset_phase0 = m_offset ? (float)m_offset_start : 0.0f;
}

void drumkv1_sample::reverse_sync()
{
    if (!m_pframes || m_nframes == 0) return;
    for (uint16_t k = 0; k < m_nchannels; ++k) {
        float *f = m_pframes[k];
        uint32_t lo = 0, hi = m_nframes - 1;
        while (lo < hi) { float t = f[lo]; f[lo++] = f[hi]; f[hi--] = t; }
    }
}

uint32_t drumkv1_sample::zero_crossing(uint32_t i, int *slope) const
{
    if (!m_pframes || !m_pframes[0]) { if (slope) *slope = 0; return i; }
    const float *f = m_pframes[0];
    while (i + 1 < m_nframes) {
        if (f[i] <= 0.0f && f[i+1] > 0.0f) { if (slope) *slope = +1; return i; }
        if (f[i] >= 0.0f && f[i+1] < 0.0f) { if (slope) *slope = -1; return i; }
        ++i;
    }
    if (slope) *slope = 0;
    return i;
}

float drumkv1_sample::zero_crossing_k(uint32_t i) const
{
    if (!m_pframes || !m_pframes[0] || i + 1 >= m_nframes) return 0.0f;
    const float *f = m_pframes[0];
    const float denom = f[i+1] - f[i];
    return denom != 0.0f ? -f[i] / denom : 0.0f;
}
`);

// ── 6. Copy manifest.ttl and plugin TTL ─────────────────────────────────────
// The original repo's manifest.ttl — copy as-is (lists the plugin binary/ttl).
// drumkv1's lv2 bundle lives in src/
const lv2Dir = join(ROOT, 'drumkv1');
const lv2ManifestCandidates = [
    join(lv2Dir, 'drumkv1.lv2', 'manifest.ttl'),
    join(lv2Dir, 'src', 'drumkv1.lv2', 'manifest.ttl'),
    join(SRC, 'drumkv1.lv2', 'manifest.ttl'),
];
let manifestFound = false;
for (const p of lv2ManifestCandidates) {
    if (existsSync(p)) {
        copyFileSync(p, join(OUT, 'manifest.ttl'));
        const ttlDir = p.replace('/manifest.ttl', '');
        // Copy all .ttl files in that bundle dir
        import('fs').then(({ readdirSync }) => {
            for (const f of readdirSync(ttlDir)) {
                if (f.endsWith('.ttl'))
                    copyFileSync(join(ttlDir, f), join(OUT, f));
            }
        });
        manifestFound = true;
        break;
    }
}
if (!manifestFound) {
    // Generate a minimal manifest pointing to drumkv1's known URI
    writeFileSync(join(OUT, 'manifest.ttl'), `\
@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
<http://drumkv1.sourceforge.net/lv2> a lv2:Plugin ;
  lv2:binary <drumkv1.so> ;
  rdfs:seeAlso <drumkv1.ttl> .
`);
    // Copy the plugin TTL
    const ttlCandidates = [
        join(lv2Dir, 'drumkv1.lv2', 'drumkv1.ttl'),
        join(SRC, 'drumkv1.lv2', 'drumkv1.ttl'),
    ];
    for (const p of ttlCandidates) {
        if (existsSync(p)) { copyFileSync(p, join(OUT, 'drumkv1.ttl')); break; }
    }
}

console.log('✓  drumkv1 — ' + OUT);
console.log('\ndrumkv1 setup complete.');
