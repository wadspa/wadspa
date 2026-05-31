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

static float g_in_in_L[BLOCK_SIZE];
static float g_in_in_R[BLOCK_SIZE];
static float g_out_Out_L[BLOCK_SIZE];
static float g_out_Out_R[BLOCK_SIZE];
static float g_ctrl_GEN1_SAMPLE = 36.0f;
static float g_ctrl_DEF1_PITCHBEND = 0.2f;
static float g_ctrl_DEF1_MODWHEEL = 0.2f;
static float g_ctrl_DEF1_PRESSURE = 0.2f;
static float g_ctrl_DEF1_VELOCITY = 0.2f;
static float g_ctrl_DEF1_CHANNEL = 0.0f;
static float g_ctrl_DEF1_NOTEOFF = 0.0f;
static float g_ctrl_CHO1_WET = 0.0f;
static float g_ctrl_CHO1_DELAY = 0.5f;
static float g_ctrl_CHO1_FEEDB = 0.5f;
static float g_ctrl_CHO1_RATE = 0.5f;
static float g_ctrl_CHO1_MOD = 0.5f;
static float g_ctrl_FLA1_WET = 0.0f;
static float g_ctrl_FLA1_DELAY = 0.5f;
static float g_ctrl_FLA1_FEEDB = 0.5f;
static float g_ctrl_FLA1_DAFT = 0.0f;
static float g_ctrl_PHA1_WET = 0.0f;
static float g_ctrl_PHA1_RATE = 0.5f;
static float g_ctrl_PHA1_FEEDB = 0.5f;
static float g_ctrl_PHA1_DEPTH = 0.5f;
static float g_ctrl_PHA1_DAFT = 0.0f;
static float g_ctrl_DEL1_WET = 0.0f;
static float g_ctrl_DEL1_DELAY = 0.5f;
static float g_ctrl_DEL1_FEEDB = 0.5f;
static float g_ctrl_DEL1_BPM = 180.0f;
static float g_ctrl_REV1_WET = 0.0f;
static float g_ctrl_REV1_ROOM = 0.5f;
static float g_ctrl_REV1_DAMP = 0.5f;
static float g_ctrl_REV1_FEEDB = 0.5f;
static float g_ctrl_REV1_WIDTH = 0.0f;
static float g_ctrl_DYN1_COMPRESS = 0.0f;
static float g_ctrl_DYN1_LIMITER = 1.0f;
static uint8_t g_atom_out_notify[MIDI_BUF_SIZE];

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
    g_desc->connect_port(g_handle, 0, g_midi_seq);
    g_desc->connect_port(g_handle, 1, g_atom_out_notify);
    g_desc->connect_port(g_handle, 2, g_in_in_L);
    g_desc->connect_port(g_handle, 3, g_in_in_R);
    g_desc->connect_port(g_handle, 4, g_out_Out_L);
    g_desc->connect_port(g_handle, 5, g_out_Out_R);
    g_desc->connect_port(g_handle, 6, &g_ctrl_GEN1_SAMPLE);
    g_desc->connect_port(g_handle, 7, &g_ctrl_DEF1_PITCHBEND);
    g_desc->connect_port(g_handle, 8, &g_ctrl_DEF1_MODWHEEL);
    g_desc->connect_port(g_handle, 9, &g_ctrl_DEF1_PRESSURE);
    g_desc->connect_port(g_handle, 10, &g_ctrl_DEF1_VELOCITY);
    g_desc->connect_port(g_handle, 11, &g_ctrl_DEF1_CHANNEL);
    g_desc->connect_port(g_handle, 12, &g_ctrl_DEF1_NOTEOFF);
    g_desc->connect_port(g_handle, 13, &g_ctrl_CHO1_WET);
    g_desc->connect_port(g_handle, 14, &g_ctrl_CHO1_DELAY);
    g_desc->connect_port(g_handle, 15, &g_ctrl_CHO1_FEEDB);
    g_desc->connect_port(g_handle, 16, &g_ctrl_CHO1_RATE);
    g_desc->connect_port(g_handle, 17, &g_ctrl_CHO1_MOD);
    g_desc->connect_port(g_handle, 18, &g_ctrl_FLA1_WET);
    g_desc->connect_port(g_handle, 19, &g_ctrl_FLA1_DELAY);
    g_desc->connect_port(g_handle, 20, &g_ctrl_FLA1_FEEDB);
    g_desc->connect_port(g_handle, 21, &g_ctrl_FLA1_DAFT);
    g_desc->connect_port(g_handle, 22, &g_ctrl_PHA1_WET);
    g_desc->connect_port(g_handle, 23, &g_ctrl_PHA1_RATE);
    g_desc->connect_port(g_handle, 24, &g_ctrl_PHA1_FEEDB);
    g_desc->connect_port(g_handle, 25, &g_ctrl_PHA1_DEPTH);
    g_desc->connect_port(g_handle, 26, &g_ctrl_PHA1_DAFT);
    g_desc->connect_port(g_handle, 27, &g_ctrl_DEL1_WET);
    g_desc->connect_port(g_handle, 28, &g_ctrl_DEL1_DELAY);
    g_desc->connect_port(g_handle, 29, &g_ctrl_DEL1_FEEDB);
    g_desc->connect_port(g_handle, 30, &g_ctrl_DEL1_BPM);
    g_desc->connect_port(g_handle, 31, &g_ctrl_REV1_WET);
    g_desc->connect_port(g_handle, 32, &g_ctrl_REV1_ROOM);
    g_desc->connect_port(g_handle, 33, &g_ctrl_REV1_DAMP);
    g_desc->connect_port(g_handle, 34, &g_ctrl_REV1_FEEDB);
    g_desc->connect_port(g_handle, 35, &g_ctrl_REV1_WIDTH);
    g_desc->connect_port(g_handle, 36, &g_ctrl_DYN1_COMPRESS);
    g_desc->connect_port(g_handle, 37, &g_ctrl_DYN1_LIMITER);
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

EMSCRIPTEN_KEEPALIVE float *shim_input_buf_in_L()  { return g_in_in_L; }
EMSCRIPTEN_KEEPALIVE float *shim_input_buf_in_R()  { return g_in_in_R; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_Out_L() { return g_out_Out_L; }
EMSCRIPTEN_KEEPALIVE float *shim_output_buf_Out_R() { return g_out_Out_R; }
EMSCRIPTEN_KEEPALIVE void  shim_set_GEN1_SAMPLE(float v) { g_ctrl_GEN1_SAMPLE = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_GEN1_SAMPLE()        { return g_ctrl_GEN1_SAMPLE; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DEF1_PITCHBEND(float v) { g_ctrl_DEF1_PITCHBEND = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DEF1_PITCHBEND()        { return g_ctrl_DEF1_PITCHBEND; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DEF1_MODWHEEL(float v) { g_ctrl_DEF1_MODWHEEL = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DEF1_MODWHEEL()        { return g_ctrl_DEF1_MODWHEEL; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DEF1_PRESSURE(float v) { g_ctrl_DEF1_PRESSURE = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DEF1_PRESSURE()        { return g_ctrl_DEF1_PRESSURE; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DEF1_VELOCITY(float v) { g_ctrl_DEF1_VELOCITY = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DEF1_VELOCITY()        { return g_ctrl_DEF1_VELOCITY; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DEF1_CHANNEL(float v) { g_ctrl_DEF1_CHANNEL = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DEF1_CHANNEL()        { return g_ctrl_DEF1_CHANNEL; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DEF1_NOTEOFF(float v) { g_ctrl_DEF1_NOTEOFF = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DEF1_NOTEOFF()        { return g_ctrl_DEF1_NOTEOFF; }
EMSCRIPTEN_KEEPALIVE void  shim_set_CHO1_WET(float v) { g_ctrl_CHO1_WET = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_CHO1_WET()        { return g_ctrl_CHO1_WET; }
EMSCRIPTEN_KEEPALIVE void  shim_set_CHO1_DELAY(float v) { g_ctrl_CHO1_DELAY = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_CHO1_DELAY()        { return g_ctrl_CHO1_DELAY; }
EMSCRIPTEN_KEEPALIVE void  shim_set_CHO1_FEEDB(float v) { g_ctrl_CHO1_FEEDB = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_CHO1_FEEDB()        { return g_ctrl_CHO1_FEEDB; }
EMSCRIPTEN_KEEPALIVE void  shim_set_CHO1_RATE(float v) { g_ctrl_CHO1_RATE = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_CHO1_RATE()        { return g_ctrl_CHO1_RATE; }
EMSCRIPTEN_KEEPALIVE void  shim_set_CHO1_MOD(float v) { g_ctrl_CHO1_MOD = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_CHO1_MOD()        { return g_ctrl_CHO1_MOD; }
EMSCRIPTEN_KEEPALIVE void  shim_set_FLA1_WET(float v) { g_ctrl_FLA1_WET = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_FLA1_WET()        { return g_ctrl_FLA1_WET; }
EMSCRIPTEN_KEEPALIVE void  shim_set_FLA1_DELAY(float v) { g_ctrl_FLA1_DELAY = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_FLA1_DELAY()        { return g_ctrl_FLA1_DELAY; }
EMSCRIPTEN_KEEPALIVE void  shim_set_FLA1_FEEDB(float v) { g_ctrl_FLA1_FEEDB = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_FLA1_FEEDB()        { return g_ctrl_FLA1_FEEDB; }
EMSCRIPTEN_KEEPALIVE void  shim_set_FLA1_DAFT(float v) { g_ctrl_FLA1_DAFT = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_FLA1_DAFT()        { return g_ctrl_FLA1_DAFT; }
EMSCRIPTEN_KEEPALIVE void  shim_set_PHA1_WET(float v) { g_ctrl_PHA1_WET = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_PHA1_WET()        { return g_ctrl_PHA1_WET; }
EMSCRIPTEN_KEEPALIVE void  shim_set_PHA1_RATE(float v) { g_ctrl_PHA1_RATE = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_PHA1_RATE()        { return g_ctrl_PHA1_RATE; }
EMSCRIPTEN_KEEPALIVE void  shim_set_PHA1_FEEDB(float v) { g_ctrl_PHA1_FEEDB = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_PHA1_FEEDB()        { return g_ctrl_PHA1_FEEDB; }
EMSCRIPTEN_KEEPALIVE void  shim_set_PHA1_DEPTH(float v) { g_ctrl_PHA1_DEPTH = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_PHA1_DEPTH()        { return g_ctrl_PHA1_DEPTH; }
EMSCRIPTEN_KEEPALIVE void  shim_set_PHA1_DAFT(float v) { g_ctrl_PHA1_DAFT = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_PHA1_DAFT()        { return g_ctrl_PHA1_DAFT; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DEL1_WET(float v) { g_ctrl_DEL1_WET = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DEL1_WET()        { return g_ctrl_DEL1_WET; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DEL1_DELAY(float v) { g_ctrl_DEL1_DELAY = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DEL1_DELAY()        { return g_ctrl_DEL1_DELAY; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DEL1_FEEDB(float v) { g_ctrl_DEL1_FEEDB = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DEL1_FEEDB()        { return g_ctrl_DEL1_FEEDB; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DEL1_BPM(float v) { g_ctrl_DEL1_BPM = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DEL1_BPM()        { return g_ctrl_DEL1_BPM; }
EMSCRIPTEN_KEEPALIVE void  shim_set_REV1_WET(float v) { g_ctrl_REV1_WET = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_REV1_WET()        { return g_ctrl_REV1_WET; }
EMSCRIPTEN_KEEPALIVE void  shim_set_REV1_ROOM(float v) { g_ctrl_REV1_ROOM = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_REV1_ROOM()        { return g_ctrl_REV1_ROOM; }
EMSCRIPTEN_KEEPALIVE void  shim_set_REV1_DAMP(float v) { g_ctrl_REV1_DAMP = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_REV1_DAMP()        { return g_ctrl_REV1_DAMP; }
EMSCRIPTEN_KEEPALIVE void  shim_set_REV1_FEEDB(float v) { g_ctrl_REV1_FEEDB = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_REV1_FEEDB()        { return g_ctrl_REV1_FEEDB; }
EMSCRIPTEN_KEEPALIVE void  shim_set_REV1_WIDTH(float v) { g_ctrl_REV1_WIDTH = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_REV1_WIDTH()        { return g_ctrl_REV1_WIDTH; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DYN1_COMPRESS(float v) { g_ctrl_DYN1_COMPRESS = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DYN1_COMPRESS()        { return g_ctrl_DYN1_COMPRESS; }
EMSCRIPTEN_KEEPALIVE void  shim_set_DYN1_LIMITER(float v) { g_ctrl_DYN1_LIMITER = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_DYN1_LIMITER()        { return g_ctrl_DYN1_LIMITER; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
    shim_midi_clear();
}
