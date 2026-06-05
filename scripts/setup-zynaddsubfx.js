#!/usr/bin/env node
/**
 * Setup script for ZynAddSubFX.
 *
 * This hosts ZynAddSubFX's real Master/Part/ADnote audio engine in a
 * browser-friendly wrapper. Native bank UI, recorder, and XML persistence
 * entry points are bridged by compatibility stubs; the exposed controls are
 * limited to parameters that are direct, deterministic, and covered by the
 * generic audio influence tests.
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'zynaddsubfx');
const OUT = join(ROOT, 'plugins', 'zynaddsubfx');
const GEN = join(OUT, 'generated');

const controls = [
    { symbol: 'master_volume', name: 'Master Volume', min: -18, max: 6, def: 0, unit: 'dB' },
    { symbol: 'key_shift', name: 'Key Shift', min: -12, max: 12, def: 0, integer: true },
    { symbol: 'part_volume', name: 'Part Volume', min: -18, max: 6, def: 0, unit: 'dB' },
    { symbol: 'part_pan', name: 'Part Pan', min: 0, max: 1, def: 0.5 },
    { symbol: 'velocity_sense', name: 'Velocity Sense', min: 0, max: 127, def: 64, integer: true },
    { symbol: 'voice_limit', name: 'Voice Limit', min: 1, max: 16, def: 8, integer: true },
    { symbol: 'amp_attack', name: 'Amp Attack', min: 0, max: 2, def: 0 },
    { symbol: 'amp_decay', name: 'Amp Decay', min: 0.02, max: 4, def: 0.127 },
    { symbol: 'amp_sustain', name: 'Amp Sustain', min: 0, max: 1, def: 1 },
    { symbol: 'amp_release', name: 'Amp Release', min: 0.02, max: 4, def: 0.041 },
    { symbol: 'filter_cutoff', name: 'Filter Cutoff', min: 120, max: 12000, def: 5000, unit: 'Hz' },
    { symbol: 'filter_resonance', name: 'Filter Resonance', min: 0.2, max: 12, def: 1.25 },
    {
        symbol: 'filter_type',
        name: 'Filter Type',
        min: 0,
        max: 4,
        def: 2,
        integer: true,
        scalePoints: [['LP1', 0], ['HP1', 1], ['LP2', 2], ['HP2', 3], ['BP', 4]],
    },
    { symbol: 'filter_stages', name: 'Filter Stages', min: 0, max: 4, def: 1, integer: true },
    { symbol: 'voice_volume', name: 'Voice Volume', min: 0, max: 1, def: 1 },
    { symbol: 'voice_detune', name: 'Voice Detune', min: -1, max: 1, def: 0 },
];

if (!existsSync(join(SRC, 'src', 'Misc', 'Master.cpp'))) {
    console.error(`Source not found: ${SRC} - run fetch-sources.js --only zynaddsubfx first`);
    process.exit(1);
}
if (!existsSync(join(SRC, 'rtosc', 'src', 'rtosc.c'))) {
    console.error(`RTOSC submodule not found in ${SRC} - run git submodule update --init in zynaddsubfx`);
    process.exit(1);
}

mkdirSync(GEN, { recursive: true });
writeFileSync(join(OUT, 'controls.json'), `${JSON.stringify(controls, null, 2)}\n`);
writeFileSync(join(OUT, 'zynaddsubfx_plugin.cpp'), pluginSource());
writeFileSync(join(GEN, 'zyn-version.h'), zynVersionHeader());
writeFileSync(join(GEN, 'zyn-config.h'), zynConfigHeader());
writeFileSync(join(GEN, 'mxml.h'), mxmlHeader());
writeFileSync(join(GEN, 'zyn_compat.cpp'), compatibilitySource());
registerPlugin();

console.log('ZynAddSubFX setup complete');
console.log('Run: node scripts/build-instruments.js --only zynaddsubfx');

function pluginSource() {
    return `#include "Misc/Config.h"
#include "Misc/Master.h"
#include "Misc/Part.h"
#include "Params/ADnoteParameters.h"
#include "Params/EnvelopeParams.h"
#include "Params/FilterParams.h"
#include "globals.h"

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>

extern "C" {

constexpr int kBlockSize = 128;
constexpr int kControlCount = ${controls.length};

enum ControlIndex {
${controls.map((port, index) => `    CTRL_${constantName(port.symbol)} = ${index}`).join(',\n')}
};

static const float kControlMin[kControlCount] = {
${controls.map(port => `    ${floatLiteral(port.min)}`).join(',\n')}
};

static const float kControlMax[kControlCount] = {
${controls.map(port => `    ${floatLiteral(port.max)}`).join(',\n')}
};

static const float kControlDefault[kControlCount] = {
${controls.map(port => `    ${floatLiteral(port.def)}`).join(',\n')}
};

static zyn::SYNTH_T* g_synth = nullptr;
static zyn::Config* g_config = nullptr;
static zyn::Master* g_master = nullptr;
static unsigned g_sample_rate = 44100;
static float g_values[kControlCount] = {};
static float g_out_l[kBlockSize] = {};
static float g_out_r[kBlockSize] = {};

static float clampf(float value, float min, float max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, value));
}

static zyn::Part* part0()
{
    return g_master ? g_master->part[0] : nullptr;
}

static zyn::ADnoteParameters* adpars()
{
    zyn::Part* p = part0();
    return p ? p->kit[0].adpars : nullptr;
}

static zyn::ADnoteVoiceParam* voice0()
{
    zyn::ADnoteParameters* ad = adpars();
    return ad ? &ad->VoicePar[0] : nullptr;
}

static void refresh_parameters()
{
    if (!g_master) return;
    g_master->part[0]->applyparameters();
    g_master->applyparameters();
    g_master->initialize_rt();
}

static void configure_default_patch()
{
    if (!g_master) return;
    zyn::Part* p = part0();
    zyn::ADnoteParameters* ad = adpars();
    if (!p || !ad) return;

    p->Penabled = true;
    p->Pnoteon = true;
    p->Ppolymode = true;
    p->Plegatomode = false;
    p->kit[0].Penabled = true;
    p->kit[0].Padenabled = true;
    p->kit[0].Psubenabled = false;
    p->kit[0].Ppadenabled = false;

    zyn::ADnoteVoiceParam& v = ad->VoicePar[0];
    v.Enabled = 1;
    v.Type = 0;
    v.PFilterEnabled = true;
    v.PAmpEnvelopeEnabled = true;
    v.PAAEnabled = true;
    v.volume = 1.0f;

    ad->GlobalPar.GlobalFilter->Pcategory = 0;
    ad->GlobalPar.GlobalFilter->Ptype = 2;
    ad->GlobalPar.GlobalFilter->Pstages = 1;
    ad->GlobalPar.GlobalFilter->basefreq = 5000.0f;
    ad->GlobalPar.GlobalFilter->baseq = 1.25f;
    ad->GlobalPar.PBandwidth = 64;

    ad->GlobalPar.AmpEnvelope->A_dt = 0.0f;
    ad->GlobalPar.AmpEnvelope->D_dt = 0.127f;
    ad->GlobalPar.AmpEnvelope->PS_val = 127;
    ad->GlobalPar.AmpEnvelope->R_dt = 0.041f;

    g_master->setPkeyshift(64);
    g_master->Volume = 0.0f;
    p->setVolumedB(0.0f);
    p->setPpanning(64);
    p->Pvelsns = 64;
    p->setvoicelimit(8);
}

static void apply_control(int index)
{
    if (!g_master || index < 0 || index >= kControlCount) return;
    zyn::Part* p = part0();
    zyn::ADnoteParameters* ad = adpars();
    zyn::ADnoteVoiceParam* v = voice0();
    if (!p || !ad || !v) return;

    float value = g_values[index];
    switch (index) {
    case CTRL_MASTER_VOLUME:
        g_master->Volume = clampf(value, -40.0f, 13.333f);
        break;
    case CTRL_KEY_SHIFT:
        g_master->setPkeyshift(static_cast<char>(64 + static_cast<int>(std::lrint(clampf(value, -24.0f, 24.0f)))));
        break;
    case CTRL_PART_VOLUME:
        p->setVolumedB(clampf(value, -40.0f, 13.333f));
        break;
    case CTRL_PART_PAN:
        p->setPpanning(static_cast<char>(std::lrint(clampf(value, 0.0f, 1.0f) * 127.0f)));
        break;
    case CTRL_VELOCITY_SENSE:
        p->Pvelsns = static_cast<unsigned char>(std::lrint(clampf(value, 0.0f, 127.0f)));
        break;
    case CTRL_VOICE_LIMIT:
        p->setvoicelimit(static_cast<unsigned char>(std::max(1, static_cast<int>(std::lrint(value)))));
        p->setkeylimit(static_cast<unsigned char>(std::max(1, static_cast<int>(std::lrint(value)))));
        break;
    case CTRL_AMP_ATTACK:
        ad->GlobalPar.AmpEnvelope->A_dt = clampf(value, 0.0f, 8.0f);
        break;
    case CTRL_AMP_DECAY:
        ad->GlobalPar.AmpEnvelope->D_dt = clampf(value, 0.0f, 8.0f);
        break;
    case CTRL_AMP_SUSTAIN:
        ad->GlobalPar.AmpEnvelope->PS_val = static_cast<unsigned char>(std::lrint(clampf(value, 0.0f, 1.0f) * 127.0f));
        break;
    case CTRL_AMP_RELEASE:
        ad->GlobalPar.AmpEnvelope->R_dt = clampf(value, 0.0f, 8.0f);
        break;
    case CTRL_FILTER_CUTOFF:
        ad->GlobalPar.GlobalFilter->basefreq = clampf(value, 31.25f, 20000.0f);
        v->PFilterEnabled = true;
        break;
    case CTRL_FILTER_RESONANCE:
        ad->GlobalPar.GlobalFilter->baseq = clampf(value, 0.1f, 1000.0f);
        v->PFilterEnabled = true;
        break;
    case CTRL_FILTER_TYPE:
        ad->GlobalPar.GlobalFilter->Pcategory = 0;
        ad->GlobalPar.GlobalFilter->Ptype = static_cast<unsigned char>(std::max(0, static_cast<int>(std::lrint(value))));
        v->PFilterEnabled = true;
        break;
    case CTRL_FILTER_STAGES:
        ad->GlobalPar.GlobalFilter->Pstages = static_cast<unsigned char>(std::max(0, static_cast<int>(std::lrint(value))));
        v->PFilterEnabled = true;
        break;
    case CTRL_VOICE_VOLUME:
        v->volume = clampf(value, 0.0f, 1.0f);
        break;
    case CTRL_VOICE_DETUNE:
        ad->GlobalPar.PDetune = static_cast<unsigned short>(8192 + std::lrint(clampf(value, -1.0f, 1.0f) * 4096.0f));
        break;
    }
    refresh_parameters();
}

void shim_init(int sample_rate)
{
    delete g_master;
    delete g_config;
    delete g_synth;

    g_sample_rate = sample_rate > 0 ? static_cast<unsigned>(sample_rate) : 44100;
    g_synth = new zyn::SYNTH_T();
    g_synth->samplerate = g_sample_rate;
    g_synth->buffersize = kBlockSize;
    g_synth->oscilsize = 1024;
    g_synth->alias(false);

    g_config = new zyn::Config();
    g_config->cfg.SampleRate = g_synth->samplerate;
    g_config->cfg.SoundBufferSize = g_synth->buffersize;
    g_config->cfg.OscilSize = g_synth->oscilsize;
    g_config->cfg.GzipCompression = 0;
    g_config->cfg.Interpolation = 0;
    g_config->cfg.SaveFullXml = false;
    g_config->cfg.CheckPADsynth = false;
    g_config->cfg.currentBankDir.clear();

    g_master = new zyn::Master(*g_synth, g_config);
    configure_default_patch();
    for (int i = 0; i < kControlCount; ++i) g_values[i] = kControlDefault[i];
    for (int i = 0; i < kControlCount; ++i) apply_control(i);
    std::memset(g_out_l, 0, sizeof(g_out_l));
    std::memset(g_out_r, 0, sizeof(g_out_r));
}

float* shim_output_buf_out_l() { return g_out_l; }
float* shim_output_buf_out_r() { return g_out_r; }

void shim_run(int frames)
{
    if (!g_master) shim_init(g_sample_rate);
    const int n = std::max(0, std::min(kBlockSize, frames));
    std::memset(g_out_l, 0, sizeof(g_out_l));
    std::memset(g_out_r, 0, sizeof(g_out_r));
    if (n > 0) g_master->GetAudioOutSamples(static_cast<size_t>(n), g_sample_rate, g_out_l, g_out_r);
}

void shim_midi_clear()
{
    if (g_master) g_master->ShutUp();
}

void shim_midi_note_on(int channel, int note, int velocity)
{
    if (!g_master) return;
    g_master->noteOn(static_cast<char>(std::max(0, std::min(15, channel))),
                     static_cast<zyn::note_t>(std::max(0, std::min(127, note))),
                     static_cast<char>(std::max(0, std::min(127, velocity))));
}

void shim_midi_note_off(int channel, int note)
{
    if (!g_master) return;
    g_master->noteOff(static_cast<char>(std::max(0, std::min(15, channel))),
                      static_cast<zyn::note_t>(std::max(0, std::min(127, note))));
}

void shim_midi_cc(int channel, int controller, int value)
{
    if (!g_master) return;
    g_master->setController(static_cast<char>(std::max(0, std::min(15, channel))),
                            std::max(0, std::min(127, controller)),
                            std::max(0, std::min(127, value)));
}

void shim_midi_pitch_bend(int channel, int value)
{
    if (!g_master) return;
    g_master->setController(static_cast<char>(std::max(0, std::min(15, channel))),
                            zyn::C_pitchwheel,
                            std::max(-8192, std::min(8191, value)));
}

void shim_midi_program_change(int, int) {}

${controls.map(port => `void shim_set_${port.symbol}(float value) { g_values[CTRL_${constantName(port.symbol)}] = clampf(value, kControlMin[CTRL_${constantName(port.symbol)}], kControlMax[CTRL_${constantName(port.symbol)}]); apply_control(CTRL_${constantName(port.symbol)}); }
float shim_get_${port.symbol}() { return g_values[CTRL_${constantName(port.symbol)}]; }`).join('\n\n')}

}
`;
}

function zynVersionHeader() {
    return `#ifndef ZYN_VERSION_H
#define ZYN_VERSION_H
#include <iosfwd>
namespace zyn {
class version_type {
    char version[3];
    constexpr int v_strcmp(const version_type& v2, int i) const {
        return (i == 3) ? 0 : ((version[i] == v2.version[i]) ? v_strcmp(v2, i + 1) : (version[i] - v2.version[i]));
    }
public:
    constexpr version_type(char maj, char min, char rev) : version{maj, min, rev} {}
    constexpr version_type() : version_type(3, 0, 7) {}
    void set_major(int maj) { version[0] = static_cast<char>(maj); }
    void set_minor(int min) { version[1] = static_cast<char>(min); }
    void set_revision(int rev) { version[2] = static_cast<char>(rev); }
    int get_major() const { return version[0]; }
    int get_minor() const { return version[1]; }
    int get_revision() const { return version[2]; }
    constexpr bool operator<(const version_type& other) const { return v_strcmp(other, 0) < 0; }
    constexpr bool operator>=(const version_type& other) const { return !operator<(other); }
    friend std::ostream& operator<<(std::ostream& os, const version_type& v);
};
constexpr version_type version;
}
#endif
`;
}

function zynConfigHeader() {
    return `#ifndef ZYN_CONFIG_H_IN
#define ZYN_CONFIG_H_IN
namespace zyn { constexpr const char* fusion_dir = ""; }
#endif
`;
}

function mxmlHeader() {
    return `#ifndef MXML_H
#define MXML_H
#ifdef __cplusplus
extern "C" {
#endif
#define MXML_MAJOR_VERSION 4
typedef struct _mxml_node_s mxml_node_t;
typedef struct _mxml_options_s mxml_options_t;
typedef struct _mxml_index_s mxml_index_t;
typedef int mxml_type_t;
typedef int mxml_sax_event_t;
typedef const char *(*mxml_load_cb_t)(mxml_node_t *);
typedef int (*mxml_save_cb_t)(mxml_node_t *, const char *);
typedef void (*mxml_sax_cb_t)(mxml_node_t *, mxml_sax_event_t, void *);
#define MXML_DESCEND 1
#define MXML_DESCEND_FIRST 2
#define MXML_NO_DESCEND 0
#define MXML_OPAQUE 1
#define MXML_TEXT 2
#define MXML_INTEGER 3
#define MXML_REAL 4
#define MXML_ELEMENT 5
#ifdef __cplusplus
}
#endif
#endif
`;
}

function compatibilitySource() {
    return `#include "Misc/XMLwrapper.h"
#include "Misc/Master.h"
#include "Misc/WavFile.h"
#include "Nio/Nio.h"
#include <rtosc/ports.h>
#include <algorithm>
#include <cstdlib>
#include <cstring>
#include <set>
#include <utility>

namespace zyn {
XmlNode::XmlNode(std::string name_) : name(std::move(name_)) {}
std::string &XmlNode::operator[](std::string key) {
    for (auto &attr : attrs) if (attr.name == key) return attr.value;
    attrs.push_back({key, ""});
    return attrs.back().value;
}
bool XmlNode::has(std::string key) {
    return std::any_of(attrs.begin(), attrs.end(), [&](const XmlAttr &attr) { return attr.name == key; });
}

XMLwrapper::XMLwrapper() : minimal(false), SaveFullXml(false), tree(nullptr), root(nullptr), node(nullptr), info(nullptr), _fileversion() {}
XMLwrapper::~XMLwrapper() = default;
int XMLwrapper::saveXMLfile(const std::string &, int) const { return -1; }
char *XMLwrapper::getXMLdata() const {
    const char *empty = R"xml(<!DOCTYPE ZynAddSubFX-data><ZynAddSubFX-data version-major="3" version-minor="0" version-revision="7"></ZynAddSubFX-data>)xml";
    char *out = static_cast<char *>(std::malloc(std::strlen(empty) + 1));
    std::strcpy(out, empty);
    return out;
}
void XMLwrapper::addpar(const std::string &, int) {}
void XMLwrapper::addparreal(const std::string &, float) {}
void XMLwrapper::addparbool(const std::string &, int) {}
void XMLwrapper::addparstr(const std::string &, const std::string &) {}
void XMLwrapper::beginbranch(const std::string &) {}
void XMLwrapper::beginbranch(const std::string &, int) {}
void XMLwrapper::endbranch() {}
int XMLwrapper::loadXMLfile(const std::string &) { return -1; }
bool XMLwrapper::putXMLdata(const char *) { return false; }
int XMLwrapper::enterbranch(const std::string &) { return 0; }
int XMLwrapper::enterbranch(const std::string &, int) { return 0; }
void XMLwrapper::exitbranch() {}
int XMLwrapper::getbranchid(int min, int) const { return min; }
int XMLwrapper::getpar(const std::string &, int defaultpar, int, int) const { return defaultpar; }
int XMLwrapper::getpar127(const std::string &, int defaultpar) const { return defaultpar; }
bool XMLwrapper::getparbool(const std::string &, bool defaultpar) const { return defaultpar; }
void XMLwrapper::getparstr(const std::string &, char *par, int maxstrlen) const { if (maxstrlen > 0) par[0] = 0; }
std::string XMLwrapper::getparstr(const std::string &, const std::string &defaultpar) const { return defaultpar; }
bool XMLwrapper::hasparreal(const char *) const { return false; }
float XMLwrapper::getparreal(const char *, float defaultpar) const { return defaultpar; }
float XMLwrapper::getparreal(const char *, float defaultpar, float, float) const { return defaultpar; }
void XMLwrapper::setPadSynth(bool) {}
bool XMLwrapper::hasPadSynth() const { return false; }
void XMLwrapper::add(const XmlNode &) {}
std::vector<XmlNode> XMLwrapper::getBranch() const { return {}; }

extern const rtosc::Ports preset_ports = {};
extern const rtosc::Ports real_preset_ports = {};
extern const rtosc::Ports bankPorts = {};

namespace Nio {
bool autoConnect = false;
bool pidInClientName = false;
std::string defaultSource = "null";
std::string defaultSink = "null";
void init(const SYNTH_T &, const oss_devs_t &, Master *) {}
bool start() { return true; }
void stop() {}
void setDefaultSource(std::string name) { defaultSource = name; }
void setDefaultSink(std::string name) { defaultSink = name; }
bool setSource(std::string name) { defaultSource = name; return true; }
bool setSink(std::string name) { defaultSink = name; return true; }
void setPostfix(std::string) {}
std::string getPostfix() { return ""; }
std::set<std::string> getSources() { return {"null"}; }
std::set<std::string> getSinks() { return {"null"}; }
std::string getSource() { return defaultSource; }
std::string getSink() { return defaultSink; }
void preferredSampleRate(unsigned &) {}
void masterSwap(Master *) {}
void waveNew(WavFile *) {}
void waveStart() {}
void waveStop() {}
void waveEnd() {}
void setAudioCompressor(bool) {}
bool getAudioCompressor() { return false; }
}
}
`;
}

function registerPlugin() {
    const registry = readLv2Registry(ROOT).filter(entry => entry.id !== 'zynaddsubfx');
    registry.push({
        id: 'zynaddsubfx',
        description: 'ZynAddSubFX additive/subtractive/FM synthesizer',
        category: 'LV2 Instruments',
        buildScript: 'scripts/build-zynaddsubfx.js',
        memoryGrowth: true,
    });
    writeLv2Registry(ROOT, registry);
}

function constantName(symbol) {
    return symbol.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function floatLiteral(value) {
    return `${Number(value).toPrecision(9)}f`;
}
