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
