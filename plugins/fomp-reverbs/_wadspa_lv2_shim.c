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

static float g_in_in_l[BLOCK_SIZE];
static float g_in_in_r[BLOCK_SIZE];
static float g_out_out_l[BLOCK_SIZE];
static float g_out_out_r[BLOCK_SIZE];
static float g_ctrl_delay = 0.06f;
static float g_ctrl_xover = 223.607f;
static float g_ctrl_rt_low = 2.75f;
static float g_ctrl_rt_mid = 2.75f;
static float g_ctrl_damping = 6000.0f;
static float g_ctrl_f1_freq = 159.054f;
static float g_ctrl_f1_gain = 0.0f;
static float g_ctrl_f2_freq = 2514.87f;
static float g_ctrl_f2_gain = 0.0f;
static float g_ctrl_out_mix = 0.5f;

static const LV2_Descriptor *g_desc   = NULL;
static LV2_Handle            g_handle = NULL;

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
    { const char *_uri = "http://drobilla.net/plugins/fomp/reverb";
      for (int _i = 0; ; _i++) {
          g_desc = lv2_descriptor(_i);
          if (!g_desc || strcmp(g_desc->URI, _uri) == 0) break;
      }
    }
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_desc->connect_port(g_handle, 0, g_in_in_l);
    g_desc->connect_port(g_handle, 1, g_in_in_r);
    g_desc->connect_port(g_handle, 2, g_out_out_l);
    g_desc->connect_port(g_handle, 3, g_out_out_r);
    g_desc->connect_port(g_handle, 4, &g_ctrl_delay);
    g_desc->connect_port(g_handle, 5, &g_ctrl_xover);
    g_desc->connect_port(g_handle, 6, &g_ctrl_rt_low);
    g_desc->connect_port(g_handle, 7, &g_ctrl_rt_mid);
    g_desc->connect_port(g_handle, 8, &g_ctrl_damping);
    g_desc->connect_port(g_handle, 9, &g_ctrl_f1_freq);
    g_desc->connect_port(g_handle, 10, &g_ctrl_f1_gain);
    g_desc->connect_port(g_handle, 11, &g_ctrl_f2_freq);
    g_desc->connect_port(g_handle, 12, &g_ctrl_f2_gain);
    g_desc->connect_port(g_handle, 13, &g_ctrl_out_mix);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf_in_l()  { return g_in_in_l; }
EMSCRIPTEN_KEEPALIVE float *shim_input_buf_in_r()  { return g_in_in_r; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_out_l() { return g_out_out_l; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_out_r() { return g_out_out_r; }
EMSCRIPTEN_KEEPALIVE void  shim_set_delay(float v) { g_ctrl_delay = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_delay()        { return g_ctrl_delay; }
EMSCRIPTEN_KEEPALIVE void  shim_set_xover(float v) { g_ctrl_xover = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_xover()        { return g_ctrl_xover; }
EMSCRIPTEN_KEEPALIVE void  shim_set_rt_low(float v) { g_ctrl_rt_low = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_rt_low()        { return g_ctrl_rt_low; }
EMSCRIPTEN_KEEPALIVE void  shim_set_rt_mid(float v) { g_ctrl_rt_mid = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_rt_mid()        { return g_ctrl_rt_mid; }
EMSCRIPTEN_KEEPALIVE void  shim_set_damping(float v) { g_ctrl_damping = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_damping()        { return g_ctrl_damping; }
EMSCRIPTEN_KEEPALIVE void  shim_set_f1_freq(float v) { g_ctrl_f1_freq = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_f1_freq()        { return g_ctrl_f1_freq; }
EMSCRIPTEN_KEEPALIVE void  shim_set_f1_gain(float v) { g_ctrl_f1_gain = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_f1_gain()        { return g_ctrl_f1_gain; }
EMSCRIPTEN_KEEPALIVE void  shim_set_f2_freq(float v) { g_ctrl_f2_freq = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_f2_freq()        { return g_ctrl_f2_freq; }
EMSCRIPTEN_KEEPALIVE void  shim_set_f2_gain(float v) { g_ctrl_f2_gain = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_f2_gain()        { return g_ctrl_f2_gain; }
EMSCRIPTEN_KEEPALIVE void  shim_set_out_mix(float v) { g_ctrl_out_mix = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_out_mix()        { return g_ctrl_out_mix; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
