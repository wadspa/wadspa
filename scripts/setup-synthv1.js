#!/usr/bin/env node
/**
 * Set up the synthv1 LV2 plugin directory for wadspa compilation.
 *
 * synthv1 is a dual-oscillator polyphonic analog synthesizer by rncbc.
 * Its core DSP is pure C++ but the LV2 plugin layer and configuration
 * subsystem depend on Qt. This script:
 *
 *   1. Copies only the Qt-free DSP sources into plugins/synthv1/
 *   2. Generates minimal Qt stubs (QString, QVector) so the tuning header
 *      compiles without a real Qt installation
 *   3. Generates stub headers for synthv1_config, synthv1_programs, and
 *      synthv1_controls that replace Qt-dependent implementations with
 *      no-op classes
 *   4. Generates WASM-compatible replacements for the Qt-dependent .cpp
 *      files (sched, tuning file-I/O, LV2 plugin entry point)
 *
 * Usage:
 *   node scripts/setup-synthv1.js
 */

import { existsSync, mkdirSync, copyFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT      = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC       = join(ROOT, 'synthv1', 'src');
const PLUGIN_ID = 'synthv1';
const DEST      = join(ROOT, 'plugins', PLUGIN_ID);
const QT_STUB   = join(DEST, 'qt_stub');

if (!existsSync(SRC)) {
    console.error('synthv1 not found. Run: node scripts/fetch-sources.js --only synthv1');
    process.exit(1);
}

mkdirSync(DEST, { recursive: true });
mkdirSync(QT_STUB, { recursive: true });

console.log(`▶  ${PLUGIN_ID}`);

// ── 1. DSP source files (no Qt) ────────────────────────────────────────────
for (const f of [
    'synthv1.cpp', 'synthv1.h',
    'synthv1_wave.cpp', 'synthv1_wave.h',
    'synthv1_formant.cpp', 'synthv1_formant.h',
    'synthv1_tuning.h',   // .cpp replaced by stub below
    'synthv1_sched.h',    // .cpp replaced by wasm stub below
    'synthv1_filter.h',
    'synthv1_fx.h',
    'synthv1_reverb.h',
    'synthv1_list.h',
    'synthv1_ramp.h',
]) {
    copyFileSync(join(SRC, f), join(DEST, f));
}
console.log('   ✓ DSP sources');

// ── 2. TTL files (strip UI references) ─────────────────────────────────────
const ttlDir = join(SRC, 'synthv1.lv2');
copyFileSync(join(ttlDir, 'synthv1.ttl'), join(DEST, 'synthv1.ttl'));
writeFileSync(join(DEST, 'manifest.ttl'), `\
@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<http://synthv1.sourceforge.net/lv2>
\ta lv2:Plugin, lv2:InstrumentPlugin ;
\tlv2:binary <synthv1.so> ;
\trdfs:seeAlso <synthv1.ttl> .
`);
console.log('   ✓ TTL files');

// ── 3. Minimal Qt stubs (angle-bracket includes) ───────────────────────────
//
// synthv1_tuning.h uses <QString> and <QVector>; synthv1.cpp uses QString
// for the per-instance tuning file fields.  We only need these two types.

writeFileSync(join(QT_STUB, 'QByteArray'), `\
#pragma once
#include <cstring>
// Minimal QByteArray stub — holds a non-owning const char* pointer.
class QByteArray {
    const char *m_ptr;
public:
    QByteArray() : m_ptr("") {}
    explicit QByteArray(const char *p) : m_ptr(p ? p : "") {}
    const char *constData() const { return m_ptr; }
    bool isEmpty() const { return !m_ptr || *m_ptr == '\\0'; }
    int size() const { return m_ptr ? (int)::strlen(m_ptr) : 0; }
};
`);

writeFileSync(join(QT_STUB, 'QString'), `\
#pragma once
#include "QByteArray"
#include <string>
#include <cstring>

class QString {
    std::string m_s;
public:
    QString() = default;
    QString(const char *s) : m_s(s ? s : "") {}
    QString(const std::string &s) : m_s(s) {}

    static QString fromUtf8(const char *s)    { return QString(s); }
    static QString fromLocal8Bit(const char *s){ return QString(s); }

    // Returns a QByteArray that points into this QString's internal buffer.
    // Safe to use immediately (before this QString is modified or destroyed).
    QByteArray toUtf8() const { return QByteArray(m_s.c_str()); }

    bool isEmpty() const { return m_s.empty(); }
    int  size()    const { return (int)m_s.size(); }
    char at(int i) const { return m_s[i]; }

    bool startsWith(const char *s) const {
        size_t n = s ? ::strlen(s) : 0;
        return n > 0 && m_s.compare(0, n, s) == 0;
    }
    bool startsWith(const QString &o) const {
        return m_s.compare(0, o.m_s.size(), o.m_s) == 0;
    }
    bool endsWith(const char *s) const {
        size_t n = s ? ::strlen(s) : 0;
        return n > 0 && m_s.size() >= n &&
               m_s.compare(m_s.size() - n, n, s) == 0;
    }
    QString trimmed() const {
        size_t a = m_s.find_first_not_of(" \\t\\r\\n");
        if (a == std::string::npos) return {};
        size_t b = m_s.find_last_not_of(" \\t\\r\\n");
        return QString(m_s.substr(a, b - a + 1));
    }

    bool operator==(const QString &o) const { return m_s == o.m_s; }
    bool operator!=(const QString &o) const { return m_s != o.m_s; }
    bool operator< (const QString &o) const { return m_s <  o.m_s; }
    bool operator==(const char *s)    const { return m_s == (s ? s : ""); }
    bool operator!=(const char *s)    const { return m_s != (s ? s : ""); }

    QString &operator=(const char *s) { m_s = s ? s : ""; return *this; }

    std::string toStdString() const { return m_s; }
};
`);

writeFileSync(join(QT_STUB, 'QVector'), `\
#pragma once
#include <vector>
// Map QVector<T> directly to std::vector<T>.
// std::vector provides the same interface used in synthv1_tuning:
//   clear(), push_back(), empty(), size(), at(), operator[].
template<typename T>
using QVector = std::vector<T>;
`);

console.log('   ✓ qt_stub/ (QString, QByteArray, QVector)');

// ── 4. config.h ────────────────────────────────────────────────────────────
writeFileSync(join(DEST, 'config.h'), `\
#pragma once
/* wadspa stub — LV2 feature flags for synthv1 WASM build */

/* Enable core LV2 atom/MIDI support */
#define CONFIG_LV2 1
#define CONFIG_LV2_ATOM_FORGE_OBJECT 1
#define CONFIG_LV2_ATOM_FORGE_KEY    1

/* Use new-style LV2 headers (lv2/core/lv2.h, lv2/urid/urid.h, …) */
/* #undef CONFIG_LV2_OLD_HEADERS */

/* Optional LV2 extensions — disabled for WASM */
/* #undef CONFIG_LV2_PROGRAMS */
/* #undef CONFIG_LV2_PATCH */
/* #undef CONFIG_LV2_PORT_EVENT */
/* #undef CONFIG_LV2_PORT_CHANGE_REQUEST */

/* Project name used in state XML */
#define PROJECT_NAME "synthv1"
`);
console.log('   ✓ config.h (stub)');

// ── 5. synthv1_config.h stub ───────────────────────────────────────────────
writeFileSync(join(DEST, 'synthv1_config.h'), `\
#pragma once
#include "config.h"
#include <QString>

// Forward decls expected by synthv1.cpp
class synthv1_controls;
class synthv1_programs;

// Qt-free stub: replaces the QSettings-based synthv1_config for WASM builds.
// All preset/tuning file I/O is disabled; tuning is always standard 12-TET.
class synthv1_config {
public:
    synthv1_config()
        : bTuningEnabled(false),
          fTuningRefPitch(440.0f),
          iTuningRefNote(69) {}

    ~synthv1_config() {}

    // Micro-tuning: disabled by default so synthv1.cpp skips all file I/O.
    bool    bTuningEnabled;
    float   fTuningRefPitch;
    int     iTuningRefNote;
    QString sTuningKeyMapFile;   // isEmpty() == true by default
    QString sTuningScaleFile;    // isEmpty() == true by default

    // Config load/save — no-ops for WASM
    void loadControls(synthv1_controls *) {}
    void loadPrograms(synthv1_programs *) {}
    void savePrograms(synthv1_programs *) {}

    static synthv1_config *getInstance() { return nullptr; }
};
`);
console.log('   ✓ synthv1_config.h (stub)');

// ── 6. synthv1_programs.h stub ─────────────────────────────────────────────
writeFileSync(join(DEST, 'synthv1_programs.h'), `\
#pragma once
#include <cstdint>

// Forward decl — full definition not needed in the WASM stub.
class synthv1;

// Qt-free stub: replaces the QMap-based bank/program database.
// Program changes and bank selects are silently ignored in WASM builds.
class synthv1_programs {
public:
    explicit synthv1_programs(synthv1 *) : m_enabled(false) {}
    ~synthv1_programs() {}

    void enabled(bool on) { m_enabled = on; }
    bool enabled() const  { return m_enabled; }

    void prog_change(int) {}
    void bank_select_msb(uint8_t) {}
    void bank_select_lsb(uint8_t) {}

private:
    bool m_enabled;
};
`);
console.log('   ✓ synthv1_programs.h (stub)');

// ── 7. synthv1_controls.h stub ─────────────────────────────────────────────
writeFileSync(join(DEST, 'synthv1_controls.h'), `\
#pragma once

// Forward decl — full definition not needed in the WASM stub.
class synthv1;

// Qt-free stub: replaces the QMap-based MIDI CC controller database.
// Controller events are silently dropped in WASM builds; parameters are
// still settable through LV2 control ports.
class synthv1_controls {
public:
    explicit synthv1_controls(synthv1 *) : m_enabled(false) {}
    ~synthv1_controls() {}

    void enabled(bool on) { m_enabled = on; }
    bool enabled() const  { return m_enabled; }

    void process_enqueue(unsigned short, unsigned short, unsigned short) {}
    void process_dequeue() {}
    void reset() {}
    void process(unsigned int) {}

private:
    bool m_enabled;
};
`);
console.log('   ✓ synthv1_controls.h (stub)');

// ── 8. synthv1_sched_wasm.cpp ──────────────────────────────────────────────
//
// Synchronous (no-Qt-thread) implementation of the scheduler.
// schedule() runs process() inline so there are no background threads.
// sync_notify / sync_pending / sync_reset are no-ops since nothing listens.

writeFileSync(join(DEST, 'synthv1_sched_wasm.cpp'), `\
#include "synthv1_sched.h"
#include <cstring>

synthv1_sched::synthv1_sched(synthv1 *pSynth, Type stype, uint32_t nsize)
    : m_pSynth(pSynth), m_stype(stype), m_sync_wait(false)
{
    m_nsize = 8;
    while (m_nsize < nsize) m_nsize <<= 1;
    m_nmask = m_nsize - 1;
    m_items = new int[m_nsize];
    ::memset(m_items, 0, m_nsize * sizeof(int));
    m_iread = m_iwrite = 0;
}

synthv1_sched::~synthv1_sched()
{
    delete[] m_items;
}

synthv1 *synthv1_sched::instance() const
{
    return m_pSynth;
}

void synthv1_sched::schedule(int sid)
{
    uint32_t w = (m_iwrite + 1) & m_nmask;
    if (w != m_iread) {
        m_items[m_iwrite] = sid;
        m_iwrite = w;
    }
    // Synchronous: flush the queue immediately on the calling thread.
    sync_process();
}

bool synthv1_sched::sync_wait()
{
    const bool was = m_sync_wait;
    if (!was) m_sync_wait = true;
    return was;
}

void synthv1_sched::sync_process()
{
    uint32_t r = m_iread;
    while (r != m_iwrite) {
        const int sid = m_items[r];
        process(sid);
        m_items[r] = 0;
        ++r &= m_nmask;
    }
    m_iread = r;
    m_sync_wait = false;
}

void synthv1_sched::sync_notify(synthv1 *, Type, int) {}
void synthv1_sched::sync_pending() {}
void synthv1_sched::sync_reset() {}

synthv1_sched::Notifier::Notifier(synthv1 *) {}
synthv1_sched::Notifier::~Notifier() {}
`);
console.log('   ✓ synthv1_sched_wasm.cpp');

// ── 9. synthv1_tuning_stub.cpp ─────────────────────────────────────────────
//
// Replaces synthv1_tuning.cpp's file-I/O functions with no-ops.
// The tuning object is constructed with default 12-TET + reset() is called
// from synthv1.cpp.  Since bTuningEnabled == false in the config stub,
// loadKeyMapFile / loadScaleFile are never actually called at runtime,
// but they must link successfully.

writeFileSync(join(DEST, 'synthv1_tuning_stub.cpp'), `\
#include "synthv1_tuning.h"
#include <cmath>

synthv1_tuning::synthv1_tuning(float refPitch, int refNote)
    : m_refPitch(refPitch), m_refNote(refNote),
      m_zeroNote(0), m_mapRepeatInc(1), m_basePitch(0.0f)
{
    reset(refPitch, refNote);
}

void synthv1_tuning::reset(float refPitch, int refNote)
{
    m_refPitch    = refPitch;
    m_refNote     = refNote;
    m_zeroNote    = 0;
    m_mapRepeatInc = 12;

    m_scale.clear();
    for (int i = 0; i < 12; ++i)
        m_scale.push_back(::powf(2.0f, (i + 1) / 12.0f));

    m_mapping.clear();
    m_mapping.push_back(0);

    updateBasePitch();
}

bool synthv1_tuning::loadKeyMapFile(const QString &)  { return false; }
bool synthv1_tuning::loadScaleFile(const QString &)   { return false; }

float synthv1_tuning::parseScaleLine(const QString &) const { return 0.0f; }

void synthv1_tuning::updateBasePitch()
{
    m_basePitch = m_refPitch / ::powf(2.0f, float(m_refNote) / 12.0f);
}

float synthv1_tuning::noteToPitch(int note) const
{
    if (note < 0 || note > 127 || m_mapping.empty())
        return m_refPitch * ::powf(2.0f, (note - m_refNote) / 12.0f);

    const int mapSize  = (int)m_mapping.size();
    const int mapIndex = ((note - m_zeroNote) % mapSize + mapSize) % mapSize;
    const int nRepeats = (note - m_zeroNote - mapIndex) / mapSize;

    if (m_mapping.at(mapIndex) < 0)
        return -1.0f; // unmapped note

    const int scaleDegree = nRepeats * m_mapRepeatInc + m_mapping.at(mapIndex);
    const int scaleSize   = (int)m_scale.size();

    if (scaleSize == 0)
        return m_refPitch * ::powf(2.0f, (note - m_refNote) / 12.0f);

    const int   nOctaves   = scaleDegree / scaleSize;
    const int   scaleIndex = scaleDegree % scaleSize;
    const float octavePitch
        = m_basePitch * ::powf(m_scale.at(scaleSize - 1), nOctaves);

    return (scaleIndex == 0) ? octavePitch
        : octavePitch * m_scale.at(scaleIndex - 1);
}
`);
console.log('   ✓ synthv1_tuning_stub.cpp');

// ── 10. synthv1_wasm_lv2.cpp ───────────────────────────────────────────────
//
// Minimal Qt-free LV2 plugin entry point for WASM.
// Implements the seven LV2 callbacks directly against the synthv1 C++ class.
// Port layout mirrors synthv1_lv2.h:
//   0  MidiIn   — atom:Sequence (MIDI input)
//   1  Notify   — atom:Sequence (output, ignored here)
//   2  AudioInL — float*        (audio input L, unused by instrument)
//   3  AudioInR — float*        (audio input R, unused by instrument)
//   4  AudioOutL— float*        (audio output L)
//   5  AudioOutR— float*        (audio output R)
//   6+ ParamBase— float*        (one per synthv1::ParamIndex)

writeFileSync(join(DEST, 'synthv1_wasm_lv2.cpp'), `\
#include "synthv1.h"

#include "lv2/core/lv2.h"
#include "lv2/urid/urid.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"

#include <cstring>
#include <cstdlib>

#define SYNTHV1_URI "http://synthv1.sourceforge.net/lv2"

enum PortIndex {
    Port_MidiIn    = 0,
    Port_Notify    = 1,
    Port_AudioInL  = 2,
    Port_AudioInR  = 3,
    Port_AudioOutL = 4,
    Port_AudioOutR = 5,
    Port_ParamBase = 6,
};

// synthv1 is abstract — subclass to implement the UI-notify hooks as no-ops.
class SynthV1Wasm : public synthv1 {
public:
    SynthV1Wasm(double rate) : synthv1(2, (float)rate) {}
    void updatePreset(bool)           override {}
    void updateParam(ParamIndex)      override {}
    void updateParams()               override {}
    void updateTuning()               override {}
};

struct SynthV1Instance {
    SynthV1Wasm      *synth;
    LV2_URID          midi_MidiEvent;
    LV2_Atom_Sequence *atom_in;
    LV2_Atom_Sequence *atom_out;
    float *in_l, *in_r;
    float *out_l, *out_r;
};

static LV2_Handle synthv1_instantiate(
    const LV2_Descriptor *, double sample_rate,
    const char *, const LV2_Feature *const *features)
{
    SynthV1Instance *p = new SynthV1Instance{};
    p->synth = new SynthV1Wasm(sample_rate);

    LV2_URID_Map *umap = nullptr;
    for (int i = 0; features && features[i]; ++i) {
        if (::strcmp(features[i]->URI, LV2_URID__map) == 0)
            umap = (LV2_URID_Map *)features[i]->data;
    }
    p->midi_MidiEvent = umap
        ? umap->map(umap->handle, LV2_MIDI__MidiEvent) : 0;

    p->synth->reset();
    return p;
}

static void synthv1_connect_port(LV2_Handle handle, uint32_t port, void *data)
{
    SynthV1Instance *p = (SynthV1Instance *)handle;
    switch ((PortIndex)port) {
    case Port_MidiIn:    p->atom_in  = (LV2_Atom_Sequence *)data; break;
    case Port_Notify:    p->atom_out = (LV2_Atom_Sequence *)data; break;
    case Port_AudioInL:  p->in_l     = (float *)data;             break;
    case Port_AudioInR:  p->in_r     = (float *)data;             break;
    case Port_AudioOutL: p->out_l    = (float *)data;             break;
    case Port_AudioOutR: p->out_r    = (float *)data;             break;
    default: {
        const int pidx = (int)port - Port_ParamBase;
        if (pidx >= 0 && pidx < (int)synthv1::NUM_PARAMS)
            p->synth->setParamPort(synthv1::ParamIndex(pidx), (float *)data);
        break;
    }
    }
}

static void synthv1_activate(LV2_Handle handle)
{
    ((SynthV1Instance *)handle)->synth->reset();
}

static void synthv1_run(LV2_Handle handle, uint32_t nframes)
{
    SynthV1Instance *p = (SynthV1Instance *)handle;

    float *ins[2]  = { p->in_l,  p->in_r  };
    float *outs[2] = { p->out_l, p->out_r };

    uint32_t ndelta = 0;

    if (p->atom_in) {
        LV2_ATOM_SEQUENCE_FOREACH(p->atom_in, ev) {
            if (!ev) continue;
            if (ev->body.type == p->midi_MidiEvent) {
                const uint32_t t = (uint32_t)ev->time.frames;
                if (t > ndelta) {
                    const uint32_t n = t - ndelta;
                    p->synth->process(ins, outs, n);
                    ins[0] += n; ins[1] += n;
                    outs[0] += n; outs[1] += n;
                    ndelta = t;
                }
                uint8_t *data = (uint8_t *)LV2_ATOM_BODY(&ev->body);
                p->synth->process_midi(data, ev->body.size);
            }
        }
    }

    if (nframes > ndelta)
        p->synth->process(ins, outs, nframes - ndelta);
}

static void synthv1_deactivate(LV2_Handle handle)
{
    ((SynthV1Instance *)handle)->synth->reset();
}

static void synthv1_cleanup(LV2_Handle handle)
{
    SynthV1Instance *p = (SynthV1Instance *)handle;
    delete p->synth;
    delete p;
}

static const void *synthv1_extension_data(const char *) { return nullptr; }

static const LV2_Descriptor s_descriptor = {
    SYNTHV1_URI,
    synthv1_instantiate,
    synthv1_connect_port,
    synthv1_activate,
    synthv1_run,
    synthv1_deactivate,
    synthv1_cleanup,
    synthv1_extension_data,
};

LV2_SYMBOL_EXPORT const LV2_Descriptor *lv2_descriptor(uint32_t index)
{
    return (index == 0) ? &s_descriptor : nullptr;
}
`);
console.log('   ✓ synthv1_wasm_lv2.cpp');

// ── 11. Update plugins/lv2.json ────────────────────────────────────────────
const lv2JsonPath = join(ROOT, 'plugins', 'lv2.json');
const registry = JSON.parse(
    (await import('fs')).readFileSync(lv2JsonPath, 'utf8')
);

// Remove any existing synthv1 entry before re-adding.
const filtered = registry.filter(e => e.id !== PLUGIN_ID);

const entry = {
    id:          PLUGIN_ID,
    description: 'synthv1 — dual-oscillator polyphonic analog synthesizer',
    category:    'Instruments',
    includes:    ['plugins/synthv1/qt_stub'],
    sources: [
        'synthv1.cpp',
        'synthv1_wave.cpp',
        'synthv1_formant.cpp',
        'synthv1_tuning_stub.cpp',
        'synthv1_sched_wasm.cpp',
        'synthv1_wasm_lv2.cpp',
    ],
};

filtered.push(entry);
(await import('fs')).writeFileSync(lv2JsonPath, JSON.stringify(filtered, null, 2) + '\n');
console.log('   ✓ plugins/lv2.json updated');

console.log(`\n✓ setup-synthv1 complete`);
