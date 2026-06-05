#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>

#include "lv2/core/lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"

#include "hiopl.h"

#define JUCE_OPL_URI "https://github.com/jpcima/JuceOPL#instrument"

enum PortIndex {
    PORT_MIDI_IN = 0,
    PORT_OUT_L,
    PORT_OUT_R,
    PORT_CONTROLS,
};

constexpr int kControlCount = 18;
constexpr int kNoNote = -1;

struct JuceOpl {
    const LV2_Atom_Sequence* midi_in = nullptr;
    float* out_l = nullptr;
    float* out_r = nullptr;
    float* controls[kControlCount] = {};
    Hiopl opl;
    int active_notes[Hiopl::CHANNELS + 1] = {};
    int carrier_attenuation = 9;
    int modulator_attenuation = 26;
    int carrier_velocity_sensitivity = 0;
    int modulator_velocity_sensitivity = 0;
    int next_channel = 1;
    LV2_URID midi_event = 0;
};

static int clampi(float value, int min, int max)
{
    if (!std::isfinite(value)) return min;
    return std::max(min, std::min(max, static_cast<int>(std::lround(value))));
}

static float midi_note_hz(int note)
{
    return 440.0f * std::pow(2.0f, (static_cast<float>(note) - 69.0f) / 12.0f);
}

template <typename Fn>
static void for_channels(Fn fn)
{
    for (int ch = 1; ch <= Hiopl::CHANNELS; ++ch) fn(ch);
}

static int velocity_attenuation(int base, int mode, int velocity)
{
    if (mode == 1) return std::max(0, std::min(63, 32 - velocity / 4));
    if (mode == 2) return std::max(0, std::min(63, 63 - velocity / 2));
    return base;
}

static void apply_controls(JuceOpl* self)
{
    auto v = [&](int index, float fallback) {
        return self->controls[index] ? *self->controls[index] : fallback;
    };

    const int carrier_wave = clampi(v(0, 0), 0, 7);
    const int modulator_wave = clampi(v(1, 2), 0, 7);
    const int carrier_multiplier = clampi(v(2, 1), 0, 15);
    const int modulator_multiplier = clampi(v(3, 2), 0, 15);
    self->carrier_attenuation = clampi(v(4, 9), 0, 63);
    self->modulator_attenuation = clampi(v(5, 26), 0, 63);
    const bool carrier_tremolo = clampi(v(6, 0), 0, 1) != 0;
    const bool carrier_vibrato = clampi(v(7, 0), 0, 1) != 0;
    const bool modulator_tremolo = clampi(v(8, 0), 0, 1) != 0;
    const bool modulator_vibrato = clampi(v(9, 0), 0, 1) != 0;
    const int carrier_ksl = clampi(v(10, 0), 0, 3);
    const int modulator_ksl = clampi(v(11, 0), 0, 3);
    const bool additive = clampi(v(12, 0), 0, 1) != 0;
    const int feedback = clampi(v(13, 0), 0, 7);
    const int carrier_attack = clampi(v(14, 8), 0, 15);
    const int modulator_attack = clampi(v(15, 8), 0, 15);
    self->carrier_velocity_sensitivity = clampi(v(16, 0), 0, 2);
    self->modulator_velocity_sensitivity = clampi(v(17, 0), 0, 2);

    self->opl.TremoloDepth(true);
    self->opl.VibratoDepth(true);
    for_channels([&](int ch) {
        self->opl.SetWaveform(ch, 2, static_cast<Waveform>(carrier_wave));
        self->opl.SetWaveform(ch, 1, static_cast<Waveform>(modulator_wave));
        self->opl.SetFrequencyMultiple(ch, 2, static_cast<FreqMultiple>(carrier_multiplier));
        self->opl.SetFrequencyMultiple(ch, 1, static_cast<FreqMultiple>(modulator_multiplier));
        self->opl.SetAttenuation(ch, 2, self->carrier_attenuation);
        self->opl.SetAttenuation(ch, 1, self->modulator_attenuation);
        self->opl.EnableTremolo(ch, 2, carrier_tremolo);
        self->opl.EnableVibrato(ch, 2, carrier_vibrato);
        self->opl.EnableSustain(ch, 2, true);
        self->opl.EnableKsr(ch, 2, false);
        self->opl.EnableTremolo(ch, 1, modulator_tremolo);
        self->opl.EnableVibrato(ch, 1, modulator_vibrato);
        self->opl.EnableSustain(ch, 1, true);
        self->opl.EnableKsr(ch, 1, true);
        self->opl.SetKsl(ch, 2, carrier_ksl);
        self->opl.SetKsl(ch, 1, modulator_ksl);
        self->opl.EnableAdditiveSynthesis(ch, additive);
        self->opl.SetModulatorFeedback(ch, feedback);
        self->opl.SetEnvelopeAttack(ch, 2, carrier_attack);
        self->opl.SetEnvelopeDecay(ch, 2, 5);
        self->opl.SetEnvelopeSustain(ch, 2, 5);
        self->opl.SetEnvelopeRelease(ch, 2, 5);
        self->opl.SetEnvelopeAttack(ch, 1, modulator_attack);
        self->opl.SetEnvelopeDecay(ch, 1, 5);
        self->opl.SetEnvelopeSustain(ch, 1, 2);
        self->opl.SetEnvelopeRelease(ch, 1, 9);
    });
}

static int allocate_channel(JuceOpl* self)
{
    for (int i = 0; i < Hiopl::CHANNELS; ++i) {
        const int ch = ((self->next_channel - 1 + i) % Hiopl::CHANNELS) + 1;
        if (self->active_notes[ch] == kNoNote) {
            self->next_channel = (ch % Hiopl::CHANNELS) + 1;
            return ch;
        }
    }
    const int ch = self->next_channel;
    self->next_channel = (self->next_channel % Hiopl::CHANNELS) + 1;
    self->opl.KeyOff(ch);
    return ch;
}

static void note_on(JuceOpl* self, int note, int velocity)
{
    const int ch = allocate_channel(self);
    self->opl.SetAttenuation(ch, 2, velocity_attenuation(
        self->carrier_attenuation,
        self->carrier_velocity_sensitivity,
        velocity));
    self->opl.SetAttenuation(ch, 1, velocity_attenuation(
        self->modulator_attenuation,
        self->modulator_velocity_sensitivity,
        velocity));
    self->opl.KeyOn(ch, midi_note_hz(note));
    self->active_notes[ch] = note;
}

static void note_off(JuceOpl* self, int note)
{
    for (int ch = 1; ch <= Hiopl::CHANNELS; ++ch) {
        if (self->active_notes[ch] == note) {
            self->opl.KeyOff(ch);
            self->active_notes[ch] = kNoNote;
            return;
        }
    }
}

static void all_notes_off(JuceOpl* self)
{
    for (int ch = 1; ch <= Hiopl::CHANNELS; ++ch) {
        self->opl.KeyOff(ch);
        self->active_notes[ch] = kNoNote;
    }
}

static void handle_midi(JuceOpl* self, uint32_t size, const uint8_t* data)
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
        if (size >= 3 && (data[1] == 120 || data[1] == 123)) all_notes_off(self);
        break;
    default:
        break;
    }
}

static void render_segment(JuceOpl* self, uint32_t offset, uint32_t frames)
{
    if (!self->out_l) return;
    float buffer[512];
    uint32_t done = 0;
    while (done < frames) {
        const uint32_t count = std::min<uint32_t>(512, frames - done);
        self->opl.Generate(static_cast<int>(count), buffer);
        for (uint32_t i = 0; i < count; ++i) {
            self->out_l[offset + done + i] = buffer[i];
            if (self->out_r) self->out_r[offset + done + i] = buffer[i];
        }
        done += count;
    }
}

static LV2_Handle instantiate(
    const LV2_Descriptor*,
    double rate,
    const char*,
    const LV2_Feature* const* features)
{
    auto* self = new JuceOpl();
    for (const LV2_Feature* const* feature = features; feature && *feature; ++feature) {
        if (!std::strcmp((*feature)->URI, LV2_URID__map)) {
            auto* map = static_cast<LV2_URID_Map*>((*feature)->data);
            self->midi_event = map->map(map->handle, LV2_MIDI__MidiEvent);
        }
    }
    self->opl.SetSampleRate(static_cast<int>(rate));
    for (int ch = 1; ch <= Hiopl::CHANNELS; ++ch) self->active_notes[ch] = kNoNote;
    apply_controls(self);
    return self;
}

static void connect_port(LV2_Handle instance, uint32_t port, void* data)
{
    auto* self = static_cast<JuceOpl*>(instance);
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
    auto* self = static_cast<JuceOpl*>(instance);
    all_notes_off(self);
    self->next_channel = 1;
}

static void run(LV2_Handle instance, uint32_t frames)
{
    auto* self = static_cast<JuceOpl*>(instance);
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
    all_notes_off(static_cast<JuceOpl*>(instance));
}

static void cleanup(LV2_Handle instance)
{
    delete static_cast<JuceOpl*>(instance);
}

static const void* extension_data(const char*)
{
    return nullptr;
}

static const LV2_Descriptor descriptor = {
    JUCE_OPL_URI,
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
