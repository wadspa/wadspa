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
static float g_ctrl_freq = 33.0f;
static float g_ctrl_res = 70.0f;
static float g_ctrl_output = 0.0f;
static float g_ctrl_env_vcf = 70.0f;
static float g_ctrl_attack = 0.0f;
static float g_ctrl_release = 7250.0f;
static float g_ctrl_lfo_vcf = 40.0f;
static float g_ctrl_lfo_rate = 40.0f;
static float g_ctrl_trigger = -37.0f;
static float g_ctrl_max_freq = 75.0f;

static const LV2_Descriptor *g_desc   = NULL;
static LV2_Handle            g_handle = NULL;

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_desc   = lv2_descriptor(0);
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_desc->connect_port(g_handle, 0, &g_ctrl_freq);
    g_desc->connect_port(g_handle, 1, &g_ctrl_res);
    g_desc->connect_port(g_handle, 2, &g_ctrl_output);
    g_desc->connect_port(g_handle, 3, &g_ctrl_env_vcf);
    g_desc->connect_port(g_handle, 4, &g_ctrl_attack);
    g_desc->connect_port(g_handle, 5, &g_ctrl_release);
    g_desc->connect_port(g_handle, 6, &g_ctrl_lfo_vcf);
    g_desc->connect_port(g_handle, 7, &g_ctrl_lfo_rate);
    g_desc->connect_port(g_handle, 8, &g_ctrl_trigger);
    g_desc->connect_port(g_handle, 9, &g_ctrl_max_freq);
    g_desc->connect_port(g_handle, 10, g_in_left_in);
    g_desc->connect_port(g_handle, 11, g_in_right_in);
    g_desc->connect_port(g_handle, 12, g_out_left_out);
    g_desc->connect_port(g_handle, 13, g_out_right_out);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf_left_in()  { return g_in_left_in; }
EMSCRIPTEN_KEEPALIVE float *shim_input_buf_right_in()  { return g_in_right_in; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_left_out() { return g_out_left_out; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_right_out() { return g_out_right_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_freq(float v) { g_ctrl_freq = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_freq()        { return g_ctrl_freq; }
EMSCRIPTEN_KEEPALIVE void  shim_set_res(float v) { g_ctrl_res = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_res()        { return g_ctrl_res; }
EMSCRIPTEN_KEEPALIVE void  shim_set_output(float v) { g_ctrl_output = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_output()        { return g_ctrl_output; }
EMSCRIPTEN_KEEPALIVE void  shim_set_env_vcf(float v) { g_ctrl_env_vcf = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_env_vcf()        { return g_ctrl_env_vcf; }
EMSCRIPTEN_KEEPALIVE void  shim_set_attack(float v) { g_ctrl_attack = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_attack()        { return g_ctrl_attack; }
EMSCRIPTEN_KEEPALIVE void  shim_set_release(float v) { g_ctrl_release = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_release()        { return g_ctrl_release; }
EMSCRIPTEN_KEEPALIVE void  shim_set_lfo_vcf(float v) { g_ctrl_lfo_vcf = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_lfo_vcf()        { return g_ctrl_lfo_vcf; }
EMSCRIPTEN_KEEPALIVE void  shim_set_lfo_rate(float v) { g_ctrl_lfo_rate = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_lfo_rate()        { return g_ctrl_lfo_rate; }
EMSCRIPTEN_KEEPALIVE void  shim_set_trigger(float v) { g_ctrl_trigger = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_trigger()        { return g_ctrl_trigger; }
EMSCRIPTEN_KEEPALIVE void  shim_set_max_freq(float v) { g_ctrl_max_freq = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_max_freq()        { return g_ctrl_max_freq; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
