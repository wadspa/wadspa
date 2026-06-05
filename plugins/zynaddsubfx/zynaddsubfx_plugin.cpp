#include "Misc/Config.h"
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
constexpr int kControlCount = 16;

enum ControlIndex {
    CTRL_MASTER_VOLUME = 0,
    CTRL_KEY_SHIFT = 1,
    CTRL_PART_VOLUME = 2,
    CTRL_PART_PAN = 3,
    CTRL_VELOCITY_SENSE = 4,
    CTRL_VOICE_LIMIT = 5,
    CTRL_AMP_ATTACK = 6,
    CTRL_AMP_DECAY = 7,
    CTRL_AMP_SUSTAIN = 8,
    CTRL_AMP_RELEASE = 9,
    CTRL_FILTER_CUTOFF = 10,
    CTRL_FILTER_RESONANCE = 11,
    CTRL_FILTER_TYPE = 12,
    CTRL_FILTER_STAGES = 13,
    CTRL_VOICE_VOLUME = 14,
    CTRL_VOICE_DETUNE = 15
};

static const float kControlMin[kControlCount] = {
    -18.0000000f,
    -12.0000000f,
    -18.0000000f,
    0.00000000f,
    0.00000000f,
    1.00000000f,
    0.00000000f,
    0.0200000000f,
    0.00000000f,
    0.0200000000f,
    120.000000f,
    0.200000000f,
    0.00000000f,
    0.00000000f,
    0.00000000f,
    -1.00000000f
};

static const float kControlMax[kControlCount] = {
    6.00000000f,
    12.0000000f,
    6.00000000f,
    1.00000000f,
    127.000000f,
    16.0000000f,
    2.00000000f,
    4.00000000f,
    1.00000000f,
    4.00000000f,
    12000.0000f,
    12.0000000f,
    4.00000000f,
    4.00000000f,
    1.00000000f,
    1.00000000f
};

static const float kControlDefault[kControlCount] = {
    0.00000000f,
    0.00000000f,
    0.00000000f,
    0.500000000f,
    64.0000000f,
    8.00000000f,
    0.00000000f,
    0.127000000f,
    1.00000000f,
    0.0410000000f,
    5000.00000f,
    1.25000000f,
    2.00000000f,
    1.00000000f,
    1.00000000f,
    0.00000000f
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

void shim_set_master_volume(float value) { g_values[CTRL_MASTER_VOLUME] = clampf(value, kControlMin[CTRL_MASTER_VOLUME], kControlMax[CTRL_MASTER_VOLUME]); apply_control(CTRL_MASTER_VOLUME); }
float shim_get_master_volume() { return g_values[CTRL_MASTER_VOLUME]; }

void shim_set_key_shift(float value) { g_values[CTRL_KEY_SHIFT] = clampf(value, kControlMin[CTRL_KEY_SHIFT], kControlMax[CTRL_KEY_SHIFT]); apply_control(CTRL_KEY_SHIFT); }
float shim_get_key_shift() { return g_values[CTRL_KEY_SHIFT]; }

void shim_set_part_volume(float value) { g_values[CTRL_PART_VOLUME] = clampf(value, kControlMin[CTRL_PART_VOLUME], kControlMax[CTRL_PART_VOLUME]); apply_control(CTRL_PART_VOLUME); }
float shim_get_part_volume() { return g_values[CTRL_PART_VOLUME]; }

void shim_set_part_pan(float value) { g_values[CTRL_PART_PAN] = clampf(value, kControlMin[CTRL_PART_PAN], kControlMax[CTRL_PART_PAN]); apply_control(CTRL_PART_PAN); }
float shim_get_part_pan() { return g_values[CTRL_PART_PAN]; }

void shim_set_velocity_sense(float value) { g_values[CTRL_VELOCITY_SENSE] = clampf(value, kControlMin[CTRL_VELOCITY_SENSE], kControlMax[CTRL_VELOCITY_SENSE]); apply_control(CTRL_VELOCITY_SENSE); }
float shim_get_velocity_sense() { return g_values[CTRL_VELOCITY_SENSE]; }

void shim_set_voice_limit(float value) { g_values[CTRL_VOICE_LIMIT] = clampf(value, kControlMin[CTRL_VOICE_LIMIT], kControlMax[CTRL_VOICE_LIMIT]); apply_control(CTRL_VOICE_LIMIT); }
float shim_get_voice_limit() { return g_values[CTRL_VOICE_LIMIT]; }

void shim_set_amp_attack(float value) { g_values[CTRL_AMP_ATTACK] = clampf(value, kControlMin[CTRL_AMP_ATTACK], kControlMax[CTRL_AMP_ATTACK]); apply_control(CTRL_AMP_ATTACK); }
float shim_get_amp_attack() { return g_values[CTRL_AMP_ATTACK]; }

void shim_set_amp_decay(float value) { g_values[CTRL_AMP_DECAY] = clampf(value, kControlMin[CTRL_AMP_DECAY], kControlMax[CTRL_AMP_DECAY]); apply_control(CTRL_AMP_DECAY); }
float shim_get_amp_decay() { return g_values[CTRL_AMP_DECAY]; }

void shim_set_amp_sustain(float value) { g_values[CTRL_AMP_SUSTAIN] = clampf(value, kControlMin[CTRL_AMP_SUSTAIN], kControlMax[CTRL_AMP_SUSTAIN]); apply_control(CTRL_AMP_SUSTAIN); }
float shim_get_amp_sustain() { return g_values[CTRL_AMP_SUSTAIN]; }

void shim_set_amp_release(float value) { g_values[CTRL_AMP_RELEASE] = clampf(value, kControlMin[CTRL_AMP_RELEASE], kControlMax[CTRL_AMP_RELEASE]); apply_control(CTRL_AMP_RELEASE); }
float shim_get_amp_release() { return g_values[CTRL_AMP_RELEASE]; }

void shim_set_filter_cutoff(float value) { g_values[CTRL_FILTER_CUTOFF] = clampf(value, kControlMin[CTRL_FILTER_CUTOFF], kControlMax[CTRL_FILTER_CUTOFF]); apply_control(CTRL_FILTER_CUTOFF); }
float shim_get_filter_cutoff() { return g_values[CTRL_FILTER_CUTOFF]; }

void shim_set_filter_resonance(float value) { g_values[CTRL_FILTER_RESONANCE] = clampf(value, kControlMin[CTRL_FILTER_RESONANCE], kControlMax[CTRL_FILTER_RESONANCE]); apply_control(CTRL_FILTER_RESONANCE); }
float shim_get_filter_resonance() { return g_values[CTRL_FILTER_RESONANCE]; }

void shim_set_filter_type(float value) { g_values[CTRL_FILTER_TYPE] = clampf(value, kControlMin[CTRL_FILTER_TYPE], kControlMax[CTRL_FILTER_TYPE]); apply_control(CTRL_FILTER_TYPE); }
float shim_get_filter_type() { return g_values[CTRL_FILTER_TYPE]; }

void shim_set_filter_stages(float value) { g_values[CTRL_FILTER_STAGES] = clampf(value, kControlMin[CTRL_FILTER_STAGES], kControlMax[CTRL_FILTER_STAGES]); apply_control(CTRL_FILTER_STAGES); }
float shim_get_filter_stages() { return g_values[CTRL_FILTER_STAGES]; }

void shim_set_voice_volume(float value) { g_values[CTRL_VOICE_VOLUME] = clampf(value, kControlMin[CTRL_VOICE_VOLUME], kControlMax[CTRL_VOICE_VOLUME]); apply_control(CTRL_VOICE_VOLUME); }
float shim_get_voice_volume() { return g_values[CTRL_VOICE_VOLUME]; }

void shim_set_voice_detune(float value) { g_values[CTRL_VOICE_DETUNE] = clampf(value, kControlMin[CTRL_VOICE_DETUNE], kControlMax[CTRL_VOICE_DETUNE]); apply_control(CTRL_VOICE_DETUNE); }
float shim_get_voice_detune() { return g_values[CTRL_VOICE_DETUNE]; }

}
