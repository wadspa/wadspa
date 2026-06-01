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

static float g_out_left_out[BLOCK_SIZE];
static float g_out_right_out[BLOCK_SIZE];
static float g_ctrl_env_decay = 50.0f;
static float g_ctrl_env_release = 50.0f;
static float g_ctrl_hardness_offset = 0.0f;
static float g_ctrl_vel_to_hardness = 50.0f;
static float g_ctrl_muffling_filter = 80.3f;
static float g_ctrl_vel_to_muffling = 25.1f;
static float g_ctrl_vel_sensitivity = 37.6f;
static float g_ctrl_stereo_width = 100.0f;
static float g_ctrl_polyphony = 1.0f;
static float g_ctrl_fine_tuning = 0.0f;
static float g_ctrl_random_detuning = 12.3f;
static float g_ctrl_stretch_tuning = 0.0f;

static uint8_t g_midi_buf[MIDI_BUF_SIZE];
static LV2_Atom_Sequence *g_midi_seq = (LV2_Atom_Sequence *)g_midi_buf;
static LV2_URID g_urid_midi_event;
static LV2_URID g_urid_atom_chunk;
static LV2_URID g_urid_atom_sequence;

static const LV2_Descriptor *g_desc   = NULL;
static LV2_Handle            g_handle = NULL;

void shim_midi_clear(void);

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
    { const char *_uri = "http://moddevices.com/plugins/mda/Piano";
      for (int _i = 0; ; _i++) {
          g_desc = lv2_descriptor(_i);
          if (!g_desc || strcmp(g_desc->URI, _uri) == 0) break;
      }
    }
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_urid_midi_event   = urid_map_fn(NULL, LV2_MIDI__MidiEvent);
    g_urid_atom_chunk   = urid_map_fn(NULL, LV2_ATOM__Chunk);
    g_urid_atom_sequence = urid_map_fn(NULL, LV2_ATOM__Sequence);
    g_desc->connect_port(g_handle, 0, &g_ctrl_env_decay);
    g_desc->connect_port(g_handle, 1, &g_ctrl_env_release);
    g_desc->connect_port(g_handle, 2, &g_ctrl_hardness_offset);
    g_desc->connect_port(g_handle, 3, &g_ctrl_vel_to_hardness);
    g_desc->connect_port(g_handle, 4, &g_ctrl_muffling_filter);
    g_desc->connect_port(g_handle, 5, &g_ctrl_vel_to_muffling);
    g_desc->connect_port(g_handle, 6, &g_ctrl_vel_sensitivity);
    g_desc->connect_port(g_handle, 7, &g_ctrl_stereo_width);
    g_desc->connect_port(g_handle, 8, &g_ctrl_polyphony);
    g_desc->connect_port(g_handle, 9, &g_ctrl_fine_tuning);
    g_desc->connect_port(g_handle, 10, &g_ctrl_random_detuning);
    g_desc->connect_port(g_handle, 11, &g_ctrl_stretch_tuning);
    g_desc->connect_port(g_handle, 12, g_out_left_out);
    g_desc->connect_port(g_handle, 13, g_out_right_out);
    g_desc->connect_port(g_handle, 14, g_midi_seq);
    if (g_desc->activate) g_desc->activate(g_handle);
    shim_midi_clear();
}

EMSCRIPTEN_KEEPALIVE void shim_midi_clear() {
    g_midi_seq->atom.type = g_urid_atom_sequence;
    g_midi_seq->atom.size = sizeof(LV2_Atom_Sequence_Body);
    g_midi_seq->body.unit = 0;
    g_midi_seq->body.pad  = 0;
}

static void push_midi(const uint8_t *data, uint32_t size) {
    uint32_t body_off = g_midi_seq->atom.size - sizeof(LV2_Atom_Sequence_Body);
    uint8_t *end = (uint8_t *)(g_midi_seq + 1) + body_off;
    uint32_t event_total = sizeof(LV2_Atom_Event) + size;
    uint32_t padded = (event_total + 7u) & ~7u;
    if (end + padded > g_midi_buf + MIDI_BUF_SIZE) return;
    LV2_Atom_Event *ev = (LV2_Atom_Event *)end;
    ev->time.frames = 0;
    ev->body.type   = g_urid_midi_event;
    ev->body.size   = size;
    memcpy(ev + 1, data, size);
    g_midi_seq->atom.size += padded;
}

EMSCRIPTEN_KEEPALIVE void shim_midi_note_on(uint8_t ch, uint8_t note, uint8_t vel)
    { uint8_t m[3] = {(uint8_t)(0x90|ch), note, vel}; push_midi(m, 3); }

EMSCRIPTEN_KEEPALIVE void shim_midi_note_off(uint8_t ch, uint8_t note)
    { uint8_t m[3] = {(uint8_t)(0x80|ch), note, 0}; push_midi(m, 3); }

EMSCRIPTEN_KEEPALIVE void shim_midi_cc(uint8_t ch, uint8_t cc, uint8_t val)
    { uint8_t m[3] = {(uint8_t)(0xB0|ch), cc, val}; push_midi(m, 3); }

EMSCRIPTEN_KEEPALIVE void shim_midi_pitch_bend(uint8_t ch, int16_t bend) {
    uint16_t u = (uint16_t)(bend + 8192);
    uint8_t m[3] = {(uint8_t)(0xE0|ch), (uint8_t)(u & 0x7F), (uint8_t)(u >> 7)};
    push_midi(m, 3);
}

EMSCRIPTEN_KEEPALIVE float *shim_output_buf_left_out() { return g_out_left_out; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_right_out() { return g_out_right_out; }
EMSCRIPTEN_KEEPALIVE void  shim_set_env_decay(float v) { g_ctrl_env_decay = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_env_decay()        { return g_ctrl_env_decay; }
EMSCRIPTEN_KEEPALIVE void  shim_set_env_release(float v) { g_ctrl_env_release = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_env_release()        { return g_ctrl_env_release; }
EMSCRIPTEN_KEEPALIVE void  shim_set_hardness_offset(float v) { g_ctrl_hardness_offset = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_hardness_offset()        { return g_ctrl_hardness_offset; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vel_to_hardness(float v) { g_ctrl_vel_to_hardness = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vel_to_hardness()        { return g_ctrl_vel_to_hardness; }
EMSCRIPTEN_KEEPALIVE void  shim_set_muffling_filter(float v) { g_ctrl_muffling_filter = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_muffling_filter()        { return g_ctrl_muffling_filter; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vel_to_muffling(float v) { g_ctrl_vel_to_muffling = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vel_to_muffling()        { return g_ctrl_vel_to_muffling; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vel_sensitivity(float v) { g_ctrl_vel_sensitivity = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vel_sensitivity()        { return g_ctrl_vel_sensitivity; }
EMSCRIPTEN_KEEPALIVE void  shim_set_stereo_width(float v) { g_ctrl_stereo_width = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_stereo_width()        { return g_ctrl_stereo_width; }
EMSCRIPTEN_KEEPALIVE void  shim_set_polyphony(float v) { g_ctrl_polyphony = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_polyphony()        { return g_ctrl_polyphony; }
EMSCRIPTEN_KEEPALIVE void  shim_set_fine_tuning(float v) { g_ctrl_fine_tuning = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_fine_tuning()        { return g_ctrl_fine_tuning; }
EMSCRIPTEN_KEEPALIVE void  shim_set_random_detuning(float v) { g_ctrl_random_detuning = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_random_detuning()        { return g_ctrl_random_detuning; }
EMSCRIPTEN_KEEPALIVE void  shim_set_stretch_tuning(float v) { g_ctrl_stretch_tuning = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_stretch_tuning()        { return g_ctrl_stretch_tuning; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
    shim_midi_clear();
}
