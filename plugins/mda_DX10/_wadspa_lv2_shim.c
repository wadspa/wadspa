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

static float g_out_left_out[BLOCK_SIZE];
static float g_out_right_out[BLOCK_SIZE];
static float g_ctrl_attack = 2.5f;
static float g_ctrl_decay = 6124.0f;
static float g_ctrl_release = 424.42f;
static float g_ctrl_coarse = 28.0f;
static float g_ctrl_fine = 0.24675f;
static float g_ctrl_mod_init = 23.0f;
static float g_ctrl_mod_dec = 4600.0f;
static float g_ctrl_mod_sus = 5.0f;
static float g_ctrl_mod_rel = 6485.0f;
static float g_ctrl_mod_vel = 90.0f;
static float g_ctrl_vibrato = 0.0f;
static float g_ctrl_octave = 0.0f;
static float g_ctrl_finetune = 0.0f;
static float g_ctrl_waveform = 44.7f;
static float g_ctrl_mod_thru = 0.0f;
static float g_ctrl_lfo_rate = 10.35f;

static uint8_t g_midi_buf[MIDI_BUF_SIZE];
static LV2_Atom_Sequence *g_midi_seq = (LV2_Atom_Sequence *)g_midi_buf;
static LV2_URID g_urid_midi_event;
static LV2_URID g_urid_atom_chunk;
static LV2_URID g_urid_atom_sequence;

static const LV2_Descriptor *g_desc   = NULL;
static LV2_Handle            g_handle = NULL;

void shim_midi_clear(void);

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_desc   = lv2_descriptor(0);
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
    g_urid_midi_event   = urid_map_fn(NULL, LV2_MIDI__MidiEvent);
    g_urid_atom_chunk   = urid_map_fn(NULL, LV2_ATOM__Chunk);
    g_urid_atom_sequence = urid_map_fn(NULL, LV2_ATOM__Sequence);
    g_desc->connect_port(g_handle, 0, &g_ctrl_attack);
    g_desc->connect_port(g_handle, 1, &g_ctrl_decay);
    g_desc->connect_port(g_handle, 2, &g_ctrl_release);
    g_desc->connect_port(g_handle, 3, &g_ctrl_coarse);
    g_desc->connect_port(g_handle, 4, &g_ctrl_fine);
    g_desc->connect_port(g_handle, 5, &g_ctrl_mod_init);
    g_desc->connect_port(g_handle, 6, &g_ctrl_mod_dec);
    g_desc->connect_port(g_handle, 7, &g_ctrl_mod_sus);
    g_desc->connect_port(g_handle, 8, &g_ctrl_mod_rel);
    g_desc->connect_port(g_handle, 9, &g_ctrl_mod_vel);
    g_desc->connect_port(g_handle, 10, &g_ctrl_vibrato);
    g_desc->connect_port(g_handle, 11, &g_ctrl_octave);
    g_desc->connect_port(g_handle, 12, &g_ctrl_finetune);
    g_desc->connect_port(g_handle, 13, &g_ctrl_waveform);
    g_desc->connect_port(g_handle, 14, &g_ctrl_mod_thru);
    g_desc->connect_port(g_handle, 15, &g_ctrl_lfo_rate);
    g_desc->connect_port(g_handle, 16, g_out_left_out);
    g_desc->connect_port(g_handle, 17, g_out_right_out);
    g_desc->connect_port(g_handle, 18, g_midi_seq);
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
EMSCRIPTEN_KEEPALIVE void  shim_set_attack(float v) { g_ctrl_attack = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_attack()        { return g_ctrl_attack; }
EMSCRIPTEN_KEEPALIVE void  shim_set_decay(float v) { g_ctrl_decay = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_decay()        { return g_ctrl_decay; }
EMSCRIPTEN_KEEPALIVE void  shim_set_release(float v) { g_ctrl_release = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_release()        { return g_ctrl_release; }
EMSCRIPTEN_KEEPALIVE void  shim_set_coarse(float v) { g_ctrl_coarse = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_coarse()        { return g_ctrl_coarse; }
EMSCRIPTEN_KEEPALIVE void  shim_set_fine(float v) { g_ctrl_fine = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_fine()        { return g_ctrl_fine; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mod_init(float v) { g_ctrl_mod_init = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mod_init()        { return g_ctrl_mod_init; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mod_dec(float v) { g_ctrl_mod_dec = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mod_dec()        { return g_ctrl_mod_dec; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mod_sus(float v) { g_ctrl_mod_sus = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mod_sus()        { return g_ctrl_mod_sus; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mod_rel(float v) { g_ctrl_mod_rel = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mod_rel()        { return g_ctrl_mod_rel; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mod_vel(float v) { g_ctrl_mod_vel = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mod_vel()        { return g_ctrl_mod_vel; }
EMSCRIPTEN_KEEPALIVE void  shim_set_vibrato(float v) { g_ctrl_vibrato = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_vibrato()        { return g_ctrl_vibrato; }
EMSCRIPTEN_KEEPALIVE void  shim_set_octave(float v) { g_ctrl_octave = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_octave()        { return g_ctrl_octave; }
EMSCRIPTEN_KEEPALIVE void  shim_set_finetune(float v) { g_ctrl_finetune = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_finetune()        { return g_ctrl_finetune; }
EMSCRIPTEN_KEEPALIVE void  shim_set_waveform(float v) { g_ctrl_waveform = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_waveform()        { return g_ctrl_waveform; }
EMSCRIPTEN_KEEPALIVE void  shim_set_mod_thru(float v) { g_ctrl_mod_thru = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_mod_thru()        { return g_ctrl_mod_thru; }
EMSCRIPTEN_KEEPALIVE void  shim_set_lfo_rate(float v) { g_ctrl_lfo_rate = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_lfo_rate()        { return g_ctrl_lfo_rate; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
    shim_midi_clear();
}
