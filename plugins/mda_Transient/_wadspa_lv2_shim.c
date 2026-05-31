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
static float g_ctrl_attack = 50.0f;
static float g_ctrl_release = 50.0f;
static float g_ctrl_output = 0.0f;
static float g_ctrl_filter = 0.0f;
static float g_ctrl_att_hold = 35.0f;
static float g_ctrl_rel_hold = 35.0f;

static const LV2_Descriptor *g_desc   = NULL;
static LV2_Handle            g_handle = NULL;

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_desc   = lv2_descriptor(0);
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_desc->connect_port(g_handle, 0, &g_ctrl_attack);
    g_desc->connect_port(g_handle, 1, &g_ctrl_release);
    g_desc->connect_port(g_handle, 2, &g_ctrl_output);
    g_desc->connect_port(g_handle, 3, &g_ctrl_filter);
    g_desc->connect_port(g_handle, 4, &g_ctrl_att_hold);
    g_desc->connect_port(g_handle, 5, &g_ctrl_rel_hold);
    g_desc->connect_port(g_handle, 6, g_in_left_in);
    g_desc->connect_port(g_handle, 7, g_in_right_in);
    g_desc->connect_port(g_handle, 8, g_out_left_out);
    g_desc->connect_port(g_handle, 9, g_out_right_out);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf_left_in()  { return g_in_left_in; }
EMSCRIPTEN_KEEPALIVE float *shim_input_buf_right_in()  { return g_in_right_in; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_left_out() { return g_out_left_out; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_right_out() { return g_out_right_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_attack(float v) { g_ctrl_attack = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_attack()        { return g_ctrl_attack; }
EMSCRIPTEN_KEEPALIVE void  shim_set_release(float v) { g_ctrl_release = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_release()        { return g_ctrl_release; }
EMSCRIPTEN_KEEPALIVE void  shim_set_output(float v) { g_ctrl_output = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_output()        { return g_ctrl_output; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter(float v) { g_ctrl_filter = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter()        { return g_ctrl_filter; }
EMSCRIPTEN_KEEPALIVE void  shim_set_att_hold(float v) { g_ctrl_att_hold = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_att_hold()        { return g_ctrl_att_hold; }
EMSCRIPTEN_KEEPALIVE void  shim_set_rel_hold(float v) { g_ctrl_rel_hold = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_rel_hold()        { return g_ctrl_rel_hold; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
