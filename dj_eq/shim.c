#include <stdlib.h>
#include "ladspa.h"
#include <emscripten.h>

#define BLOCK_SIZE 128

static const LADSPA_Descriptor *g_desc = NULL;
static LADSPA_Handle g_handle = NULL;

static float g_input[BLOCK_SIZE];
static float g_output[BLOCK_SIZE];
static float g_latency = 0.0f;

static float g_lo  = 0.0f;
static float g_mid = 0.0f;
static float g_hi  = 0.0f;

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_desc   = ladspa_descriptor(0);
    g_handle = g_desc->instantiate(g_desc, sample_rate);
    g_desc->connect_port(g_handle, 0, &g_lo);
    g_desc->connect_port(g_handle, 1, &g_mid);
    g_desc->connect_port(g_handle, 2, &g_hi);
    g_desc->connect_port(g_handle, 3, g_input);
    g_desc->connect_port(g_handle, 4, g_output);
    g_desc->connect_port(g_handle, 5, &g_latency);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf()  { return g_input; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf() { return g_output; }

EMSCRIPTEN_KEEPALIVE void  shim_set_lo(float db)  { g_lo  = db; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mid(float db) { g_mid = db; }
EMSCRIPTEN_KEEPALIVE void  shim_set_hi(float db)  { g_hi  = db; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
