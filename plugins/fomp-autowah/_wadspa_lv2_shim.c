#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include "lv2.h"
#include "lv2/atom/atom.h"
#include "lv2/urid/urid.h"
#include "lv2/midi/midi.h"
#include <emscripten.h>

#define BLOCK_SIZE   128
#define MIDI_BUF_SIZE 4096

/* Minimal URID map — sequential integer IDs for URI strings */
static char *g_urid_uris[512];
static uint32_t g_urid_count = 0;

static LV2_URID urid_map_fn(LV2_URID_Map_Handle h, const char *uri) {
    for (uint32_t i = 0; i < g_urid_count; i++)
        if (strcmp(g_urid_uris[i], uri) == 0) return i + 1;
    g_urid_uris[g_urid_count] = strdup(uri);
    return ++g_urid_count;
}

static LV2_URID_Map   g_map_iface   = { NULL, urid_map_fn };
static LV2_Feature    g_map_feature  = { LV2_URID__map, &g_map_iface };
static const LV2_Feature *g_features[] = { &g_map_feature, NULL };

static float g_in_in[BLOCK_SIZE];
static float g_out_out[BLOCK_SIZE];
static float g_ctrl_drive = 0.0f;
static float g_ctrl_decay = 0.5f;
static float g_ctrl_range = 0.5f;
static float g_ctrl_freq = 0.5f;
static float g_ctrl_mix = 0.5f;

static const LV2_Descriptor *g_desc   = NULL;
static LV2_Handle            g_handle = NULL;

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_desc   = lv2_descriptor(0);
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_desc->connect_port(g_handle, 0, g_in_in);
    g_desc->connect_port(g_handle, 1, g_out_out);
    g_desc->connect_port(g_handle, 2, &g_ctrl_drive);
    g_desc->connect_port(g_handle, 3, &g_ctrl_decay);
    g_desc->connect_port(g_handle, 4, &g_ctrl_range);
    g_desc->connect_port(g_handle, 5, &g_ctrl_freq);
    g_desc->connect_port(g_handle, 6, &g_ctrl_mix);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf_in()  { return g_in_in; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_out() { return g_out_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_drive(float v) { g_ctrl_drive = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_drive()        { return g_ctrl_drive; }
EMSCRIPTEN_KEEPALIVE void  shim_set_decay(float v) { g_ctrl_decay = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_decay()        { return g_ctrl_decay; }
EMSCRIPTEN_KEEPALIVE void  shim_set_range(float v) { g_ctrl_range = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_range()        { return g_ctrl_range; }
EMSCRIPTEN_KEEPALIVE void  shim_set_freq(float v) { g_ctrl_freq = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_freq()        { return g_ctrl_freq; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mix(float v) { g_ctrl_mix = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mix()        { return g_ctrl_mix; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
