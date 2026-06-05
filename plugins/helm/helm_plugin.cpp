#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <map>
#include <string>

#include "helm_engine.h"
#include "helm_common.h"
#include "value.h"

extern "C" {

constexpr int kBlockSize = 128;
constexpr int kControlCount = 52;

enum ControlIndex {
    CTRL_VOLUME = 0,
    CTRL_POLYPHONY = 1,
    CTRL_LEGATO = 2,
    CTRL_PITCH_BEND_RANGE = 3,
    CTRL_AMP_ATTACK = 4,
    CTRL_AMP_DECAY = 5,
    CTRL_AMP_SUSTAIN = 6,
    CTRL_AMP_RELEASE = 7,
    CTRL_OSC_1_WAVEFORM = 8,
    CTRL_OSC_1_TRANSPOSE = 9,
    CTRL_OSC_1_TUNE = 10,
    CTRL_OSC_1_UNISON_DETUNE = 11,
    CTRL_OSC_1_UNISON_VOICES = 12,
    CTRL_OSC_1_VOLUME = 13,
    CTRL_OSC_2_WAVEFORM = 14,
    CTRL_OSC_2_TRANSPOSE = 15,
    CTRL_OSC_2_TUNE = 16,
    CTRL_OSC_2_UNISON_DETUNE = 17,
    CTRL_OSC_2_UNISON_VOICES = 18,
    CTRL_OSC_2_VOLUME = 19,
    CTRL_CROSS_MODULATION = 20,
    CTRL_OSC_FEEDBACK_AMOUNT = 21,
    CTRL_OSC_FEEDBACK_TRANSPOSE = 22,
    CTRL_OSC_FEEDBACK_TUNE = 23,
    CTRL_NOISE_VOLUME = 24,
    CTRL_SUB_VOLUME = 25,
    CTRL_SUB_OCTAVE = 26,
    CTRL_SUB_WAVEFORM = 27,
    CTRL_SUB_SHUFFLE = 28,
    CTRL_FILTER_ON = 29,
    CTRL_CUTOFF = 30,
    CTRL_RESONANCE = 31,
    CTRL_FILTER_DRIVE = 32,
    CTRL_FILTER_BLEND = 33,
    CTRL_FILTER_STYLE = 34,
    CTRL_FIL_ENV_DEPTH = 35,
    CTRL_FIL_ATTACK = 36,
    CTRL_FIL_DECAY = 37,
    CTRL_FIL_SUSTAIN = 38,
    CTRL_FIL_RELEASE = 39,
    CTRL_DISTORTION_ON = 40,
    CTRL_DISTORTION_TYPE = 41,
    CTRL_DISTORTION_DRIVE = 42,
    CTRL_DISTORTION_MIX = 43,
    CTRL_DELAY_ON = 44,
    CTRL_DELAY_DRY_WET = 45,
    CTRL_DELAY_FEEDBACK = 46,
    CTRL_DELAY_FREQUENCY = 47,
    CTRL_REVERB_ON = 48,
    CTRL_REVERB_DRY_WET = 49,
    CTRL_REVERB_FEEDBACK = 50,
    CTRL_REVERB_DAMPING = 51,
};

static const char* kControlNames[kControlCount] = {
    "volume",
    "polyphony",
    "legato",
    "pitch_bend_range",
    "amp_attack",
    "amp_decay",
    "amp_sustain",
    "amp_release",
    "osc_1_waveform",
    "osc_1_transpose",
    "osc_1_tune",
    "osc_1_unison_detune",
    "osc_1_unison_voices",
    "osc_1_volume",
    "osc_2_waveform",
    "osc_2_transpose",
    "osc_2_tune",
    "osc_2_unison_detune",
    "osc_2_unison_voices",
    "osc_2_volume",
    "cross_modulation",
    "osc_feedback_amount",
    "osc_feedback_transpose",
    "osc_feedback_tune",
    "noise_volume",
    "sub_volume",
    "sub_octave",
    "sub_waveform",
    "sub_shuffle",
    "filter_on",
    "cutoff",
    "resonance",
    "filter_drive",
    "filter_blend",
    "filter_style",
    "fil_env_depth",
    "fil_attack",
    "fil_decay",
    "fil_sustain",
    "fil_release",
    "distortion_on",
    "distortion_type",
    "distortion_drive",
    "distortion_mix",
    "delay_on",
    "delay_dry_wet",
    "delay_feedback",
    "delay_frequency",
    "reverb_on",
    "reverb_dry_wet",
    "reverb_feedback",
    "reverb_damping"
};

static const double kControlMin[kControlCount] = {
    0.00000000000000,
    1.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    -48.0000000000000,
    -1.00000000000000,
    0.00000000000000,
    1.00000000000000,
    0.00000000000000,
    0.00000000000000,
    -48.0000000000000,
    -1.00000000000000,
    0.00000000000000,
    1.00000000000000,
    0.00000000000000,
    0.00000000000000,
    -1.00000000000000,
    -24.0000000000000,
    -1.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    28.0000000000000,
    0.00000000000000,
    -12.0000000000000,
    0.00000000000000,
    0.00000000000000,
    -128.000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    -30.0000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    -1.00000000000000,
    -2.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.800000000000000,
    0.00000000000000
};

static const double kControlMax[kControlCount] = {
    1.41430000000000,
    32.0000000000000,
    1.00000000000000,
    48.0000000000000,
    4.00000000000000,
    4.00000000000000,
    1.00000000000000,
    4.00000000000000,
    10.0000000000000,
    48.0000000000000,
    1.00000000000000,
    100.000000000000,
    15.0000000000000,
    1.00000000000000,
    10.0000000000000,
    48.0000000000000,
    1.00000000000000,
    100.000000000000,
    15.0000000000000,
    1.00000000000000,
    0.500000000000000,
    1.00000000000000,
    24.0000000000000,
    1.00000000000000,
    1.00000000000000,
    1.00000000000000,
    1.00000000000000,
    10.0000000000000,
    1.00000000000000,
    1.00000000000000,
    84.0000000000000,
    1.00000000000000,
    20.0000000000000,
    2.00000000000000,
    2.00000000000000,
    128.000000000000,
    4.00000000000000,
    4.00000000000000,
    1.00000000000000,
    1.50000000000000,
    1.00000000000000,
    3.00000000000000,
    30.0000000000000,
    1.00000000000000,
    1.00000000000000,
    1.00000000000000,
    1.00000000000000,
    5.00000000000000,
    1.00000000000000,
    1.00000000000000,
    1.00000000000000,
    1.00000000000000
};

static const double kControlDefault[kControlCount] = {
    0.707106800000000,
    4.00000000000000,
    0.00000000000000,
    2.00000000000000,
    0.109545000000000,
    1.50000000000000,
    1.00000000000000,
    0.300000000000000,
    4.00000000000000,
    0.00000000000000,
    0.00000000000000,
    10.0000000000000,
    1.00000000000000,
    0.547722557500000,
    4.00000000000000,
    0.00000000000000,
    0.00000000000000,
    10.0000000000000,
    1.00000000000000,
    0.547722557500000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    0.350000000000000,
    0.00000000000000,
    2.00000000000000,
    0.00000000000000,
    0.00000000000000,
    68.0000000000000,
    0.500000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    48.0000000000000,
    0.00000000000000,
    1.50000000000000,
    0.500000000000000,
    0.800000000000000,
    0.00000000000000,
    0.00000000000000,
    0.00000000000000,
    1.00000000000000,
    0.00000000000000,
    0.500000000000000,
    0.400000000000000,
    2.00000000000000,
    0.00000000000000,
    0.500000000000000,
    0.900000000000000,
    0.500000000000000
};

static mopo::HelmEngine* g_engine = nullptr;
static mopo::control_map g_controls;
static float g_out_l[kBlockSize] = {};
static float g_out_r[kBlockSize] = {};
static int g_buffer_size = kBlockSize;

static double clampd(double value, double min, double max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, value));
}

static mopo::Value* control_for(int index)
{
    if (!g_engine || index < 0 || index >= kControlCount) return nullptr;
    auto it = g_controls.find(kControlNames[index]);
    return it == g_controls.end() ? nullptr : it->second;
}

static void set_control(int index, double value)
{
    mopo::Value* control = control_for(index);
    if (!control) return;
    control->set(clampd(value, kControlMin[index], kControlMax[index]));
}

static void set_internal_control(const char* name, double value)
{
    if (!g_engine) return;
    auto it = g_controls.find(name);
    if (it != g_controls.end() && it->second) it->second->set(value);
}

static double get_control(int index)
{
    mopo::Value* control = control_for(index);
    if (!control) return kControlDefault[index];
    return control->value();
}

void shim_init(int sample_rate)
{
    delete g_engine;
    g_engine = new mopo::HelmEngine();
    g_engine->setSampleRate(sample_rate > 0 ? sample_rate : 44100);
    g_engine->setBufferSize(kBlockSize);
    g_engine->setBpm(120.0);
    g_controls = g_engine->getControls();
    g_buffer_size = kBlockSize;

    for (int i = 0; i < kControlCount; ++i) set_control(i, kControlDefault[i]);
    set_internal_control("delay_sync", 0.0);
    std::memset(g_out_l, 0, sizeof(g_out_l));
    std::memset(g_out_r, 0, sizeof(g_out_r));
}

float* shim_output_buf_out_l()
{
    return g_out_l;
}

float* shim_output_buf_out_r()
{
    return g_out_r;
}

void shim_midi_clear()
{
    if (g_engine) g_engine->allNotesOff(0);
}

void shim_midi_note_on(int channel, int note, int velocity)
{
    if (!g_engine) return;
    const int ch = std::max(0, std::min(15, channel));
    const int midi_note = std::max(0, std::min(127, note));
    const double vel = clampd(static_cast<double>(velocity) / 127.0, 0.0, 1.0);
    g_engine->noteOn(midi_note, vel, 0, ch);
}

void shim_midi_note_off(int, int note)
{
    if (!g_engine) return;
    g_engine->noteOff(std::max(0, std::min(127, note)), 0);
}

void shim_midi_cc(int channel, int controller, int value)
{
    if (!g_engine) return;
    const int ch = std::max(1, std::min(16, channel + 1));
    const double norm = clampd(static_cast<double>(value) / 127.0, 0.0, 1.0);
    if (controller == 1) {
        g_engine->setModWheel(norm, ch);
    } else if (controller == 64) {
        if (value >= 64) g_engine->sustainOn();
        else g_engine->sustainOff();
    } else if (controller == 123) {
        g_engine->allNotesOff(0);
    }
}

void shim_midi_pitch_bend(int channel, int value)
{
    if (!g_engine) return;
    const int ch = std::max(1, std::min(16, channel + 1));
    g_engine->setPitchWheel(clampd(static_cast<double>(value) / 8192.0, -1.0, 1.0), ch);
}

void shim_midi_program_change(int, int)
{
}

void shim_run(int n)
{
    if (!g_engine) return;
    const int frames = std::max(1, std::min(kBlockSize, n));
    if (frames != g_buffer_size) {
        g_engine->setBufferSize(frames);
        g_buffer_size = frames;
    }
    g_engine->process();

    const mopo::mopo_float* left = g_engine->output(0)->buffer;
    const mopo::mopo_float* right = g_engine->output(1)->buffer;
    for (int i = 0; i < frames; ++i) {
        const double l = std::isfinite(left[i]) ? left[i] : 0.0;
        const double r = std::isfinite(right[i]) ? right[i] : 0.0;
        g_out_l[i] = static_cast<float>(clampd(l, -1.0, 1.0));
        g_out_r[i] = static_cast<float>(clampd(r, -1.0, 1.0));
    }
    for (int i = frames; i < kBlockSize; ++i) {
        g_out_l[i] = 0.0f;
        g_out_r[i] = 0.0f;
    }
}

void shim_set_volume(float value) { set_control(0, value); }
float shim_get_volume() { return static_cast<float>(get_control(0)); }

void shim_set_polyphony(float value) { set_control(1, value); }
float shim_get_polyphony() { return static_cast<float>(get_control(1)); }

void shim_set_legato(float value) { set_control(2, value); }
float shim_get_legato() { return static_cast<float>(get_control(2)); }

void shim_set_pitch_bend_range(float value) { set_control(3, value); }
float shim_get_pitch_bend_range() { return static_cast<float>(get_control(3)); }

void shim_set_amp_attack(float value) { set_control(4, value); }
float shim_get_amp_attack() { return static_cast<float>(get_control(4)); }

void shim_set_amp_decay(float value) { set_control(5, value); }
float shim_get_amp_decay() { return static_cast<float>(get_control(5)); }

void shim_set_amp_sustain(float value) { set_control(6, value); }
float shim_get_amp_sustain() { return static_cast<float>(get_control(6)); }

void shim_set_amp_release(float value) { set_control(7, value); }
float shim_get_amp_release() { return static_cast<float>(get_control(7)); }

void shim_set_osc_1_waveform(float value) { set_control(8, value); }
float shim_get_osc_1_waveform() { return static_cast<float>(get_control(8)); }

void shim_set_osc_1_transpose(float value) { set_control(9, value); }
float shim_get_osc_1_transpose() { return static_cast<float>(get_control(9)); }

void shim_set_osc_1_tune(float value) { set_control(10, value); }
float shim_get_osc_1_tune() { return static_cast<float>(get_control(10)); }

void shim_set_osc_1_unison_detune(float value) { set_control(11, value); }
float shim_get_osc_1_unison_detune() { return static_cast<float>(get_control(11)); }

void shim_set_osc_1_unison_voices(float value) { set_control(12, value); }
float shim_get_osc_1_unison_voices() { return static_cast<float>(get_control(12)); }

void shim_set_osc_1_volume(float value) { set_control(13, value); }
float shim_get_osc_1_volume() { return static_cast<float>(get_control(13)); }

void shim_set_osc_2_waveform(float value) { set_control(14, value); }
float shim_get_osc_2_waveform() { return static_cast<float>(get_control(14)); }

void shim_set_osc_2_transpose(float value) { set_control(15, value); }
float shim_get_osc_2_transpose() { return static_cast<float>(get_control(15)); }

void shim_set_osc_2_tune(float value) { set_control(16, value); }
float shim_get_osc_2_tune() { return static_cast<float>(get_control(16)); }

void shim_set_osc_2_unison_detune(float value) { set_control(17, value); }
float shim_get_osc_2_unison_detune() { return static_cast<float>(get_control(17)); }

void shim_set_osc_2_unison_voices(float value) { set_control(18, value); }
float shim_get_osc_2_unison_voices() { return static_cast<float>(get_control(18)); }

void shim_set_osc_2_volume(float value) { set_control(19, value); }
float shim_get_osc_2_volume() { return static_cast<float>(get_control(19)); }

void shim_set_cross_modulation(float value) { set_control(20, value); }
float shim_get_cross_modulation() { return static_cast<float>(get_control(20)); }

void shim_set_osc_feedback_amount(float value) { set_control(21, value); }
float shim_get_osc_feedback_amount() { return static_cast<float>(get_control(21)); }

void shim_set_osc_feedback_transpose(float value) { set_control(22, value); }
float shim_get_osc_feedback_transpose() { return static_cast<float>(get_control(22)); }

void shim_set_osc_feedback_tune(float value) { set_control(23, value); }
float shim_get_osc_feedback_tune() { return static_cast<float>(get_control(23)); }

void shim_set_noise_volume(float value) { set_control(24, value); }
float shim_get_noise_volume() { return static_cast<float>(get_control(24)); }

void shim_set_sub_volume(float value) { set_control(25, value); }
float shim_get_sub_volume() { return static_cast<float>(get_control(25)); }

void shim_set_sub_octave(float value) { set_control(26, value); }
float shim_get_sub_octave() { return static_cast<float>(get_control(26)); }

void shim_set_sub_waveform(float value) { set_control(27, value); }
float shim_get_sub_waveform() { return static_cast<float>(get_control(27)); }

void shim_set_sub_shuffle(float value) { set_control(28, value); }
float shim_get_sub_shuffle() { return static_cast<float>(get_control(28)); }

void shim_set_filter_on(float value) { set_control(29, value); }
float shim_get_filter_on() { return static_cast<float>(get_control(29)); }

void shim_set_cutoff(float value) { set_control(30, value); }
float shim_get_cutoff() { return static_cast<float>(get_control(30)); }

void shim_set_resonance(float value) { set_control(31, value); }
float shim_get_resonance() { return static_cast<float>(get_control(31)); }

void shim_set_filter_drive(float value) { set_control(32, value); }
float shim_get_filter_drive() { return static_cast<float>(get_control(32)); }

void shim_set_filter_blend(float value) { set_control(33, value); }
float shim_get_filter_blend() { return static_cast<float>(get_control(33)); }

void shim_set_filter_style(float value) { set_control(34, value); }
float shim_get_filter_style() { return static_cast<float>(get_control(34)); }

void shim_set_fil_env_depth(float value) { set_control(35, value); }
float shim_get_fil_env_depth() { return static_cast<float>(get_control(35)); }

void shim_set_fil_attack(float value) { set_control(36, value); }
float shim_get_fil_attack() { return static_cast<float>(get_control(36)); }

void shim_set_fil_decay(float value) { set_control(37, value); }
float shim_get_fil_decay() { return static_cast<float>(get_control(37)); }

void shim_set_fil_sustain(float value) { set_control(38, value); }
float shim_get_fil_sustain() { return static_cast<float>(get_control(38)); }

void shim_set_fil_release(float value) { set_control(39, value); }
float shim_get_fil_release() { return static_cast<float>(get_control(39)); }

void shim_set_distortion_on(float value) { set_control(40, value); }
float shim_get_distortion_on() { return static_cast<float>(get_control(40)); }

void shim_set_distortion_type(float value) { set_control(41, value); }
float shim_get_distortion_type() { return static_cast<float>(get_control(41)); }

void shim_set_distortion_drive(float value) { set_control(42, value); }
float shim_get_distortion_drive() { return static_cast<float>(get_control(42)); }

void shim_set_distortion_mix(float value) { set_control(43, value); }
float shim_get_distortion_mix() { return static_cast<float>(get_control(43)); }

void shim_set_delay_on(float value) { set_control(44, value); }
float shim_get_delay_on() { return static_cast<float>(get_control(44)); }

void shim_set_delay_dry_wet(float value) { set_control(45, value); }
float shim_get_delay_dry_wet() { return static_cast<float>(get_control(45)); }

void shim_set_delay_feedback(float value) { set_control(46, value); }
float shim_get_delay_feedback() { return static_cast<float>(get_control(46)); }

void shim_set_delay_frequency(float value) { set_control(47, value); }
float shim_get_delay_frequency() { return static_cast<float>(get_control(47)); }

void shim_set_reverb_on(float value) { set_control(48, value); }
float shim_get_reverb_on() { return static_cast<float>(get_control(48)); }

void shim_set_reverb_dry_wet(float value) { set_control(49, value); }
float shim_get_reverb_dry_wet() { return static_cast<float>(get_control(49)); }

void shim_set_reverb_feedback(float value) { set_control(50, value); }
float shim_get_reverb_feedback() { return static_cast<float>(get_control(50)); }

void shim_set_reverb_damping(float value) { set_control(51, value); }
float shim_get_reverb_damping() { return static_cast<float>(get_control(51)); }

} // extern "C"
