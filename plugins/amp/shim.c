#include <stdlib.h>
#include <string.h>
#include "ladspa.h"
#include <emscripten.h>

#define BLOCK_SIZE 128

static const LADSPA_Descriptor *g_desc = NULL;
static LADSPA_Handle g_handle = NULL;

static float g_input[BLOCK_SIZE];
static float g_output[BLOCK_SIZE];
static float g_gain = 0.0f;  // dB, default 0

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_desc  = ladspa_descriptor(0);
    g_handle = g_desc->instantiate(g_desc, sample_rate);
    g_desc->connect_port(g_handle, 0, &g_gain);
    g_desc->connect_port(g_handle, 1, g_input);
    g_desc->connect_port(g_handle, 2, g_output);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf()  { return g_input; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf() { return g_output; }

EMSCRIPTEN_KEEPALIVE void shim_set_gain(float db) { g_gain = db; }
EMSCRIPTEN_KEEPALIVE float shim_get_gain()         { return g_gain; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
