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
static float g_ctrl_word_len = 16.0f;
static float g_ctrl_dither = 0.0f;
static float g_ctrl_dith_amp = 2.0f;
static float g_ctrl_dc_trim = 0.0f;
static float g_ctrl_zoom = 0.0f;

static const LV2_Descriptor *g_desc   = NULL;
static LV2_Handle            g_handle = NULL;

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_desc   = lv2_descriptor(0);
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_desc->connect_port(g_handle, 0, &g_ctrl_word_len);
    g_desc->connect_port(g_handle, 1, &g_ctrl_dither);
    g_desc->connect_port(g_handle, 2, &g_ctrl_dith_amp);
    g_desc->connect_port(g_handle, 3, &g_ctrl_dc_trim);
    g_desc->connect_port(g_handle, 4, &g_ctrl_zoom);
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
EMSCRIPTEN_KEEPALIVE void  shim_set_word_len(float v) { g_ctrl_word_len = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_word_len()        { return g_ctrl_word_len; }
EMSCRIPTEN_KEEPALIVE void  shim_set_dither(float v) { g_ctrl_dither = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_dither()        { return g_ctrl_dither; }
EMSCRIPTEN_KEEPALIVE void  shim_set_dith_amp(float v) { g_ctrl_dith_amp = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_dith_amp()        { return g_ctrl_dith_amp; }
EMSCRIPTEN_KEEPALIVE void  shim_set_dc_trim(float v) { g_ctrl_dc_trim = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_dc_trim()        { return g_ctrl_dc_trim; }
EMSCRIPTEN_KEEPALIVE void  shim_set_zoom(float v) { g_ctrl_zoom = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_zoom()        { return g_ctrl_zoom; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
