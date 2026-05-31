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

static float g_in_left_in[BLOCK_SIZE];
static float g_in_right_in[BLOCK_SIZE];
static float g_out_left_out[BLOCK_SIZE];
static float g_out_right_out[BLOCK_SIZE];
static float g_ctrl_tracking = 0.0f;
static float g_ctrl_pitch = 0.5f;
static float g_ctrl_breath = 0.2f;
static float g_ctrl_s_thresh = 0.5f;
static float g_ctrl_max_freq = 0.35f;

static const LV2_Descriptor *g_desc   = NULL;
static LV2_Handle            g_handle = NULL;

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_desc   = lv2_descriptor(0);
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_desc->connect_port(g_handle, 0, &g_ctrl_tracking);
    g_desc->connect_port(g_handle, 1, &g_ctrl_pitch);
    g_desc->connect_port(g_handle, 2, &g_ctrl_breath);
    g_desc->connect_port(g_handle, 3, &g_ctrl_s_thresh);
    g_desc->connect_port(g_handle, 4, &g_ctrl_max_freq);
    g_desc->connect_port(g_handle, 5, g_in_left_in);
    g_desc->connect_port(g_handle, 6, g_in_right_in);
    g_desc->connect_port(g_handle, 7, g_out_left_out);
    g_desc->connect_port(g_handle, 8, g_out_right_out);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf_left_in()  { return g_in_left_in; }
EMSCRIPTEN_KEEPALIVE float *shim_input_buf_right_in()  { return g_in_right_in; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_left_out() { return g_out_left_out; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_right_out() { return g_out_right_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_tracking(float v) { g_ctrl_tracking = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_tracking()        { return g_ctrl_tracking; }
EMSCRIPTEN_KEEPALIVE void  shim_set_pitch(float v) { g_ctrl_pitch = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_pitch()        { return g_ctrl_pitch; }
EMSCRIPTEN_KEEPALIVE void  shim_set_breath(float v) { g_ctrl_breath = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_breath()        { return g_ctrl_breath; }
EMSCRIPTEN_KEEPALIVE void  shim_set_s_thresh(float v) { g_ctrl_s_thresh = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_s_thresh()        { return g_ctrl_s_thresh; }
EMSCRIPTEN_KEEPALIVE void  shim_set_max_freq(float v) { g_ctrl_max_freq = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_max_freq()        { return g_ctrl_max_freq; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
