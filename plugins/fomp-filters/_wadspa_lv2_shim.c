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

#ifndef LV2_OPTIONS_H
#define LV2_OPTIONS_H
typedef enum { LV2_OPTIONS_INSTANCE=0,LV2_OPTIONS_RESOURCE,LV2_OPTIONS_BLANK,LV2_OPTIONS_PORT } LV2_Options_Context;
typedef struct { LV2_Options_Context context; uint32_t subject; LV2_URID key; uint32_t size; LV2_URID type; const void *value; } LV2_Options_Option;
#endif
#ifndef LV2_OPTIONS__options
#define LV2_OPTIONS__options "http://lv2plug.in/ns/ext/options#options"
#endif
#ifndef LV2_BUF_SIZE__nominalBlockLength
#define LV2_BUF_SIZE__nominalBlockLength "http://lv2plug.in/ns/ext/buf-size#nominalBlockLength"
#endif
#ifndef LV2_BUF_SIZE__maxBlockLength
#define LV2_BUF_SIZE__maxBlockLength "http://lv2plug.in/ns/ext/buf-size#maxBlockLength"
#endif
static LV2_URID g_opt_urid_nom;
static LV2_URID g_opt_urid_max;
static LV2_URID g_opt_urid_int;
static int32_t  g_opt_block_size = BLOCK_SIZE;
static LV2_Options_Option g_options[3];
static LV2_Feature g_opt_feature = { LV2_OPTIONS__options, g_options };
static const LV2_Feature *g_features[] = { &g_map_feature, &g_opt_feature, NULL };

static float g_in_in[BLOCK_SIZE];
static float g_out_out[BLOCK_SIZE];
static float g_ctrl_filter = 0.0f;
static float g_ctrl_gain = 0.0f;
static float g_ctrl_sec_1 = 0.0f;
static float g_ctrl_freq_1 = 200.0f;
static float g_ctrl_bw_1 = 1.0f;
static float g_ctrl_gain_1 = 0.0f;
static float g_ctrl_sec_2 = 0.0f;
static float g_ctrl_freq_2 = 400.0f;
static float g_ctrl_bw_2 = 1.0f;
static float g_ctrl_gain_2 = 0.0f;
static float g_ctrl_sec_3 = 0.0f;
static float g_ctrl_freq_3 = 1000.0f;
static float g_ctrl_bw_3 = 1.0f;
static float g_ctrl_gain_3 = 0.0f;
static float g_ctrl_sec_4 = 0.0f;
static float g_ctrl_freq_4 = 2000.0f;
static float g_ctrl_bw_4 = 1.0f;
static float g_ctrl_gain_4 = 0.0f;

static const LV2_Descriptor *g_desc   = NULL;
LV2_Handle                   g_handle = NULL;

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_opt_urid_nom = urid_map_fn(NULL, LV2_BUF_SIZE__nominalBlockLength);
    g_opt_urid_max = urid_map_fn(NULL, LV2_BUF_SIZE__maxBlockLength);
    g_opt_urid_int = urid_map_fn(NULL, "http://lv2plug.in/ns/ext/atom#Int");
    g_options[0].context=LV2_OPTIONS_INSTANCE; g_options[0].subject=0;
    g_options[0].key=g_opt_urid_nom; g_options[0].size=sizeof(int32_t);
    g_options[0].type=g_opt_urid_int; g_options[0].value=&g_opt_block_size;
    g_options[1].context=LV2_OPTIONS_INSTANCE; g_options[1].subject=0;
    g_options[1].key=g_opt_urid_max; g_options[1].size=sizeof(int32_t);
    g_options[1].type=g_opt_urid_int; g_options[1].value=&g_opt_block_size;
    g_options[2].key=0; g_options[2].value=NULL;
    { const char *_uri = "http://drobilla.net/plugins/fomp/parametric1";
      for (int _i = 0; ; _i++) {
          g_desc = lv2_descriptor(_i);
          if (!g_desc || strcmp(g_desc->URI, _uri) == 0) break;
      }
    }
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_desc->connect_port(g_handle, 0, g_in_in);
    g_desc->connect_port(g_handle, 1, g_out_out);
    g_desc->connect_port(g_handle, 2, &g_ctrl_filter);
    g_desc->connect_port(g_handle, 3, &g_ctrl_gain);
    g_desc->connect_port(g_handle, 4, &g_ctrl_sec_1);
    g_desc->connect_port(g_handle, 5, &g_ctrl_freq_1);
    g_desc->connect_port(g_handle, 6, &g_ctrl_bw_1);
    g_desc->connect_port(g_handle, 7, &g_ctrl_gain_1);
    g_desc->connect_port(g_handle, 8, &g_ctrl_sec_2);
    g_desc->connect_port(g_handle, 9, &g_ctrl_freq_2);
    g_desc->connect_port(g_handle, 10, &g_ctrl_bw_2);
    g_desc->connect_port(g_handle, 11, &g_ctrl_gain_2);
    g_desc->connect_port(g_handle, 12, &g_ctrl_sec_3);
    g_desc->connect_port(g_handle, 13, &g_ctrl_freq_3);
    g_desc->connect_port(g_handle, 14, &g_ctrl_bw_3);
    g_desc->connect_port(g_handle, 15, &g_ctrl_gain_3);
    g_desc->connect_port(g_handle, 16, &g_ctrl_sec_4);
    g_desc->connect_port(g_handle, 17, &g_ctrl_freq_4);
    g_desc->connect_port(g_handle, 18, &g_ctrl_bw_4);
    g_desc->connect_port(g_handle, 19, &g_ctrl_gain_4);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf_in()  { return g_in_in; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_out() { return g_out_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter(float v) { g_ctrl_filter = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter()        { return g_ctrl_filter; }
EMSCRIPTEN_KEEPALIVE void  shim_set_gain(float v) { g_ctrl_gain = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_gain()        { return g_ctrl_gain; }
EMSCRIPTEN_KEEPALIVE void  shim_set_sec_1(float v) { g_ctrl_sec_1 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_sec_1()        { return g_ctrl_sec_1; }
EMSCRIPTEN_KEEPALIVE void  shim_set_freq_1(float v) { g_ctrl_freq_1 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_freq_1()        { return g_ctrl_freq_1; }
EMSCRIPTEN_KEEPALIVE void  shim_set_bw_1(float v) { g_ctrl_bw_1 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_bw_1()        { return g_ctrl_bw_1; }
EMSCRIPTEN_KEEPALIVE void  shim_set_gain_1(float v) { g_ctrl_gain_1 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_gain_1()        { return g_ctrl_gain_1; }
EMSCRIPTEN_KEEPALIVE void  shim_set_sec_2(float v) { g_ctrl_sec_2 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_sec_2()        { return g_ctrl_sec_2; }
EMSCRIPTEN_KEEPALIVE void  shim_set_freq_2(float v) { g_ctrl_freq_2 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_freq_2()        { return g_ctrl_freq_2; }
EMSCRIPTEN_KEEPALIVE void  shim_set_bw_2(float v) { g_ctrl_bw_2 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_bw_2()        { return g_ctrl_bw_2; }
EMSCRIPTEN_KEEPALIVE void  shim_set_gain_2(float v) { g_ctrl_gain_2 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_gain_2()        { return g_ctrl_gain_2; }
EMSCRIPTEN_KEEPALIVE void  shim_set_sec_3(float v) { g_ctrl_sec_3 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_sec_3()        { return g_ctrl_sec_3; }
EMSCRIPTEN_KEEPALIVE void  shim_set_freq_3(float v) { g_ctrl_freq_3 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_freq_3()        { return g_ctrl_freq_3; }
EMSCRIPTEN_KEEPALIVE void  shim_set_bw_3(float v) { g_ctrl_bw_3 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_bw_3()        { return g_ctrl_bw_3; }
EMSCRIPTEN_KEEPALIVE void  shim_set_gain_3(float v) { g_ctrl_gain_3 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_gain_3()        { return g_ctrl_gain_3; }
EMSCRIPTEN_KEEPALIVE void  shim_set_sec_4(float v) { g_ctrl_sec_4 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_sec_4()        { return g_ctrl_sec_4; }
EMSCRIPTEN_KEEPALIVE void  shim_set_freq_4(float v) { g_ctrl_freq_4 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_freq_4()        { return g_ctrl_freq_4; }
EMSCRIPTEN_KEEPALIVE void  shim_set_bw_4(float v) { g_ctrl_bw_4 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_bw_4()        { return g_ctrl_bw_4; }
EMSCRIPTEN_KEEPALIVE void  shim_set_gain_4(float v) { g_ctrl_gain_4 = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_gain_4()        { return g_ctrl_gain_4; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
