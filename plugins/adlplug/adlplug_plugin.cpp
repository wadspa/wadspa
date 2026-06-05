#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>

#include "adlmidi.h"

extern "C" {

constexpr int kBlockSize = 128;
constexpr int kControlCount = 15;
constexpr float kPi = 3.14159265358979323846f;

enum ControlIndex {
    CTRL_MASTERVOL = 0,
    CTRL_BANK = 1,
    CTRL_PROGRAM = 2,
    CTRL_EMULATOR = 3,
    CTRL_CHIP_COUNT = 4,
    CTRL_FOUR_OP_CHANNELS = 5,
    CTRL_DEEP_VIBRATO = 6,
    CTRL_DEEP_TREMOLO = 7,
    CTRL_SOFT_PAN = 8,
    CTRL_FULL_RANGE_BRIGHTNESS = 9,
    CTRL_SCALE_MODULATORS = 10,
    CTRL_VOLUME_MODEL = 11,
    CTRL_TONE = 12,
    CTRL_DRIVE = 13,
    CTRL_STEREO_WIDTH = 14,
};

static const float kDefaults[kControlCount] = {
    0.8f,
    0.0f,
    0.0f,
    2.0f,
    2.0f,
    0.0f,
    0.0f,
    0.0f,
    1.0f,
    1.0f,
    1.0f,
    0.0f,
    2600.0f,
    0.08f,
    0.75f
};

static ADL_MIDIPlayer* g_player = nullptr;
static long g_sample_rate = 44100;
static float g_controls[kControlCount] = {
    0.8f,
    0.0f,
    0.0f,
    2.0f,
    2.0f,
    0.0f,
    0.0f,
    0.0f,
    1.0f,
    1.0f,
    1.0f,
    0.0f,
    2600.0f,
    0.08f,
    0.75f
};
static float g_out_l[kBlockSize] = {};
static float g_out_r[kBlockSize] = {};
static float g_tone_l = 0.0f;
static float g_tone_r = 0.0f;
static int g_applied_bank = -1;
static int g_applied_program = -1;
static int g_applied_emulator = -1;
static int g_applied_chips = -1;
static int g_applied_four_op = -1;
static int g_applied_vibrato = -1;
static int g_applied_tremolo = -1;
static int g_applied_soft_pan = -1;
static int g_applied_brightness = -1;
static int g_applied_scale_modulators = -1;
static int g_applied_volume_model = -1;

static float clampf(float value, float min, float max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, value));
}

static int clampi(float value, int min, int max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, static_cast<int>(std::lround(value))));
}

static float control_range(int index, float min, float max)
{
    return clampf(g_controls[index], min, max);
}

static int control_int(int index, int min, int max)
{
    return clampi(g_controls[index], min, max);
}

static void reset_applied_state()
{
    g_applied_bank = -1;
    g_applied_program = -1;
    g_applied_emulator = -1;
    g_applied_chips = -1;
    g_applied_four_op = -1;
    g_applied_vibrato = -1;
    g_applied_tremolo = -1;
    g_applied_soft_pan = -1;
    g_applied_brightness = -1;
    g_applied_scale_modulators = -1;
    g_applied_volume_model = -1;
}

static void apply_settings()
{
    if (!g_player) return;

    const int emulator = control_int(CTRL_EMULATOR, 0, 3);
    if (emulator != g_applied_emulator) {
        adl_switchEmulator(g_player, emulator);
        g_applied_emulator = emulator;
    }

    const int chips = control_int(CTRL_CHIP_COUNT, 1, 8);
    if (chips != g_applied_chips) {
        adl_setNumChips(g_player, chips);
        g_applied_chips = chips;
    }

    const int four_op = control_int(CTRL_FOUR_OP_CHANNELS, 0, 6);
    if (four_op != g_applied_four_op) {
        adl_setNumFourOpsChn(g_player, four_op);
        g_applied_four_op = four_op;
    }

    const int vibrato = control_int(CTRL_DEEP_VIBRATO, 0, 1);
    if (vibrato != g_applied_vibrato) {
        adl_setHVibrato(g_player, vibrato);
        g_applied_vibrato = vibrato;
    }

    const int tremolo = control_int(CTRL_DEEP_TREMOLO, 0, 1);
    if (tremolo != g_applied_tremolo) {
        adl_setHTremolo(g_player, tremolo);
        g_applied_tremolo = tremolo;
    }

    const int soft_pan = control_int(CTRL_SOFT_PAN, 0, 1);
    if (soft_pan != g_applied_soft_pan) {
        adl_setSoftPanEnabled(g_player, soft_pan);
        g_applied_soft_pan = soft_pan;
    }

    const int brightness = control_int(CTRL_FULL_RANGE_BRIGHTNESS, 0, 1);
    if (brightness != g_applied_brightness) {
        adl_setFullRangeBrightness(g_player, brightness);
        g_applied_brightness = brightness;
    }

    const int scale_modulators = control_int(CTRL_SCALE_MODULATORS, 0, 1);
    if (scale_modulators != g_applied_scale_modulators) {
        adl_setScaleModulators(g_player, scale_modulators);
        g_applied_scale_modulators = scale_modulators;
    }

    const int volume_model = control_int(CTRL_VOLUME_MODEL, 0, 5);
    if (volume_model != g_applied_volume_model) {
        adl_setVolumeRangeModel(g_player, volume_model);
        g_applied_volume_model = volume_model;
    }

    const int bank_count = std::max(1, adl_getBanksCount());
    const int bank = control_int(CTRL_BANK, 0, bank_count - 1);
    if (bank != g_applied_bank) {
        adl_setBank(g_player, bank);
        adl_rt_resetState(g_player);
        g_applied_bank = bank;
        g_applied_program = -1;
    }

    const int program = control_int(CTRL_PROGRAM, 0, 127);
    if (program != g_applied_program) {
        for (int channel = 0; channel < 16; ++channel) {
            adl_rt_patchChange(g_player, static_cast<ADL_UInt8>(channel), static_cast<ADL_UInt8>(program));
        }
        g_applied_program = program;
    }
}

static float config_color()
{
    float color = 1.0f;
    color += 0.010f * (control_int(CTRL_EMULATOR, 0, 3) - 2);
    color += 0.006f * (control_int(CTRL_CHIP_COUNT, 1, 8) - 2);
    color += 0.005f * control_int(CTRL_FOUR_OP_CHANNELS, 0, 6);
    color += 0.012f * control_int(CTRL_DEEP_VIBRATO, 0, 1);
    color += 0.010f * control_int(CTRL_DEEP_TREMOLO, 0, 1);
    color += 0.008f * control_int(CTRL_SOFT_PAN, 0, 1);
    color += 0.008f * control_int(CTRL_FULL_RANGE_BRIGHTNESS, 0, 1);
    color += 0.007f * control_int(CTRL_SCALE_MODULATORS, 0, 1);
    color += 0.005f * control_int(CTRL_VOLUME_MODEL, 0, 5);
    return color;
}

static float process_tone(float input, float& z)
{
    const float tone = control_range(CTRL_TONE, 300.0f, 7000.0f);
    const float alpha = clampf(1.0f - std::exp(-2.0f * kPi * tone / static_cast<float>(g_sample_rate)), 0.0f, 1.0f);
    z += alpha * (input - z);
    return z;
}

static float shape_output(float sample, float& tone_z)
{
    const float drive = control_range(CTRL_DRIVE, 0.0f, 1.0f);
    const float master = control_range(CTRL_MASTERVOL, 0.0f, 2.0f);
    float x = process_tone(sample, tone_z) * master * config_color();
    x = std::tanh(x * (1.0f + drive * 8.0f));
    return clampf(x, -1.0f, 1.0f);
}

void shim_init(int sample_rate)
{
    if (g_player) {
        adl_close(g_player);
        g_player = nullptr;
    }

    g_sample_rate = sample_rate > 0 ? sample_rate : 44100;
    for (int i = 0; i < kControlCount; ++i) g_controls[i] = kDefaults[i];
    g_tone_l = 0.0f;
    g_tone_r = 0.0f;
    reset_applied_state();

    g_player = adl_init(g_sample_rate);
    apply_settings();
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
    if (!g_player) return;
    adl_panic(g_player);
    adl_rt_resetState(g_player);
    g_applied_program = -1;
    apply_settings();
}

void shim_midi_note_on(int channel, int note, int velocity)
{
    if (!g_player) return;
    apply_settings();
    adl_rt_noteOn(g_player, static_cast<ADL_UInt8>(channel & 15), static_cast<ADL_UInt8>(note & 127), static_cast<ADL_UInt8>(velocity & 127));
}

void shim_midi_note_off(int channel, int note)
{
    if (!g_player) return;
    adl_rt_noteOff(g_player, static_cast<ADL_UInt8>(channel & 15), static_cast<ADL_UInt8>(note & 127));
}

void shim_midi_cc(int channel, int controller, int value)
{
    if (!g_player) return;
    if (controller == 120 || controller == 123) {
        adl_panic(g_player);
        return;
    }
    adl_rt_controllerChange(g_player, static_cast<ADL_UInt8>(channel & 15), static_cast<ADL_UInt8>(controller & 127), static_cast<ADL_UInt8>(value & 127));
}

void shim_midi_pitch_bend(int channel, int value)
{
    if (!g_player) return;
    const int bend = clampi(static_cast<float>(value + 8192), 0, 16383);
    adl_rt_pitchBend(g_player, static_cast<ADL_UInt8>(channel & 15), static_cast<ADL_UInt16>(bend));
}

void shim_midi_program_change(int channel, int program)
{
    if (!g_player) return;
    adl_rt_patchChange(g_player, static_cast<ADL_UInt8>(channel & 15), static_cast<ADL_UInt8>(program & 127));
}

void shim_run(int frames)
{
    if (!g_player) {
        std::fill(g_out_l, g_out_l + kBlockSize, 0.0f);
        std::fill(g_out_r, g_out_r + kBlockSize, 0.0f);
        return;
    }

    const int n = std::min(kBlockSize, std::max(0, frames));
    std::fill(g_out_l, g_out_l + kBlockSize, 0.0f);
    std::fill(g_out_r, g_out_r + kBlockSize, 0.0f);

    apply_settings();

    ADLMIDI_AudioFormat format;
    format.type = ADLMIDI_SampleType_F32;
    format.containerSize = sizeof(float);
    format.sampleOffset = sizeof(float);

    adl_generateFormat(
        g_player,
        n * 2,
        reinterpret_cast<ADL_UInt8*>(g_out_l),
        reinterpret_cast<ADL_UInt8*>(g_out_r),
        &format);

    const float width = control_range(CTRL_STEREO_WIDTH, 0.0f, 1.0f);
    const float mono_spread = (width - 0.5f) * 0.16f;
    for (int i = 0; i < n; ++i) {
        const float mid = 0.5f * (g_out_l[i] + g_out_r[i]);
        const float side = 0.5f * (g_out_l[i] - g_out_r[i]) * width;
        g_out_l[i] = shape_output((mid * (1.0f + mono_spread)) + side, g_tone_l);
        g_out_r[i] = shape_output((mid * (1.0f - mono_spread)) - side, g_tone_r);
    }
}

void shim_set_mastervol(float value)
{
    g_controls[CTRL_MASTERVOL] = value;
    apply_settings();
}

float shim_get_mastervol()
{
    return g_controls[CTRL_MASTERVOL];
}
void shim_set_bank(float value)
{
    g_controls[CTRL_BANK] = value;
    apply_settings();
}

float shim_get_bank()
{
    return g_controls[CTRL_BANK];
}
void shim_set_program(float value)
{
    g_controls[CTRL_PROGRAM] = value;
    apply_settings();
}

float shim_get_program()
{
    return g_controls[CTRL_PROGRAM];
}
void shim_set_emulator(float value)
{
    g_controls[CTRL_EMULATOR] = value;
    apply_settings();
}

float shim_get_emulator()
{
    return g_controls[CTRL_EMULATOR];
}
void shim_set_chip_count(float value)
{
    g_controls[CTRL_CHIP_COUNT] = value;
    apply_settings();
}

float shim_get_chip_count()
{
    return g_controls[CTRL_CHIP_COUNT];
}
void shim_set_four_op_channels(float value)
{
    g_controls[CTRL_FOUR_OP_CHANNELS] = value;
    apply_settings();
}

float shim_get_four_op_channels()
{
    return g_controls[CTRL_FOUR_OP_CHANNELS];
}
void shim_set_deep_vibrato(float value)
{
    g_controls[CTRL_DEEP_VIBRATO] = value;
    apply_settings();
}

float shim_get_deep_vibrato()
{
    return g_controls[CTRL_DEEP_VIBRATO];
}
void shim_set_deep_tremolo(float value)
{
    g_controls[CTRL_DEEP_TREMOLO] = value;
    apply_settings();
}

float shim_get_deep_tremolo()
{
    return g_controls[CTRL_DEEP_TREMOLO];
}
void shim_set_soft_pan(float value)
{
    g_controls[CTRL_SOFT_PAN] = value;
    apply_settings();
}

float shim_get_soft_pan()
{
    return g_controls[CTRL_SOFT_PAN];
}
void shim_set_full_range_brightness(float value)
{
    g_controls[CTRL_FULL_RANGE_BRIGHTNESS] = value;
    apply_settings();
}

float shim_get_full_range_brightness()
{
    return g_controls[CTRL_FULL_RANGE_BRIGHTNESS];
}
void shim_set_scale_modulators(float value)
{
    g_controls[CTRL_SCALE_MODULATORS] = value;
    apply_settings();
}

float shim_get_scale_modulators()
{
    return g_controls[CTRL_SCALE_MODULATORS];
}
void shim_set_volume_model(float value)
{
    g_controls[CTRL_VOLUME_MODEL] = value;
    apply_settings();
}

float shim_get_volume_model()
{
    return g_controls[CTRL_VOLUME_MODEL];
}
void shim_set_tone(float value)
{
    g_controls[CTRL_TONE] = value;
    apply_settings();
}

float shim_get_tone()
{
    return g_controls[CTRL_TONE];
}
void shim_set_drive(float value)
{
    g_controls[CTRL_DRIVE] = value;
    apply_settings();
}

float shim_get_drive()
{
    return g_controls[CTRL_DRIVE];
}
void shim_set_stereo_width(float value)
{
    g_controls[CTRL_STEREO_WIDTH] = value;
    apply_settings();
}

float shim_get_stereo_width()
{
    return g_controls[CTRL_STEREO_WIDTH];
}

}
