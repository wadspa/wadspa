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
static float g_ctrl_listen = 1.0f;
static float g_ctrl_l_m = 110.7f;
static float g_ctrl_m_h = 17153.79f;
static float g_ctrl_l_comp = 15.0f;
static float g_ctrl_m_comp = 0.0f;
static float g_ctrl_h_comp = 18.0f;
static float g_ctrl_l_out = -2.0f;
static float g_ctrl_m_out = 0.0f;
static float g_ctrl_h_out = 0.0f;
static float g_ctrl_attack = 387.64f;
static float g_ctrl_release = 946.344f;
static float g_ctrl_stereo = 110.0f;
static float g_ctrl_process = 0.0f;

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
    { const char *_uri = "http://moddevices.com/plugins/mda/MultiBand";
      for (int _i = 0; ; _i++) {
          g_desc = lv2_descriptor(_i);
          if (!g_desc || strcmp(g_desc->URI, _uri) == 0) break;
      }
    }
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_desc->connect_port(g_handle, 0, &g_ctrl_listen);
    g_desc->connect_port(g_handle, 1, &g_ctrl_l_m);
    g_desc->connect_port(g_handle, 2, &g_ctrl_m_h);
    g_desc->connect_port(g_handle, 3, &g_ctrl_l_comp);
    g_desc->connect_port(g_handle, 4, &g_ctrl_m_comp);
    g_desc->connect_port(g_handle, 5, &g_ctrl_h_comp);
    g_desc->connect_port(g_handle, 6, &g_ctrl_l_out);
    g_desc->connect_port(g_handle, 7, &g_ctrl_m_out);
    g_desc->connect_port(g_handle, 8, &g_ctrl_h_out);
    g_desc->connect_port(g_handle, 9, &g_ctrl_attack);
    g_desc->connect_port(g_handle, 10, &g_ctrl_release);
    g_desc->connect_port(g_handle, 11, &g_ctrl_stereo);
    g_desc->connect_port(g_handle, 12, &g_ctrl_process);
    g_desc->connect_port(g_handle, 13, g_in_left_in);
    g_desc->connect_port(g_handle, 14, g_in_right_in);
    g_desc->connect_port(g_handle, 15, g_out_left_out);
    g_desc->connect_port(g_handle, 16, g_out_right_out);
    if (g_desc->activate) g_desc->activate(g_handle);
}

EMSCRIPTEN_KEEPALIVE float *shim_input_buf_left_in()  { return g_in_left_in; }
EMSCRIPTEN_KEEPALIVE float *shim_input_buf_right_in()  { return g_in_right_in; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_left_out() { return g_out_left_out; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_right_out() { return g_out_right_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_listen(float v) { g_ctrl_listen = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_listen()        { return g_ctrl_listen; }
EMSCRIPTEN_KEEPALIVE void  shim_set_l_m(float v) { g_ctrl_l_m = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_l_m()        { return g_ctrl_l_m; }
EMSCRIPTEN_KEEPALIVE void  shim_set_m_h(float v) { g_ctrl_m_h = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_m_h()        { return g_ctrl_m_h; }
EMSCRIPTEN_KEEPALIVE void  shim_set_l_comp(float v) { g_ctrl_l_comp = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_l_comp()        { return g_ctrl_l_comp; }
EMSCRIPTEN_KEEPALIVE void  shim_set_m_comp(float v) { g_ctrl_m_comp = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_m_comp()        { return g_ctrl_m_comp; }
EMSCRIPTEN_KEEPALIVE void  shim_set_h_comp(float v) { g_ctrl_h_comp = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_h_comp()        { return g_ctrl_h_comp; }
EMSCRIPTEN_KEEPALIVE void  shim_set_l_out(float v) { g_ctrl_l_out = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_l_out()        { return g_ctrl_l_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_m_out(float v) { g_ctrl_m_out = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_m_out()        { return g_ctrl_m_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_h_out(float v) { g_ctrl_h_out = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_h_out()        { return g_ctrl_h_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_attack(float v) { g_ctrl_attack = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_attack()        { return g_ctrl_attack; }
EMSCRIPTEN_KEEPALIVE void  shim_set_release(float v) { g_ctrl_release = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_release()        { return g_ctrl_release; }
EMSCRIPTEN_KEEPALIVE void  shim_set_stereo(float v) { g_ctrl_stereo = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_stereo()        { return g_ctrl_stereo; }
EMSCRIPTEN_KEEPALIVE void  shim_set_process(float v) { g_ctrl_process = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_process()        { return g_ctrl_process; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
}
