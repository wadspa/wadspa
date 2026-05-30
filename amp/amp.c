#include <math.h>
#include <stdlib.h>
#include "ladspa.h"

#define PORT_GAIN   0
#define PORT_INPUT  1
#define PORT_OUTPUT 2

typedef struct {
    LADSPA_Data *gain;
    LADSPA_Data *input;
    LADSPA_Data *output;
} Amp;

static LADSPA_Handle amp_instantiate(const LADSPA_Descriptor *desc, unsigned long rate) {
    return calloc(1, sizeof(Amp));
}

static void amp_connect_port(LADSPA_Handle handle, unsigned long port, LADSPA_Data *data) {
    Amp *amp = (Amp *)handle;
    switch (port) {
        case PORT_GAIN:   amp->gain   = data; break;
        case PORT_INPUT:  amp->input  = data; break;
        case PORT_OUTPUT: amp->output = data; break;
    }
}

static void amp_run(LADSPA_Handle handle, unsigned long count) {
    Amp *amp = (Amp *)handle;
    float coef = *amp->gain > -90.0f ? powf(10.0f, *amp->gain * 0.05f) : 0.0f;
    for (unsigned long i = 0; i < count; i++) {
        amp->output[i] = amp->input[i] * coef;
    }
}

static void amp_cleanup(LADSPA_Handle handle) {
    free(handle);
}

static LADSPA_PortDescriptor port_descriptors[] = {
    LADSPA_PORT_INPUT  | LADSPA_PORT_CONTROL,
    LADSPA_PORT_INPUT  | LADSPA_PORT_AUDIO,
    LADSPA_PORT_OUTPUT | LADSPA_PORT_AUDIO,
};

static const char *port_names[] = {
    "Gain (dB)",
    "Input",
    "Output",
};

static LADSPA_PortRangeHint port_hints[] = {
    { LADSPA_HINT_BOUNDED_BELOW | LADSPA_HINT_BOUNDED_ABOVE | LADSPA_HINT_DEFAULT_0, -70.0f, 70.0f },
    { 0, 0.0f, 0.0f },
    { 0, 0.0f, 0.0f },
};

static LADSPA_Descriptor descriptor = {
    .UniqueID          = 1181,
    .Label             = "amp",
    .Properties        = LADSPA_PROPERTY_HARD_RT_CAPABLE,
    .Name              = "Simple Amplifier",
    .Maker             = "wabspa",
    .Copyright         = "GPL",
    .PortCount         = 3,
    .PortDescriptors   = port_descriptors,
    .PortNames         = port_names,
    .PortRangeHints    = port_hints,
    .instantiate       = amp_instantiate,
    .connect_port      = amp_connect_port,
    .activate          = NULL,
    .run               = amp_run,
    .run_adding        = NULL,
    .set_run_adding_gain = NULL,
    .deactivate        = NULL,
    .cleanup           = amp_cleanup,
};

const LADSPA_Descriptor *ladspa_descriptor(unsigned long index) {
    return index == 0 ? &descriptor : NULL;
}
