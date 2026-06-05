#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cstring>

#include "lv2/core/lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"

#define CALF_MONOSYNTH_URI "http://calf.sourceforge.net/plugins/Monosynth"

enum PortIndex {
    PORT_MIDI_IN = 0,
    PORT_OUT_L,
    PORT_OUT_R,
    PORT_CONTROLS,
};

enum ControlIndex {
    CTRL_O1_WAVE = 0,
    CTRL_O2_WAVE = 1,
    CTRL_O1_PW = 2,
    CTRL_O2_PW = 3,
    CTRL_O12_DETUNE = 4,
    CTRL_O2_XPOSE = 5,
    CTRL_PHASE_MODE = 6,
    CTRL_O12_MIX = 7,
    CTRL_FILTER = 8,
    CTRL_CUTOFF = 9,
    CTRL_RES = 10,
    CTRL_FILTER_SEP = 11,
    CTRL_ENV2CUTOFF = 12,
    CTRL_ENV2RES = 13,
    CTRL_ENV2AMP = 14,
    CTRL_ADSR_A = 15,
    CTRL_ADSR_D = 16,
    CTRL_ADSR_S = 17,
    CTRL_ADSR_R = 18,
    CTRL_KEY_FOLLOW = 19,
    CTRL_PORTAMENTO = 20,
    CTRL_VEL2FILTER = 21,
    CTRL_VEL2AMP = 22,
    CTRL_MASTER = 23,
    CTRL_PBEND_RANGE = 24,
    CTRL_LFO_RATE = 25,
    CTRL_LFO_DELAY = 26,
    CTRL_LFO2FILTER = 27,
    CTRL_LFO2PITCH = 28,
    CTRL_LFO2PW = 29,
    CTRL_MWHL2LFO = 30,
    CTRL_ADSR2_CUTOFF = 31,
    CTRL_ADSR2_RES = 32,
    CTRL_ADSR2_AMP = 33,
    CTRL_ADSR2_A = 34,
    CTRL_ADSR2_D = 35,
    CTRL_ADSR2_S = 36,
    CTRL_ADSR2_R = 37,
    CTRL_O1_STRETCH = 38,
    CTRL_O1_WINDOW = 39,
    CTRL_O2_UNISON = 40,
    CTRL_O2_UNISONFRQ = 41,
    CTRL_O1_XPOSE = 42,
};

constexpr int kControlCount = 43;
constexpr int kMaxNotes = 16;
constexpr float kPi = 3.14159265358979323846f;
constexpr float kTwoPi = 6.28318530717958647692f;

static const float kDefaults[kControlCount] = {
    0.0f,
    1.0f,
    0.0f,
    0.0f,
    10.0f,
    12.0f,
    0.0f,
    0.5f,
    1.0f,
    1200.0f,
    2.2f,
    0.0f,
    1200.0f,
    0.2f,
    0.0f,
    8.0f,
    350.0f,
    0.5f,
    120.0f,
    0.35f,
    15.0f,
    0.5f,
    0.25f,
    0.7f,
    200.0f,
    5.0f,
    0.2f,
    0.0f,
    100.0f,
    0.15f,
    1.0f,
    0.0f,
    0.2f,
    1.0f,
    5.0f,
    180.0f,
    0.55f,
    80.0f,
    1.0f,
    0.0f,
    0.1f,
    2.0f,
    0.0f
};

static float clampf(float value, float min, float max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, value));
}

static float clamp01(float value)
{
    return clampf(value, 0.0f, 1.0f);
}

static int clampi(float value, int min, int max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, static_cast<int>(std::lround(value))));
}

struct Envelope {
    float value = 0.0f;
    float release_start = 0.0f;
    int stage = 0;

    void note_on()
    {
        stage = 1;
    }

    void note_off()
    {
        if (stage != 0) {
            release_start = value;
            stage = 4;
        }
    }

    void reset()
    {
        value = 0.0f;
        release_start = 0.0f;
        stage = 0;
    }

    float process(float sample_rate, float attack_ms, float decay_ms, float sustain, float release_ms)
    {
        const float attack = std::max(1.0f, attack_ms) * 0.001f;
        const float decay = std::max(1.0f, decay_ms) * 0.001f;
        const float release = std::max(1.0f, release_ms) * 0.001f;
        sustain = clamp01(sustain);

        switch (stage) {
        case 1:
            value += 1.0f / std::max(1.0f, sample_rate * attack);
            if (value >= 1.0f) {
                value = 1.0f;
                stage = 2;
            }
            break;
        case 2:
            value += (sustain - value) / std::max(1.0f, sample_rate * decay * 0.35f);
            if (std::fabs(value - sustain) < 0.0005f) {
                value = sustain;
                stage = 3;
            }
            break;
        case 3:
            value = sustain;
            break;
        case 4:
            value += (0.0f - value) / std::max(1.0f, sample_rate * release * 0.35f);
            if (value < 0.0001f) {
                value = 0.0f;
                stage = 0;
            }
            break;
        default:
            value = 0.0f;
            break;
        }

        return clamp01(value);
    }

};

struct Biquad {
    float b0 = 1.0f;
    float b1 = 0.0f;
    float b2 = 0.0f;
    float a1 = 0.0f;
    float a2 = 0.0f;
    float z1 = 0.0f;
    float z2 = 0.0f;

    void reset()
    {
        z1 = 0.0f;
        z2 = 0.0f;
    }

    void set(int type, float freq, float q, float sample_rate)
    {
        freq = clampf(freq, 20.0f, std::min(20000.0f, sample_rate * 0.45f));
        q = clampf(q, 0.35f, 12.0f);
        const float omega = kTwoPi * freq / sample_rate;
        const float sn = std::sin(omega);
        const float cs = std::cos(omega);
        const float alpha = sn / (2.0f * q);
        float rb0 = 1.0f;
        float rb1 = 0.0f;
        float rb2 = 0.0f;
        float ra0 = 1.0f;
        float ra1 = 0.0f;
        float ra2 = 0.0f;

        switch (type) {
        case 1:
            rb0 = (1.0f + cs) * 0.5f;
            rb1 = -(1.0f + cs);
            rb2 = (1.0f + cs) * 0.5f;
            ra0 = 1.0f + alpha;
            ra1 = -2.0f * cs;
            ra2 = 1.0f - alpha;
            break;
        case 2:
            rb0 = alpha;
            rb1 = 0.0f;
            rb2 = -alpha;
            ra0 = 1.0f + alpha;
            ra1 = -2.0f * cs;
            ra2 = 1.0f - alpha;
            break;
        case 3:
            rb0 = 1.0f;
            rb1 = -2.0f * cs;
            rb2 = 1.0f;
            ra0 = 1.0f + alpha;
            ra1 = -2.0f * cs;
            ra2 = 1.0f - alpha;
            break;
        default:
            rb0 = (1.0f - cs) * 0.5f;
            rb1 = 1.0f - cs;
            rb2 = (1.0f - cs) * 0.5f;
            ra0 = 1.0f + alpha;
            ra1 = -2.0f * cs;
            ra2 = 1.0f - alpha;
            break;
        }

        b0 = rb0 / ra0;
        b1 = rb1 / ra0;
        b2 = rb2 / ra0;
        a1 = ra1 / ra0;
        a2 = ra2 / ra0;
    }

    float process(float x)
    {
        const float y = b0 * x + z1;
        z1 = b1 * x - a1 * y + z2;
        z2 = b2 * x - a2 * y;
        if (!std::isfinite(z1)) z1 = 0.0f;
        if (!std::isfinite(z2)) z2 = 0.0f;
        return std::isfinite(y) ? y : 0.0f;
    }
};

struct CalfMonosynth {
    const LV2_Atom_Sequence* midi_in = nullptr;
    float* out_l = nullptr;
    float* out_r = nullptr;
    float* controls[kControlCount] = {};
    std::array<int, kMaxNotes> note_stack {};
    int note_count = 0;
    int current_note = 60;
    float velocity = 1.0f;
    float target_freq = 261.6256f;
    float current_freq = 261.6256f;
    float phase1 = 0.0f;
    float phase2 = 0.25f;
    float unison_phase = 0.0f;
    float lfo1_phase = 0.0f;
    float lfo2_phase = 0.37f;
    float lfo_clock = 0.0f;
    float modwheel = 0.0f;
    float pressure = 0.0f;
    float pitch_bend = 0.0f;
    float sample_rate = 44100.0f;
    float dc_x1 = 0.0f;
    float dc_y1 = 0.0f;
    uint32_t rng = 0x43b2a1u;
    Envelope env1;
    Envelope env2;
    Biquad filter_l1;
    Biquad filter_l2;
    Biquad filter_r1;
    Biquad filter_r2;
    LV2_URID midi_event = 0;
};

static float control_value(const CalfMonosynth* self, int index)
{
    return self->controls[index] ? *self->controls[index] : kDefaults[index];
}

static float control_range(const CalfMonosynth* self, int index, float min, float max)
{
    return clampf(control_value(self, index), min, max);
}

static float midi_note_hz(int note)
{
    return 440.0f * std::pow(2.0f, (static_cast<float>(note) - 69.0f) / 12.0f);
}

static float cents_to_ratio(float cents)
{
    return std::pow(2.0f, cents / 1200.0f);
}

static float db_to_gain(float db)
{
    return std::pow(10.0f, db / 20.0f);
}

static float random_unit(CalfMonosynth* self)
{
    self->rng = self->rng * 1664525u + 1013904223u;
    return static_cast<float>((self->rng >> 8) & 0xffffffu) / 16777215.0f;
}

static float wrap01(float value)
{
    value -= std::floor(value);
    return value;
}

static float triangle_lfo(float phase)
{
    const float p = wrap01(phase);
    return 4.0f * std::fabs(p - 0.5f) - 1.0f;
}

static float sine(float phase)
{
    return std::sin(kTwoPi * wrap01(phase));
}

static float square(float phase, float width)
{
    return wrap01(phase) < clampf(width, 0.04f, 0.96f) ? 1.0f : -1.0f;
}

static float wave_sample(int wave, float phase, float pw, float stretch, float window)
{
    const float width = clampf(0.5f + pw * 0.44f, 0.04f, 0.96f);
    const float p = wrap01(phase * clampf(stretch, 0.25f, 16.0f) + pw * 0.035f);
    float value = 0.0f;

    switch (wave & 15) {
    case 0:
        value = 2.0f * p - 1.0f;
        break;
    case 1:
        value = square(p, width);
        break;
    case 2:
        value = square(p, 0.08f + width * 0.32f);
        break;
    case 3:
        value = std::sin(kTwoPi * (p + pw * 0.02f));
        break;
    case 4:
        value = 2.0f * std::fabs(2.0f * p - 1.0f) - 1.0f;
        break;
    case 5:
        value = std::floor((2.0f * p - 1.0f) * (3.0f + 12.0f * width)) / (3.0f + 12.0f * width);
        break;
    case 6:
        value = 2.0f * std::pow(p, 0.35f + width) - 1.0f;
        break;
    case 7:
        value = square(std::pow(p, 0.45f + width), width);
        break;
    case 8:
        value = 0.65f * sine(p) + 0.24f * sine(2.0f * p + width * 0.13f) + 0.11f * sine(3.0f * p);
        break;
    case 9:
        value = 0.72f * square(p, width) + 0.28f * (2.0f * p - 1.0f);
        break;
    case 10:
        value = std::sin(kTwoPi * p + (1.0f + width * 5.0f) * std::sin(kTwoPi * p * 2.0f));
        break;
    case 11:
        value = 0.45f * square(p, width) + 0.35f * sine(2.0f * p) + 0.20f * (2.0f * p - 1.0f);
        break;
    case 12:
        value = std::sin(kTwoPi * p + 4.0f * width * std::sin(kTwoPi * p * 3.0f));
        break;
    case 13:
        value = 0.55f * sine(p) + 0.30f * sine(0.5f * p + width) + 0.15f * sine(1.5f * p);
        break;
    case 14:
        value = 2.0f * wrap01(p + 0.05f * square(p * 2.0f, width)) - 1.0f;
        break;
    default:
        value = std::sin(kTwoPi * p + std::sin(kTwoPi * (p * (1.0f + width * 4.0f))));
        break;
    }

    if (window > 0.0001f) {
        const float edge = std::min(p, 1.0f - p) * 2.0f;
        const float win = (1.0f - window) + window * clamp01(edge * edge);
        value *= win;
    }

    return clampf(value, -1.25f, 1.25f);
}

static void set_phase_mode(CalfMonosynth* self)
{
    const int mode = clampi(control_value(self, CTRL_PHASE_MODE), 0, 5);
    switch (mode) {
    case 1:
        self->phase1 = 0.0f;
        self->phase2 = 0.5f;
        break;
    case 2:
        self->phase1 = 0.0f;
        self->phase2 = 0.25f;
        break;
    case 3:
        self->phase1 = 0.25f;
        self->phase2 = 0.25f;
        break;
    case 4:
        self->phase1 = 0.25f;
        self->phase2 = 0.75f;
        break;
    case 5:
        self->phase1 = random_unit(self);
        self->phase2 = random_unit(self);
        break;
    default:
        self->phase1 = 0.0f;
        self->phase2 = 0.0f;
        break;
    }
}

static void push_note(CalfMonosynth* self, int note)
{
    for (int i = 0; i < self->note_count; ++i) {
        if (self->note_stack[i] == note) return;
    }
    if (self->note_count < kMaxNotes) {
        self->note_stack[self->note_count++] = note;
    } else {
        for (int i = 1; i < kMaxNotes; ++i) self->note_stack[i - 1] = self->note_stack[i];
        self->note_stack[kMaxNotes - 1] = note;
    }
}

static void pop_note(CalfMonosynth* self, int note)
{
    for (int i = 0; i < self->note_count; ++i) {
        if (self->note_stack[i] != note) continue;
        for (int j = i + 1; j < self->note_count; ++j) self->note_stack[j - 1] = self->note_stack[j];
        --self->note_count;
        return;
    }
}

static void trigger_note(CalfMonosynth* self, int note, int velocity)
{
    push_note(self, note);
    self->current_note = note;
    self->target_freq = midi_note_hz(note);
    if (self->env1.stage == 0 && self->env2.stage == 0) self->current_freq = self->target_freq;
    self->velocity = clampf(static_cast<float>(velocity) / 127.0f, 0.0f, 1.0f);
    self->env1.note_on();
    self->env2.note_on();
    self->lfo_clock = 0.0f;
    set_phase_mode(self);
}

static void release_note(CalfMonosynth* self, int note)
{
    pop_note(self, note);
    if (self->note_count > 0) {
        self->current_note = self->note_stack[self->note_count - 1];
        self->target_freq = midi_note_hz(self->current_note);
        return;
    }
    self->env1.note_off();
    self->env2.note_off();
}

static void all_notes_off(CalfMonosynth* self)
{
    self->note_count = 0;
    self->env1.note_off();
    self->env2.note_off();
}

static void handle_midi(CalfMonosynth* self, uint32_t size, const uint8_t* data)
{
    if (size < 1) return;
    const int channel = data[0] & 0x0f;
    (void)channel;

    switch (data[0] & 0xf0) {
    case 0x80:
        if (size >= 2) release_note(self, data[1]);
        break;
    case 0x90:
        if (size >= 3) {
            if (data[2] > 0) trigger_note(self, data[1], data[2]);
            else release_note(self, data[1]);
        }
        break;
    case 0xB0:
        if (size >= 3) {
            if (data[1] == 1) self->modwheel = clampf(static_cast<float>(data[2]) / 127.0f, 0.0f, 1.0f);
            if (data[1] == 74) {
                const float bright = static_cast<float>(data[2]) / 127.0f;
                if (self->controls[CTRL_CUTOFF]) *self->controls[CTRL_CUTOFF] = 120.0f + bright * 7000.0f;
            }
            if (data[1] == 120 || data[1] == 123) all_notes_off(self);
        }
        break;
    case 0xD0:
        if (size >= 2) self->pressure = clampf(static_cast<float>(data[1]) / 127.0f, 0.0f, 1.0f);
        break;
    case 0xE0:
        if (size >= 3) {
            const int raw = static_cast<int>(data[1]) | (static_cast<int>(data[2]) << 7);
            self->pitch_bend = clampf((static_cast<float>(raw) - 8192.0f) / 8192.0f, -1.0f, 1.0f);
        }
        break;
    default:
        break;
    }
}

static float dc_block(CalfMonosynth* self, float x)
{
    const float y = x - self->dc_x1 + 0.995f * self->dc_y1;
    self->dc_x1 = x;
    self->dc_y1 = y;
    return y;
}

static float process_filters(CalfMonosynth* self, float input, float cutoff, float resonance, float separation, bool right)
{
    const int mode = clampi(control_value(self, CTRL_FILTER), 0, 7);
    const float sep_ratio = cents_to_ratio(separation * (right ? 0.5f : -0.5f));
    const float cutoff_a = clampf(cutoff * sep_ratio, 20.0f, 16000.0f);
    const float cutoff_b = clampf(cutoff / std::max(0.0625f, sep_ratio), 20.0f, 16000.0f);
    Biquad& f1 = right ? self->filter_r1 : self->filter_l1;
    Biquad& f2 = right ? self->filter_r2 : self->filter_l2;
    const float q = clampf(resonance, 0.7f, 8.0f);

    switch (mode) {
    case 0:
        f1.set(0, cutoff, q, self->sample_rate);
        return f1.process(input) * std::min(1.0f, 1.25f / q);
    case 1:
        f1.set(0, cutoff, q, self->sample_rate);
        f2.set(0, cutoff_b, q, self->sample_rate);
        return f2.process(f1.process(input)) * std::min(0.9f, 1.2f / q);
    case 2:
        f1.set(0, cutoff_a, q, self->sample_rate);
        f2.set(0, cutoff_b, q, self->sample_rate);
        return right ? f2.process(input) : f1.process(input);
    case 3:
        f1.set(1, cutoff, q, self->sample_rate);
        return f1.process(input) * std::min(1.0f, 1.25f / q);
    case 4:
        f1.set(0, cutoff, q, self->sample_rate);
        f2.set(3, cutoff_b, q * 0.7f, self->sample_rate);
        return f2.process(f1.process(input));
    case 5:
        f1.set(1, cutoff, q, self->sample_rate);
        f2.set(3, cutoff_b, q * 0.7f, self->sample_rate);
        return f2.process(f1.process(input));
    case 6:
        f1.set(2, cutoff, q, self->sample_rate);
        return f1.process(input) * 1.8f;
    default:
        f1.set(2, cutoff_a, q, self->sample_rate);
        f2.set(2, cutoff_b, q, self->sample_rate);
        return (right ? f2.process(input) : f1.process(input)) * 1.5f;
    }
}

static float process_sample(CalfMonosynth* self, bool right)
{
    const float env1 = self->env1.process(
        self->sample_rate,
        control_range(self, CTRL_ADSR_A, 1.0f, 2000.0f),
        control_range(self, CTRL_ADSR_D, 10.0f, 2000.0f),
        control_range(self, CTRL_ADSR_S, 0.0f, 1.0f),
        control_range(self, CTRL_ADSR_R, 10.0f, 2000.0f));
    const float env2 = self->env2.process(
        self->sample_rate,
        control_range(self, CTRL_ADSR2_A, 1.0f, 2000.0f),
        control_range(self, CTRL_ADSR2_D, 10.0f, 2000.0f),
        control_range(self, CTRL_ADSR2_S, 0.0f, 1.0f),
        control_range(self, CTRL_ADSR2_R, 10.0f, 2000.0f));

    const float portamento_seconds = control_range(self, CTRL_PORTAMENTO, 1.0f, 1000.0f) * 0.001f;
    const float glide = std::exp(-1.0f / std::max(1.0f, self->sample_rate * portamento_seconds));
    self->current_freq = self->target_freq + (self->current_freq - self->target_freq) * glide;

    const float lfo_rate = control_range(self, CTRL_LFO_RATE, 0.05f, 20.0f);
    const float lfo_delay = control_range(self, CTRL_LFO_DELAY, 0.0f, 2.0f);
    const float lfo_fade = lfo_delay <= 0.0001f ? 1.0f : clamp01(self->lfo_clock / lfo_delay);
    const float wheel_scale = (1.0f - control_range(self, CTRL_MWHL2LFO, 0.0f, 1.0f))
        + control_range(self, CTRL_MWHL2LFO, 0.0f, 1.0f) * self->modwheel;
    const float lfo1 = triangle_lfo(self->lfo1_phase) * lfo_fade * std::max(0.15f, wheel_scale);
    const float lfo2 = triangle_lfo(self->lfo2_phase);

    const float pitch_ratio = cents_to_ratio(
        self->pitch_bend * control_range(self, CTRL_PBEND_RANGE, 0.0f, 2400.0f)
        + lfo1 * control_range(self, CTRL_LFO2PITCH, 0.0f, 1200.0f)
        + lfo2 * self->pressure * 120.0f);
    const float detune = cents_to_ratio(control_range(self, CTRL_O12_DETUNE, 0.0f, 100.0f));
    const float osc1_freq = self->current_freq * pitch_ratio * cents_to_ratio(100.0f * control_range(self, CTRL_O1_XPOSE, -24.0f, 24.0f));
    const float osc2_freq = self->current_freq * pitch_ratio * cents_to_ratio(100.0f * control_range(self, CTRL_O2_XPOSE, -24.0f, 24.0f)) * detune;

    const float pw_lfo = lfo1 * control_range(self, CTRL_LFO2PW, 0.0f, 1.0f);
    const float osc1 = wave_sample(
        clampi(control_value(self, CTRL_O1_WAVE), 0, 15),
        self->phase1,
        control_range(self, CTRL_O1_PW, -1.0f, 1.0f) + pw_lfo,
        control_range(self, CTRL_O1_STRETCH, 1.0f, 16.0f),
        control_range(self, CTRL_O1_WINDOW, 0.0f, 1.0f));
    float osc2 = wave_sample(
        clampi(control_value(self, CTRL_O2_WAVE), 0, 15),
        self->phase2,
        control_range(self, CTRL_O2_PW, -1.0f, 1.0f) + pw_lfo,
        1.0f,
        0.0f);

    const float unison = control_range(self, CTRL_O2_UNISON, 0.0f, 1.0f);
    if (unison > 0.0001f) {
        const float detune_phase = sine(self->unison_phase) * (0.0025f + 0.02f * unison);
        const float u1 = wave_sample(clampi(control_value(self, CTRL_O2_WAVE), 0, 15), self->phase2 + detune_phase, control_range(self, CTRL_O2_PW, -1.0f, 1.0f), 1.0f, 0.0f);
        const float u2 = wave_sample(clampi(control_value(self, CTRL_O2_WAVE), 0, 15), self->phase2 - detune_phase * 1.37f, control_range(self, CTRL_O2_PW, -1.0f, 1.0f), 1.0f, 0.0f);
        osc2 = (osc2 + unison * (u1 + u2)) / (1.0f + 2.0f * unison);
    }

    const float mix = control_range(self, CTRL_O12_MIX, 0.0f, 1.0f);
    float sample = osc1 * (1.0f - mix) + osc2 * mix;
    const float filter_spread = control_range(self, CTRL_FILTER_SEP, -2400.0f, 2400.0f) / 2400.0f;
    sample += (right ? 0.12f : -0.12f) * filter_spread * (osc2 - osc1);

    const float amp_from_env1 = control_range(self, CTRL_ENV2AMP, 0.0f, 1.0f);
    const float amp_from_env2 = control_range(self, CTRL_ADSR2_AMP, 0.0f, 1.0f);
    const float velocity_amp = 1.0f + (self->velocity - 1.0f) * control_range(self, CTRL_VEL2AMP, 0.0f, 1.0f);
    float amp = velocity_amp;
    amp *= (1.0f - amp_from_env1) + amp_from_env1 * env1;
    amp *= (1.0f - amp_from_env2) + amp_from_env2 * env2;

    const float key_follow = control_range(self, CTRL_KEY_FOLLOW, 0.0f, 2.0f);
    const float velocity_filter = 1.0f + (self->velocity - 1.0f) * control_range(self, CTRL_VEL2FILTER, 0.0f, 1.0f);
    float cutoff = control_range(self, CTRL_CUTOFF, 20.0f, 16000.0f);
    cutoff *= std::pow(std::max(0.1f, self->current_freq / 261.6256f), key_follow);
    cutoff *= velocity_filter;
    cutoff *= cents_to_ratio(
        env1 * control_range(self, CTRL_ENV2CUTOFF, -4800.0f, 4800.0f)
        + env2 * control_range(self, CTRL_ADSR2_CUTOFF, -4800.0f, 4800.0f)
        + lfo1 * control_range(self, CTRL_LFO2FILTER, -2400.0f, 2400.0f));
    cutoff = clampf(cutoff, 20.0f, 16000.0f);

    float resonance = control_range(self, CTRL_RES, 0.7f, 8.0f);
    resonance += env1 * control_range(self, CTRL_ENV2RES, 0.0f, 1.0f) * 3.0f;
    resonance += env2 * control_range(self, CTRL_ADSR2_RES, 0.0f, 1.0f) * 3.0f;
    resonance = clampf(resonance, 0.7f, 8.0f);

    const float separation = control_range(self, CTRL_FILTER_SEP, -2400.0f, 2400.0f);
    sample = process_filters(self, sample, cutoff, resonance, separation, right);

    const float master = control_range(self, CTRL_MASTER, 0.0f, 1.0f);
    sample = dc_block(self, std::tanh(sample * amp * master * 1.8f));

    if (!right) {
        self->phase1 = wrap01(self->phase1 + osc1_freq / self->sample_rate);
        self->phase2 = wrap01(self->phase2 + osc2_freq / self->sample_rate);
        self->unison_phase = wrap01(self->unison_phase + control_range(self, CTRL_O2_UNISONFRQ, 0.05f, 20.0f) / self->sample_rate);
        self->lfo1_phase = wrap01(self->lfo1_phase + lfo_rate / self->sample_rate);
        self->lfo2_phase = wrap01(self->lfo2_phase + 0.61f * lfo_rate / self->sample_rate);
        self->lfo_clock += 1.0f / self->sample_rate;
    }

    return clampf(sample, -1.0f, 1.0f);
}

static void render_segment(CalfMonosynth* self, uint32_t offset, uint32_t frames)
{
    for (uint32_t i = 0; i < frames; ++i) {
        const float left = process_sample(self, false);
        const float right = process_sample(self, true);
        self->out_l[offset + i] = left;
        if (self->out_r) self->out_r[offset + i] = right;
    }
}

static LV2_Handle instantiate(
    const LV2_Descriptor*,
    double rate,
    const char*,
    const LV2_Feature* const* features)
{
    auto* self = new CalfMonosynth();
    self->sample_rate = static_cast<float>(rate);
    self->note_stack.fill(0);
    for (const LV2_Feature* const* feature = features; feature && *feature; ++feature) {
        if (!std::strcmp((*feature)->URI, LV2_URID__map)) {
            auto* map = static_cast<LV2_URID_Map*>((*feature)->data);
            self->midi_event = map->map(map->handle, LV2_MIDI__MidiEvent);
        }
    }
    return self;
}

static void connect_port(LV2_Handle instance, uint32_t port, void* data)
{
    auto* self = static_cast<CalfMonosynth*>(instance);
    switch (port) {
    case PORT_MIDI_IN:
        self->midi_in = static_cast<const LV2_Atom_Sequence*>(data);
        break;
    case PORT_OUT_L:
        self->out_l = static_cast<float*>(data);
        break;
    case PORT_OUT_R:
        self->out_r = static_cast<float*>(data);
        break;
    default:
        if (port >= PORT_CONTROLS && port < PORT_CONTROLS + kControlCount) {
            self->controls[port - PORT_CONTROLS] = static_cast<float*>(data);
        }
        break;
    }
}

static void activate(LV2_Handle instance)
{
    auto* self = static_cast<CalfMonosynth*>(instance);
    self->note_count = 0;
    self->current_note = 60;
    self->target_freq = midi_note_hz(60);
    self->current_freq = self->target_freq;
    self->phase1 = 0.0f;
    self->phase2 = 0.25f;
    self->unison_phase = 0.0f;
    self->lfo1_phase = 0.0f;
    self->lfo2_phase = 0.37f;
    self->lfo_clock = 0.0f;
    self->modwheel = 0.0f;
    self->pressure = 0.0f;
    self->pitch_bend = 0.0f;
    self->dc_x1 = 0.0f;
    self->dc_y1 = 0.0f;
    self->rng = 0x43b2a1u;
    self->env1.reset();
    self->env2.reset();
    self->filter_l1.reset();
    self->filter_l2.reset();
    self->filter_r1.reset();
    self->filter_r2.reset();
}

static void run(LV2_Handle instance, uint32_t frames)
{
    auto* self = static_cast<CalfMonosynth*>(instance);
    if (!self->out_l) return;

    std::fill(self->out_l, self->out_l + frames, 0.0f);
    if (self->out_r) std::fill(self->out_r, self->out_r + frames, 0.0f);

    uint32_t rendered = 0;
    if (self->midi_in) {
        LV2_ATOM_SEQUENCE_FOREACH(self->midi_in, event) {
            if (event->body.type != self->midi_event) continue;
            const uint32_t frame = std::min<uint32_t>(event->time.frames, frames);
            if (frame > rendered) {
                render_segment(self, rendered, frame - rendered);
                rendered = frame;
            }
            handle_midi(self, event->body.size, static_cast<const uint8_t*>(LV2_ATOM_BODY(&event->body)));
        }
    }
    if (rendered < frames) render_segment(self, rendered, frames - rendered);
}

static void deactivate(LV2_Handle instance)
{
    all_notes_off(static_cast<CalfMonosynth*>(instance));
}

static void cleanup(LV2_Handle instance)
{
    delete static_cast<CalfMonosynth*>(instance);
}

static const void* extension_data(const char*)
{
    return nullptr;
}

static const LV2_Descriptor descriptor = {
    CALF_MONOSYNTH_URI,
    instantiate,
    connect_port,
    activate,
    run,
    deactivate,
    cleanup,
    extension_data,
};

extern "C" LV2_SYMBOL_EXPORT const LV2_Descriptor* lv2_descriptor(uint32_t index)
{
    return index == 0 ? &descriptor : nullptr;
}
