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

static float g_out_out_l[BLOCK_SIZE];
static float g_out_out_r[BLOCK_SIZE];
static float g_ctrl_mod_ratio = 2.0f;
static float g_ctrl_mod_index = 3.0f;
static float g_ctrl_mod_decay = 0.5f;
static float g_ctrl_attack = 0.01f;
static float g_ctrl_decay = 0.3f;
static float g_ctrl_sustain = 0.5f;
static float g_ctrl_release = 0.5f;
static float g_ctrl_gain = 0.7f;

static uint8_t g_midi_buf[MIDI_BUF_SIZE];
static LV2_Atom_Sequence *g_midi_seq = (LV2_Atom_Sequence *)g_midi_buf;
static LV2_URID g_urid_midi_event;
static LV2_URID g_urid_atom_chunk;
static LV2_URID g_urid_atom_sequence;

static const LV2_Descriptor *g_desc   = NULL;
LV2_Handle                   g_handle = NULL;

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
    { const char *_uri = "https://wadspa.org/plugins/fm_synth";
      for (int _i = 0; ; _i++) {
          g_desc = lv2_descriptor(_i);
          if (!g_desc || strcmp(g_desc->URI, _uri) == 0) break;
      }
    }
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_urid_midi_event   = urid_map_fn(NULL, LV2_MIDI__MidiEvent);
    g_urid_atom_chunk   = urid_map_fn(NULL, LV2_ATOM__Chunk);
    g_urid_atom_sequence = urid_map_fn(NULL, LV2_ATOM__Sequence);
    g_desc->connect_port(g_handle, 0, g_midi_seq);
    g_desc->connect_port(g_handle, 1, g_out_out_l);
    g_desc->connect_port(g_handle, 2, g_out_out_r);
    g_desc->connect_port(g_handle, 3, &g_ctrl_mod_ratio);
    g_desc->connect_port(g_handle, 4, &g_ctrl_mod_index);
    g_desc->connect_port(g_handle, 5, &g_ctrl_mod_decay);
    g_desc->connect_port(g_handle, 6, &g_ctrl_attack);
    g_desc->connect_port(g_handle, 7, &g_ctrl_decay);
    g_desc->connect_port(g_handle, 8, &g_ctrl_sustain);
    g_desc->connect_port(g_handle, 9, &g_ctrl_release);
    g_desc->connect_port(g_handle, 10, &g_ctrl_gain);
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

EMSCRIPTEN_KEEPALIVE void shim_midi_poly_pressure(uint8_t ch, uint8_t note, uint8_t val)
    { uint8_t m[3] = {(uint8_t)(0xA0|ch), note, val}; push_midi(m, 3); }

EMSCRIPTEN_KEEPALIVE void shim_midi_channel_pressure(uint8_t ch, uint8_t val)
    { uint8_t m[2] = {(uint8_t)(0xD0|ch), val}; push_midi(m, 2); }

EMSCRIPTEN_KEEPALIVE void shim_midi_pitch_bend(uint8_t ch, int16_t bend) {
    uint16_t u = (uint16_t)(bend + 8192);
    uint8_t m[3] = {(uint8_t)(0xE0|ch), (uint8_t)(u & 0x7F), (uint8_t)(u >> 7)};
    push_midi(m, 3);
}

EMSCRIPTEN_KEEPALIVE float *shim_output_buf_out_l() { return g_out_out_l; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_out_r() { return g_out_out_r; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mod_ratio(float v) { g_ctrl_mod_ratio = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mod_ratio()        { return g_ctrl_mod_ratio; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mod_index(float v) { g_ctrl_mod_index = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mod_index()        { return g_ctrl_mod_index; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mod_decay(float v) { g_ctrl_mod_decay = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mod_decay()        { return g_ctrl_mod_decay; }
EMSCRIPTEN_KEEPALIVE void  shim_set_attack(float v) { g_ctrl_attack = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_attack()        { return g_ctrl_attack; }
EMSCRIPTEN_KEEPALIVE void  shim_set_decay(float v) { g_ctrl_decay = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_decay()        { return g_ctrl_decay; }
EMSCRIPTEN_KEEPALIVE void  shim_set_sustain(float v) { g_ctrl_sustain = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_sustain()        { return g_ctrl_sustain; }
EMSCRIPTEN_KEEPALIVE void  shim_set_release(float v) { g_ctrl_release = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_release()        { return g_ctrl_release; }
EMSCRIPTEN_KEEPALIVE void  shim_set_gain(float v) { g_ctrl_gain = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_gain()        { return g_ctrl_gain; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
    shim_midi_clear();
}
