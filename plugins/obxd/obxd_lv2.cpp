#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>

#include "lv2/core/lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"

#include "Engine/SynthEngine.h"

#define OBXD_URI "http://distrho.sf.net/plugins/obxd"

enum PortIndex {
    PORT_MIDI_IN = 0,
    PORT_OUT_L,
    PORT_OUT_R,
    PORT_CONTROLS,
};

enum ControlIndex {
    CTRL_VOLUME = 0,
    CTRL_VOICE_COUNT = 1,
    CTRL_TUNE = 2,
    CTRL_OCTAVE = 3,
    CTRL_UNISON = 4,
    CTRL_VOICE_DETUNE = 5,
    CTRL_OSC2_DETUNE = 6,
    CTRL_OSC1_MIX = 7,
    CTRL_OSC2_MIX = 8,
    CTRL_NOISE_MIX = 9,
    CTRL_OSC1_SAW = 10,
    CTRL_OSC1_PULSE = 11,
    CTRL_OSC2_SAW = 12,
    CTRL_OSC2_PULSE = 13,
    CTRL_PULSE_WIDTH = 14,
    CTRL_CUTOFF = 15,
    CTRL_RESONANCE = 16,
    CTRL_FILTER_ENV_AMOUNT = 17,
    CTRL_FILTER_MODE = 18,
    CTRL_BANDPASS_BLEND = 19,
    CTRL_FOUR_POLE = 20,
    CTRL_AMP_ATTACK = 21,
    CTRL_AMP_DECAY = 22,
    CTRL_AMP_SUSTAIN = 23,
    CTRL_AMP_RELEASE = 24,
    CTRL_FILTER_ATTACK = 25,
    CTRL_FILTER_DECAY = 26,
    CTRL_FILTER_SUSTAIN = 27,
    CTRL_FILTER_RELEASE = 28,
    CTRL_LFO_FREQUENCY = 29,
    CTRL_LFO_PITCH_AMOUNT = 30,
    CTRL_LFO_SINE = 31,
    CTRL_LFO_SQUARE = 32,
    CTRL_LFO_SAMPLE_HOLD = 33,
    CTRL_LFO_OSC1 = 34,
    CTRL_LFO_OSC2 = 35,
    CTRL_LFO_FILTER = 36,
    CTRL_XMOD = 37,
    CTRL_OSC2_HARD_SYNC = 38,
};

constexpr int kControlCount = 39;
static const float kDefaults[kControlCount] = {
    0.65f,
    8.0f,
    0.5f,
    0.5f,
    0.0f,
    0.2f,
    0.4f,
    1.0f,
    1.0f,
    0.0f,
    1.0f,
    1.0f,
    1.0f,
    1.0f,
    0.5f,
    0.7f,
    0.22f,
    0.35f,
    0.5f,
    0.0f,
    0.0f,
    0.05f,
    0.18f,
    0.75f,
    0.18f,
    0.03f,
    0.22f,
    0.35f,
    0.18f,
    0.35f,
    0.12f,
    1.0f,
    0.0f,
    0.0f,
    1.0f,
    0.0f,
    0.0f,
    0.0f,
    0.0f
};

struct ObxdLv2 {
    const LV2_Atom_Sequence* midi_in = nullptr;
    float* out_l = nullptr;
    float* out_r = nullptr;
    float* controls[kControlCount] = {};
    SynthEngine synth;
    LV2_URID midi_event = 0;
};

static float clampf(float value, float min, float max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, value));
}

static float control_value(const ObxdLv2* self, int index)
{
    return self->controls[index] ? *self->controls[index] : kDefaults[index];
}

static float control_unit(const ObxdLv2* self, int index)
{
    return clampf(control_value(self, index), 0.0f, 1.0f);
}

static float control_range(const ObxdLv2* self, int index, float min, float max)
{
    return clampf(control_value(self, index), min, max);
}

static void apply_controls(ObxdLv2* self)
{
    self->synth.processVolume(control_unit(self, CTRL_VOLUME));
    self->synth.setVoiceCount((control_range(self, CTRL_VOICE_COUNT, 1.0f, 8.0f) - 1.0f) / 7.0f);
    self->synth.processTune(control_unit(self, CTRL_TUNE));
    self->synth.processOctave(control_unit(self, CTRL_OCTAVE));
    self->synth.processUnison(control_unit(self, CTRL_UNISON));
    self->synth.processDetune(control_unit(self, CTRL_VOICE_DETUNE));
    self->synth.processOsc2Det(control_unit(self, CTRL_OSC2_DETUNE));
    self->synth.processOsc1Mix(control_unit(self, CTRL_OSC1_MIX));
    self->synth.processOsc2Mix(control_unit(self, CTRL_OSC2_MIX));
    self->synth.processNoiseMix(control_unit(self, CTRL_NOISE_MIX));
    self->synth.processOsc1Saw(control_unit(self, CTRL_OSC1_SAW));
    self->synth.processOsc1Pulse(control_unit(self, CTRL_OSC1_PULSE));
    self->synth.processOsc2Saw(control_unit(self, CTRL_OSC2_SAW));
    self->synth.processOsc2Pulse(control_unit(self, CTRL_OSC2_PULSE));
    self->synth.processPulseWidth(control_unit(self, CTRL_PULSE_WIDTH));
    self->synth.processCutoff(control_unit(self, CTRL_CUTOFF));
    self->synth.processResonance(control_unit(self, CTRL_RESONANCE));
    self->synth.processFilterEnvelopeAmt(control_unit(self, CTRL_FILTER_ENV_AMOUNT));
    self->synth.processMultimode(control_unit(self, CTRL_FILTER_MODE));
    self->synth.processBandpassSw(control_unit(self, CTRL_BANDPASS_BLEND));
    self->synth.processFourPole(control_unit(self, CTRL_FOUR_POLE));
    self->synth.processLoudnessEnvelopeAttack(control_range(self, CTRL_AMP_ATTACK, 0.0f, 0.65f));
    self->synth.processLoudnessEnvelopeDecay(control_range(self, CTRL_AMP_DECAY, 0.0f, 0.65f));
    self->synth.processLoudnessEnvelopeSustain(control_unit(self, CTRL_AMP_SUSTAIN));
    self->synth.processLoudnessEnvelopeRelease(control_range(self, CTRL_AMP_RELEASE, 0.0f, 0.65f));
    self->synth.processFilterEnvelopeAttack(control_range(self, CTRL_FILTER_ATTACK, 0.0f, 0.65f));
    self->synth.processFilterEnvelopeDecay(control_range(self, CTRL_FILTER_DECAY, 0.0f, 0.65f));
    self->synth.processFilterEnvelopeSustain(control_unit(self, CTRL_FILTER_SUSTAIN));
    self->synth.processFilterEnvelopeRelease(control_range(self, CTRL_FILTER_RELEASE, 0.0f, 0.65f));
    self->synth.processLfoFrequency(control_unit(self, CTRL_LFO_FREQUENCY));
    self->synth.processLfoAmt1(control_unit(self, CTRL_LFO_PITCH_AMOUNT));
    self->synth.processLfoSine(control_unit(self, CTRL_LFO_SINE));
    self->synth.processLfoSquare(control_unit(self, CTRL_LFO_SQUARE));
    self->synth.processLfoSH(control_unit(self, CTRL_LFO_SAMPLE_HOLD));
    self->synth.processLfoOsc1(control_unit(self, CTRL_LFO_OSC1));
    self->synth.processLfoOsc2(control_unit(self, CTRL_LFO_OSC2));
    self->synth.processLfoFilter(control_unit(self, CTRL_LFO_FILTER));
    self->synth.processOsc2Xmod(control_unit(self, CTRL_XMOD));
    self->synth.processOsc2HardSync(control_unit(self, CTRL_OSC2_HARD_SYNC));
}

static void note_on(ObxdLv2* self, int note, int velocity)
{
    self->synth.procNoteOn(note, clampf(static_cast<float>(velocity) / 127.0f, 0.0f, 1.0f));
}

static void note_off(ObxdLv2* self, int note)
{
    self->synth.procNoteOff(note);
}

static void all_notes_off(ObxdLv2* self)
{
    self->synth.allNotesOff();
}

static void handle_midi(ObxdLv2* self, uint32_t size, const uint8_t* data)
{
    if (size < 1) return;
    switch (data[0] & 0xf0) {
    case 0x80:
        if (size >= 3) note_off(self, data[1]);
        break;
    case 0x90:
        if (size >= 3) {
            if (data[2] > 0) note_on(self, data[1], data[2]);
            else note_off(self, data[1]);
        }
        break;
    case 0xB0:
        if (size >= 3) {
            if (data[1] == 1) self->synth.procModWheel(static_cast<float>(data[2]) / 127.0f);
            if (data[1] == 64) {
                if (data[2] >= 64) self->synth.sustainOn();
                else self->synth.sustainOff();
            }
            if (data[1] == 120 || data[1] == 123) all_notes_off(self);
        }
        break;
    case 0xE0:
        if (size >= 3) {
            const int value = (static_cast<int>(data[2]) << 7) | data[1];
            self->synth.procPitchWheel((static_cast<float>(value) - 8192.0f) / 8192.0f);
        }
        break;
    default:
        break;
    }
}

static float sanitize_audio(float value)
{
    if (!std::isfinite(value)) return 0.0f;
    return std::max(-1.25f, std::min(1.25f, value));
}

static void render_segment(ObxdLv2* self, uint32_t offset, uint32_t frames)
{
    for (uint32_t i = 0; i < frames; ++i) {
        float left = 0.0f;
        float right = 0.0f;
        self->synth.processSample(&left, &right);
        self->out_l[offset + i] = sanitize_audio(left);
        if (self->out_r) self->out_r[offset + i] = sanitize_audio(right);
    }
}

static LV2_Handle instantiate(
    const LV2_Descriptor*,
    double rate,
    const char*,
    const LV2_Feature* const* features)
{
    auto* self = new ObxdLv2();
    for (const LV2_Feature* const* feature = features; feature && *feature; ++feature) {
        if (!std::strcmp((*feature)->URI, LV2_URID__map)) {
            auto* map = static_cast<LV2_URID_Map*>((*feature)->data);
            self->midi_event = map->map(map->handle, LV2_MIDI__MidiEvent);
        }
    }
    self->synth.setSampleRate(static_cast<float>(rate));
    apply_controls(self);
    return self;
}

static void connect_port(LV2_Handle instance, uint32_t port, void* data)
{
    auto* self = static_cast<ObxdLv2*>(instance);
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
    auto* self = static_cast<ObxdLv2*>(instance);
    self->synth.allSoundOff();
    apply_controls(self);
}

static void run(LV2_Handle instance, uint32_t frames)
{
    auto* self = static_cast<ObxdLv2*>(instance);
    if (!self->out_l) return;

    apply_controls(self);
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
    all_notes_off(static_cast<ObxdLv2*>(instance));
}

static void cleanup(LV2_Handle instance)
{
    delete static_cast<ObxdLv2*>(instance);
}

static const void* extension_data(const char*)
{
    return nullptr;
}

static const LV2_Descriptor descriptor = {
    OBXD_URI,
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
