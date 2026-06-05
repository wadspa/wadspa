#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <vector>

#include "lv2/core/lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/atom/util.h"
#include "lv2/midi/midi.h"
#include "lv2/urid/urid.h"

#include "plugin/PluginVL1.h"

#define VL1_URI "https://polyvalens.com/plugins/VL1"

enum PortIndex {
    PORT_MIDI_IN = 0,
    PORT_OUT_L,
    PORT_OUT_R,
    PORT_MODE,
    PORT_VOLUME,
    PORT_BALANCE,
    PORT_OCTAVE,
    PORT_TUNE,
    PORT_SOUND,
    PORT_ATTACK,
    PORT_DECAY,
    PORT_SUSTAIN_LEVEL,
    PORT_SUSTAIN_TIME,
    PORT_RELEASE,
    PORT_VIBRATO,
    PORT_TREMOLO,
    PORT_TEMPO,
};

class HostedVL1 final : public PluginVL1 {
public:
    void setSampleRateForHost(double sampleRate)
    {
        sampleRate_ = sampleRate;
        sampleRateChanged(sampleRate);
    }

    void setParameterForHost(uint32_t index, float value)
    {
        setParameterValue(index, value);
    }

    void activateForHost()
    {
        activate();
    }

    void runForHost(float** outputs, uint32_t frames, const std::vector<MidiEvent>& events)
    {
        run(nullptr, outputs, frames, events.data(), static_cast<uint32_t>(events.size()));
    }
};

struct VL1LV2 {
    const LV2_Atom_Sequence* midi_in = nullptr;
    float* out_l = nullptr;
    float* out_r = nullptr;
    const float* controls[14] = {};
    float last_controls[14] = {};
    bool have_last_controls = false;
    LV2_URID midi_event = 0;
    HostedVL1* synth = nullptr;
};

static float port_value(const float* port, float fallback)
{
    return port ? *port : fallback;
}

static float clampf_local(float value, float min, float max)
{
    return std::max(min, std::min(max, value));
}

static void apply_controls(VL1LV2* self, bool force)
{
    static const float defaults[14] = {
        0.0f, 80.0f, 50.0f, 1.0f, 50.0f, 0.0f, 0.0f,
        4.0f, 5.0f, 3.0f, 2.0f, 0.0f, 0.0f, 4.0f,
    };
    static const float mins[14] = {
        0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f,
        0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, -9.0f,
    };
    static const float maxs[14] = {
        3.0f, 100.0f, 100.0f, 2.0f, 100.0f, 9.0f, 9.0f,
        9.0f, 9.0f, 9.0f, 9.0f, 9.0f, 9.0f, 9.0f,
    };

    for (uint32_t i = 0; i < 14; ++i) {
        float value = clampf_local(port_value(self->controls[i], defaults[i]), mins[i], maxs[i]);
        if (!force
            && self->have_last_controls
            && std::fabs(value - self->last_controls[i]) <= 1.0e-6f) {
            continue;
        }
        self->last_controls[i] = value;
        self->synth->setParameterForHost(i, value);
    }
    self->have_last_controls = true;
}

static LV2_Handle instantiate(const LV2_Descriptor*, double sample_rate, const char*, const LV2_Feature* const* features)
{
    VL1LV2* self = new VL1LV2();
    self->synth = new HostedVL1();
    self->synth->setSampleRateForHost(sample_rate);

    for (int i = 0; features && features[i]; ++i) {
        if (std::strcmp(features[i]->URI, LV2_URID__map) == 0) {
            LV2_URID_Map* map = static_cast<LV2_URID_Map*>(features[i]->data);
            self->midi_event = map->map(map->handle, LV2_MIDI__MidiEvent);
            break;
        }
    }

    return self;
}

static void connect_port(LV2_Handle instance, uint32_t port, void* data)
{
    VL1LV2* self = static_cast<VL1LV2*>(instance);
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
        if (port >= PORT_MODE && port <= PORT_TEMPO) {
            self->controls[port - PORT_MODE] = static_cast<const float*>(data);
        }
        break;
    }
}

static void activate(LV2_Handle instance)
{
    VL1LV2* self = static_cast<VL1LV2*>(instance);
    apply_controls(self, true);
    self->synth->activateForHost();
}

static void run(LV2_Handle instance, uint32_t n_samples)
{
    VL1LV2* self = static_cast<VL1LV2*>(instance);
    if (!self->out_l || !self->out_r) return;

    apply_controls(self, false);

    std::vector<MidiEvent> events;
    if (self->midi_in && self->midi_event) {
        LV2_ATOM_SEQUENCE_FOREACH(self->midi_in, event) {
            if (event->body.type != self->midi_event) continue;
            const uint8_t* data = static_cast<const uint8_t*>(LV2_ATOM_BODY(&event->body));
            MidiEvent midi = {};
            midi.frame = event->time.frames < n_samples ? event->time.frames : n_samples - 1;
            midi.size = std::min<uint32_t>(event->body.size, 4);
            std::memcpy(midi.data, data, midi.size);
            events.push_back(midi);
        }
    }

    float* outputs[2] = { self->out_l, self->out_r };
    self->synth->runForHost(outputs, n_samples, events);
}

static void cleanup(LV2_Handle instance)
{
    VL1LV2* self = static_cast<VL1LV2*>(instance);
    delete self->synth;
    delete self;
}

static const LV2_Descriptor descriptor = {
    VL1_URI,
    instantiate,
    connect_port,
    activate,
    run,
    nullptr,
    cleanup,
    nullptr,
};

LV2_SYMBOL_EXPORT
const LV2_Descriptor* lv2_descriptor(uint32_t index)
{
    return index == 0 ? &descriptor : nullptr;
}
