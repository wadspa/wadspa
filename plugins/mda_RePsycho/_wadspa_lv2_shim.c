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

static float g_in_left_in[BLOCK_SIZE];
static float g_in_right_in[BLOCK_SIZE];
static float g_out_left_out[BLOCK_SIZE];
static float g_out_right_out[BLOCK_SIZE];
static float g_ctrl_tune = 0.0f;
static float g_ctrl_fine = 0.0f;
static float g_ctrl_decay = 0.0f;
static float g_ctrl_thresh = -12.0f;
static float g_ctrl_hold = 122.5f;
static float g_ctrl_mix = 100.0f;
static float g_ctrl_quality = 1.0f;

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
    { const char *_uri = "http://moddevices.com/plugins/mda/RePsycho";
      for (int _i = 0; ; _i++) {
          g_desc = lv2_descriptor(_i);
          if (!g_desc || strcmp(g_desc->URI, _uri) == 0) break;
      }
    }
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_desc->connect_port(g_handle, 0, &g_ctrl_tune);
    g_desc->connect_port(g_handle, 1, &g_ctrl_fine);
    g_desc->connect_port(g_handle, 2, &g_ctrl_decay);
    g_desc->connect_port(g_handle, 3, &g_ctrl_thresh);
    g_desc->connect_port(g_handle, 4, &g_ctrl_hold);
    g_desc->connect_port(g_handle, 5, &g_ctrl_mix);
    g_desc->connect_port(g_handle, 6, &g_ctrl_quality);
    g_desc->connect_port(g_handle, 7, g_in_left_in);
    g_desc->connect_port(g_handle, 8, g_in_right_in);
    g_desc->connect_port(g_handle, 9, g_out_left_out);
    g_desc->connect_port(g_handle, 10, g_out_right_out);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf_left_in()  { return g_in_left_in; }
EMSCRIPTEN_KEEPALIVE float *shim_input_buf_right_in()  { return g_in_right_in; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_left_out() { return g_out_left_out; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_right_out() { return g_out_right_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_tune(float v) { g_ctrl_tune = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_tune()        { return g_ctrl_tune; }
EMSCRIPTEN_KEEPALIVE void  shim_set_fine(float v) { g_ctrl_fine = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_fine()        { return g_ctrl_fine; }
EMSCRIPTEN_KEEPALIVE void  shim_set_decay(float v) { g_ctrl_decay = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_decay()        { return g_ctrl_decay; }
EMSCRIPTEN_KEEPALIVE void  shim_set_thresh(float v) { g_ctrl_thresh = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_thresh()        { return g_ctrl_thresh; }
EMSCRIPTEN_KEEPALIVE void  shim_set_hold(float v) { g_ctrl_hold = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_hold()        { return g_ctrl_hold; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mix(float v) { g_ctrl_mix = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mix()        { return g_ctrl_mix; }
EMSCRIPTEN_KEEPALIVE void  shim_set_quality(float v) { g_ctrl_quality = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_quality()        { return g_ctrl_quality; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
