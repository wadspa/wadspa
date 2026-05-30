#include <math.h>
#include <stdlib.h>
#include "ladspa.h"
#include "ladspa-util.h"
#include "util/biquad.h"

#define PEAK_BW     0.3f
#define SHELF_SLOPE 1.5f

#define PORT_LO      0
#define PORT_MID     1
#define PORT_HI      2
#define PORT_INPUT   3
#define PORT_OUTPUT  4
#define PORT_LATENCY 5

typedef struct {
    LADSPA_Data *lo;
    LADSPA_Data *mid;
    LADSPA_Data *hi;
    LADSPA_Data *input;
    LADSPA_Data *output;
    LADSPA_Data *latency;
    float fs;
    biquad *filters;  /* [0]=lo, [1]=mid, [2]=hi */
} DjEq;

static LADSPA_Handle djeq_instantiate(const LADSPA_Descriptor *desc, unsigned long rate) {
    DjEq *eq = calloc(1, sizeof(DjEq));
    eq->fs      = (float)rate;
    eq->filters = calloc(3, sizeof(biquad));
    return eq;
}

static void djeq_connect_port(LADSPA_Handle handle, unsigned long port, LADSPA_Data *data) {
    DjEq *eq = (DjEq *)handle;
    switch (port) {
        case PORT_LO:      eq->lo      = data; break;
        case PORT_MID:     eq->mid     = data; break;
        case PORT_HI:      eq->hi      = data; break;
        case PORT_INPUT:   eq->input   = data; break;
        case PORT_OUTPUT:  eq->output  = data; break;
        case PORT_LATENCY: eq->latency = data; break;
    }
}

static void djeq_activate(LADSPA_Handle handle) {
    DjEq *eq = (DjEq *)handle;
    biquad_init(&eq->filters[0]);
    eq_set_params(&eq->filters[0], 100.0f,   0.0f, PEAK_BW,     eq->fs);
    biquad_init(&eq->filters[1]);
    eq_set_params(&eq->filters[1], 1000.0f,  0.0f, PEAK_BW,     eq->fs);
    biquad_init(&eq->filters[2]);
    hs_set_params(&eq->filters[2], 10000.0f, 0.0f, SHELF_SLOPE, eq->fs);
}

static void djeq_run(LADSPA_Handle handle, unsigned long count) {
    DjEq *eq = (DjEq *)handle;

    eq_set_params(&eq->filters[0], 100.0f,   *eq->lo,  PEAK_BW,     eq->fs);
    eq_set_params(&eq->filters[1], 1000.0f,  *eq->mid, PEAK_BW,     eq->fs);
    hs_set_params(&eq->filters[2], 10000.0f, *eq->hi,  SHELF_SLOPE, eq->fs);

    for (unsigned long i = 0; i < count; i++) {
        float s = biquad_run(&eq->filters[0], eq->input[i]);
        s       = biquad_run(&eq->filters[1], s);
        s       = biquad_run(&eq->filters[2], s);
        eq->output[i] = s;
    }

    if (eq->latency) *eq->latency = 3.0f;
}

static void djeq_cleanup(LADSPA_Handle handle) {
    DjEq *eq = (DjEq *)handle;
    free(eq->filters);
    free(eq);
}

static LADSPA_PortDescriptor port_descriptors[] = {
    LADSPA_PORT_INPUT  | LADSPA_PORT_CONTROL,
    LADSPA_PORT_INPUT  | LADSPA_PORT_CONTROL,
    LADSPA_PORT_INPUT  | LADSPA_PORT_CONTROL,
    LADSPA_PORT_INPUT  | LADSPA_PORT_AUDIO,
    LADSPA_PORT_OUTPUT | LADSPA_PORT_AUDIO,
    LADSPA_PORT_OUTPUT | LADSPA_PORT_CONTROL,
};

static const char *port_names[] = {
    "Lo gain (dB)",
    "Mid gain (dB)",
    "Hi gain (dB)",
    "Input",
    "Output",
    "Latency",
};

static LADSPA_PortRangeHint port_hints[] = {
    { LADSPA_HINT_BOUNDED_BELOW | LADSPA_HINT_BOUNDED_ABOVE | LADSPA_HINT_DEFAULT_0, -70.0f, 6.0f },
    { LADSPA_HINT_BOUNDED_BELOW | LADSPA_HINT_BOUNDED_ABOVE | LADSPA_HINT_DEFAULT_0, -70.0f, 6.0f },
    { LADSPA_HINT_BOUNDED_BELOW | LADSPA_HINT_BOUNDED_ABOVE | LADSPA_HINT_DEFAULT_0, -70.0f, 6.0f },
    { 0, 0.0f, 0.0f },
    { 0, 0.0f, 0.0f },
    { LADSPA_HINT_INTEGER, 0.0f, 0.0f },
};

static LADSPA_Descriptor descriptor = {
    .UniqueID          = 1907,
    .Label             = "dj_eq_mono",
    .Properties        = LADSPA_PROPERTY_HARD_RT_CAPABLE,
    .Name              = "DJ EQ (mono)",
    .Maker             = "wabspa",
    .Copyright         = "GPL",
    .PortCount         = 6,
    .PortDescriptors   = port_descriptors,
    .PortNames         = port_names,
    .PortRangeHints    = port_hints,
    .instantiate       = djeq_instantiate,
    .connect_port      = djeq_connect_port,
    .activate          = djeq_activate,
    .run               = djeq_run,
    .run_adding        = NULL,
    .set_run_adding_gain = NULL,
    .deactivate        = NULL,
    .cleanup           = djeq_cleanup,
};

const LADSPA_Descriptor *ladspa_descriptor(unsigned long index) {
    return index == 0 ? &descriptor : NULL;
}
