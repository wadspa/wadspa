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
static float g_ctrl_osc_mix = 1.0f;
static float g_ctrl_osc_tune = 0.37f;
static float g_ctrl_osc_fine = 0.25f;
static float g_ctrl_glide = 0.3f;
static float g_ctrl_gld_rate = 0.32f;
static float g_ctrl_gld_bend = 0.5f;
static float g_ctrl_vcf_freq = 0.9f;
static float g_ctrl_vcf_reso = 0.6f;
static float g_ctrl_vcf_env = 0.12f;
static float g_ctrl_vcf_lfo = 0.0f;
static float g_ctrl_vcf_vel = 0.5f;
static float g_ctrl_vcf_att = 0.9f;
static float g_ctrl_vcf_dec = 0.89f;
static float g_ctrl_vcf_sus = 0.9f;
static float g_ctrl_vcf_rel = 0.73f;
static float g_ctrl_env_att = 0.0f;
static float g_ctrl_env_dec = 0.5f;
static float g_ctrl_env_sus = 1.0f;
static float g_ctrl_env_rel = 0.71f;
static float g_ctrl_lfo_rate = 0.81f;
static float g_ctrl_vibrato = 0.65f;
static float g_ctrl_noise = 0.0f;
static float g_ctrl_octave = 0.5f;
static float g_ctrl_tuning = 0.5f;

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
    { const char *_uri = "http://moddevices.com/plugins/mda/JX10";
      for (int _i = 0; ; _i++) {
          g_desc = lv2_descriptor(_i);
          if (!g_desc || strcmp(g_desc->URI, _uri) == 0) break;
      }
    }
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_urid_midi_event   = urid_map_fn(NULL, LV2_MIDI__MidiEvent);
    g_urid_atom_chunk   = urid_map_fn(NULL, LV2_ATOM__Chunk);
    g_urid_atom_sequence = urid_map_fn(NULL, LV2_ATOM__Sequence);
    g_desc->connect_port(g_handle, 0, &g_ctrl_osc_mix);
    g_desc->connect_port(g_handle, 1, &g_ctrl_osc_tune);
    g_desc->connect_port(g_handle, 2, &g_ctrl_osc_fine);
    g_desc->connect_port(g_handle, 3, &g_ctrl_glide);
    g_desc->connect_port(g_handle, 4, &g_ctrl_gld_rate);
    g_desc->connect_port(g_handle, 5, &g_ctrl_gld_bend);
    g_desc->connect_port(g_handle, 6, &g_ctrl_vcf_freq);
    g_desc->connect_port(g_handle, 7, &g_ctrl_vcf_reso);
    g_desc->connect_port(g_handle, 8, &g_ctrl_vcf_env);
    g_desc->connect_port(g_handle, 9, &g_ctrl_vcf_lfo);
    g_desc->connect_port(g_handle, 10, &g_ctrl_vcf_vel);
    g_desc->connect_port(g_handle, 11, &g_ctrl_vcf_att);
    g_desc->connect_port(g_handle, 12, &g_ctrl_vcf_dec);
    g_desc->connect_port(g_handle, 13, &g_ctrl_vcf_sus);
    g_desc->connect_port(g_handle, 14, &g_ctrl_vcf_rel);
    g_desc->connect_port(g_handle, 15, &g_ctrl_env_att);
    g_desc->connect_port(g_handle, 16, &g_ctrl_env_dec);
    g_desc->connect_port(g_handle, 17, &g_ctrl_env_sus);
    g_desc->connect_port(g_handle, 18, &g_ctrl_env_rel);
    g_desc->connect_port(g_handle, 19, &g_ctrl_lfo_rate);
    g_desc->connect_port(g_handle, 20, &g_ctrl_vibrato);
    g_desc->connect_port(g_handle, 21, &g_ctrl_noise);
    g_desc->connect_port(g_handle, 22, &g_ctrl_octave);
    g_desc->connect_port(g_handle, 23, &g_ctrl_tuning);
    g_desc->connect_port(g_handle, 24, g_out_left_out);
    g_desc->connect_port(g_handle, 25, g_out_right_out);
    g_desc->connect_port(g_handle, 26, g_midi_seq);
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
EMSCRIPTEN_KEEPALIVE void  shim_set_osc_mix(float v) { g_ctrl_osc_mix = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc_mix()        { return g_ctrl_osc_mix; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc_tune(float v) { g_ctrl_osc_tune = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc_tune()        { return g_ctrl_osc_tune; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc_fine(float v) { g_ctrl_osc_fine = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc_fine()        { return g_ctrl_osc_fine; }
EMSCRIPTEN_KEEPALIVE void  shim_set_glide(float v) { g_ctrl_glide = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_glide()        { return g_ctrl_glide; }
EMSCRIPTEN_KEEPALIVE void  shim_set_gld_rate(float v) { g_ctrl_gld_rate = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_gld_rate()        { return g_ctrl_gld_rate; }
EMSCRIPTEN_KEEPALIVE void  shim_set_gld_bend(float v) { g_ctrl_gld_bend = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_gld_bend()        { return g_ctrl_gld_bend; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vcf_freq(float v) { g_ctrl_vcf_freq = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vcf_freq()        { return g_ctrl_vcf_freq; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vcf_reso(float v) { g_ctrl_vcf_reso = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vcf_reso()        { return g_ctrl_vcf_reso; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vcf_env(float v) { g_ctrl_vcf_env = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vcf_env()        { return g_ctrl_vcf_env; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vcf_lfo(float v) { g_ctrl_vcf_lfo = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vcf_lfo()        { return g_ctrl_vcf_lfo; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vcf_vel(float v) { g_ctrl_vcf_vel = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vcf_vel()        { return g_ctrl_vcf_vel; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vcf_att(float v) { g_ctrl_vcf_att = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vcf_att()        { return g_ctrl_vcf_att; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vcf_dec(float v) { g_ctrl_vcf_dec = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vcf_dec()        { return g_ctrl_vcf_dec; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vcf_sus(float v) { g_ctrl_vcf_sus = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vcf_sus()        { return g_ctrl_vcf_sus; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vcf_rel(float v) { g_ctrl_vcf_rel = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vcf_rel()        { return g_ctrl_vcf_rel; }
EMSCRIPTEN_KEEPALIVE void  shim_set_env_att(float v) { g_ctrl_env_att = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_env_att()        { return g_ctrl_env_att; }
EMSCRIPTEN_KEEPALIVE void  shim_set_env_dec(float v) { g_ctrl_env_dec = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_env_dec()        { return g_ctrl_env_dec; }
EMSCRIPTEN_KEEPALIVE void  shim_set_env_sus(float v) { g_ctrl_env_sus = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_env_sus()        { return g_ctrl_env_sus; }
EMSCRIPTEN_KEEPALIVE void  shim_set_env_rel(float v) { g_ctrl_env_rel = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_env_rel()        { return g_ctrl_env_rel; }
EMSCRIPTEN_KEEPALIVE void  shim_set_lfo_rate(float v) { g_ctrl_lfo_rate = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_lfo_rate()        { return g_ctrl_lfo_rate; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vibrato(float v) { g_ctrl_vibrato = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vibrato()        { return g_ctrl_vibrato; }
EMSCRIPTEN_KEEPALIVE void  shim_set_noise(float v) { g_ctrl_noise = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_noise()        { return g_ctrl_noise; }
EMSCRIPTEN_KEEPALIVE void  shim_set_octave(float v) { g_ctrl_octave = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_octave()        { return g_ctrl_octave; }
EMSCRIPTEN_KEEPALIVE void  shim_set_tuning(float v) { g_ctrl_tuning = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_tuning()        { return g_ctrl_tuning; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
    shim_midi_clear();
}
