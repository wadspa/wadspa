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
static float g_ctrl_hat_thr = -38.0f;
static float g_ctrl_hat_rate = 130.0f;
static float g_ctrl_hat_mix = 0.0f;
static float g_ctrl_kik_thr = -20.0f;
static float g_ctrl_kik_trig = 300.0f;
static float g_ctrl_kik_mix = 0.0f;
static float g_ctrl_snr_thr = -20.0f;
static float g_ctrl_snr_trig = 527.4f;
static float g_ctrl_snr_mix = 0.0f;
static float g_ctrl_dynamics = 50.0f;
static float g_ctrl_record = 0.0f;
static float g_ctrl_thru_mix = -45.0f;

static const LV2_Descriptor *g_desc   = NULL;
static LV2_Handle            g_handle = NULL;

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_desc   = lv2_descriptor(0);
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_desc->connect_port(g_handle, 0, &g_ctrl_hat_thr);
    g_desc->connect_port(g_handle, 1, &g_ctrl_hat_rate);
    g_desc->connect_port(g_handle, 2, &g_ctrl_hat_mix);
    g_desc->connect_port(g_handle, 3, &g_ctrl_kik_thr);
    g_desc->connect_port(g_handle, 4, &g_ctrl_kik_trig);
    g_desc->connect_port(g_handle, 5, &g_ctrl_kik_mix);
    g_desc->connect_port(g_handle, 6, &g_ctrl_snr_thr);
    g_desc->connect_port(g_handle, 7, &g_ctrl_snr_trig);
    g_desc->connect_port(g_handle, 8, &g_ctrl_snr_mix);
    g_desc->connect_port(g_handle, 9, &g_ctrl_dynamics);
    g_desc->connect_port(g_handle, 10, &g_ctrl_record);
    g_desc->connect_port(g_handle, 11, &g_ctrl_thru_mix);
    g_desc->connect_port(g_handle, 12, g_in_left_in);
    g_desc->connect_port(g_handle, 13, g_in_right_in);
    g_desc->connect_port(g_handle, 14, g_out_left_out);
    g_desc->connect_port(g_handle, 15, g_out_right_out);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf_left_in()  { return g_in_left_in; }
EMSCRIPTEN_KEEPALIVE float *shim_input_buf_right_in()  { return g_in_right_in; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_left_out() { return g_out_left_out; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_right_out() { return g_out_right_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_hat_thr(float v) { g_ctrl_hat_thr = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_hat_thr()        { return g_ctrl_hat_thr; }
EMSCRIPTEN_KEEPALIVE void  shim_set_hat_rate(float v) { g_ctrl_hat_rate = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_hat_rate()        { return g_ctrl_hat_rate; }
EMSCRIPTEN_KEEPALIVE void  shim_set_hat_mix(float v) { g_ctrl_hat_mix = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_hat_mix()        { return g_ctrl_hat_mix; }
EMSCRIPTEN_KEEPALIVE void  shim_set_kik_thr(float v) { g_ctrl_kik_thr = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_kik_thr()        { return g_ctrl_kik_thr; }
EMSCRIPTEN_KEEPALIVE void  shim_set_kik_trig(float v) { g_ctrl_kik_trig = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_kik_trig()        { return g_ctrl_kik_trig; }
EMSCRIPTEN_KEEPALIVE void  shim_set_kik_mix(float v) { g_ctrl_kik_mix = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_kik_mix()        { return g_ctrl_kik_mix; }
EMSCRIPTEN_KEEPALIVE void  shim_set_snr_thr(float v) { g_ctrl_snr_thr = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_snr_thr()        { return g_ctrl_snr_thr; }
EMSCRIPTEN_KEEPALIVE void  shim_set_snr_trig(float v) { g_ctrl_snr_trig = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_snr_trig()        { return g_ctrl_snr_trig; }
EMSCRIPTEN_KEEPALIVE void  shim_set_snr_mix(float v) { g_ctrl_snr_mix = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_snr_mix()        { return g_ctrl_snr_mix; }
EMSCRIPTEN_KEEPALIVE void  shim_set_dynamics(float v) { g_ctrl_dynamics = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_dynamics()        { return g_ctrl_dynamics; }
EMSCRIPTEN_KEEPALIVE void  shim_set_record(float v) { g_ctrl_record = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_record()        { return g_ctrl_record; }
EMSCRIPTEN_KEEPALIVE void  shim_set_thru_mix(float v) { g_ctrl_thru_mix = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_thru_mix()        { return g_ctrl_thru_mix; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
