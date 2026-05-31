#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include "lv2.h"
#include "lv2/urid/urid.h"
#include "lv2/midi/midi.h"
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
#include "lv2/lv2plug.in/ns/ext/event/event.h"
#include "lv2/lv2plug.in/ns/ext/event/event-helpers.h"
#include "lv2/lv2plug.in/ns/ext/uri-map/uri-map.h"
#pragma GCC diagnostic pop
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
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
static uint32_t old_uri_to_id(LV2_URI_Map_Callback_Data h, const char *m, const char *uri)
    { (void)h; (void)m; return urid_map_fn(NULL, uri); }
static LV2_URI_Map_Feature g_uri_map_data = { NULL, old_uri_to_id };
static LV2_Feature g_uri_map_feature = { LV2_URI_MAP_URI, &g_uri_map_data };
static uint32_t noop_evt_rc(LV2_Event_Callback_Data h, LV2_Event *ev) { (void)h; (void)ev; return 1; }
static LV2_Event_Feature g_evt_feature_data = { NULL, noop_evt_rc, noop_evt_rc };
static LV2_Feature g_evt_feature = { "http://lv2plug.in/ns/ext/event", &g_evt_feature_data };
#pragma GCC diagnostic pop
static const LV2_Feature *g_features[] = { &g_map_feature, &g_uri_map_feature, &g_evt_feature, NULL };

static float g_out_output[BLOCK_SIZE];
static float g_ctrl_controlmode = 0.0f;
static float g_ctrl_volume = 100.0f;
static float g_ctrl_cutoff = 50.0f;
static float g_ctrl_resonance = 100.0f;
static float g_ctrl_envelope = 80.0f;
static float g_ctrl_portamento = 64.0f;
static float g_ctrl_release = 100.0f;
static float g_ctrl_channel = 0.0f;

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
/* Old LV2 event buffer: header + inline data region */
static uint8_t g_legacy_evt_mem[sizeof(LV2_Event_Buffer) + MIDI_BUF_SIZE];
static LV2_Event_Buffer *g_legacy_evt = (LV2_Event_Buffer *)g_legacy_evt_mem;
static LV2_URID g_legacy_midi_urid;
#pragma GCC diagnostic pop

static const LV2_Descriptor *g_desc   = NULL;
static LV2_Handle            g_handle = NULL;

void shim_midi_clear(void);

EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {
    g_desc   = lv2_descriptor(0);
    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
    g_legacy_midi_urid = urid_map_fn(NULL, LV2_MIDI__MidiEvent);
    g_legacy_evt->capacity = MIDI_BUF_SIZE;
    lv2_event_buffer_reset(g_legacy_evt, LV2_EVENT_AUDIO_STAMP,
        (uint8_t *)(g_legacy_evt + 1));
#pragma GCC diagnostic pop
    g_desc->connect_port(g_handle, 0, g_out_output);
    g_desc->connect_port(g_handle, 1, g_legacy_evt);
    g_desc->connect_port(g_handle, 2, &g_ctrl_controlmode);
    g_desc->connect_port(g_handle, 3, &g_ctrl_volume);
    g_desc->connect_port(g_handle, 4, &g_ctrl_cutoff);
    g_desc->connect_port(g_handle, 5, &g_ctrl_resonance);
    g_desc->connect_port(g_handle, 6, &g_ctrl_envelope);
    g_desc->connect_port(g_handle, 7, &g_ctrl_portamento);
    g_desc->connect_port(g_handle, 8, &g_ctrl_release);
    g_desc->connect_port(g_handle, 9, &g_ctrl_channel);
    if (g_desc->activate) g_desc->activate(g_handle);
    shim_midi_clear();
}

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
EMSCRIPTEN_KEEPALIVE void shim_midi_clear() {
    lv2_event_buffer_reset(g_legacy_evt, LV2_EVENT_AUDIO_STAMP,
        (uint8_t *)(g_legacy_evt + 1));
}

static void push_midi(const uint8_t *data, uint32_t size) {
    uint32_t padded = ((uint32_t)sizeof(LV2_Event) + size + 7u) & ~7u;
    if (g_legacy_evt->size + padded > MIDI_BUF_SIZE) return;
    LV2_Event *ev = (LV2_Event *)((uint8_t *)(g_legacy_evt + 1) + g_legacy_evt->size);
    ev->frames    = 0;
    ev->subframes = 0;
    ev->type      = (uint16_t)g_legacy_midi_urid;
    ev->size      = (uint16_t)size;
    memcpy(ev + 1, data, size);
    g_legacy_evt->size += padded;
    g_legacy_evt->event_count++;
}
#pragma GCC diagnostic pop

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

EMSCRIPTEN_KEEPALIVE float *shim_output_buf_output() { return g_out_output; }
EMSCRIPTEN_KEEPALIVE void  shim_set_controlmode(float v) { g_ctrl_controlmode = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_controlmode()        { return g_ctrl_controlmode; }
EMSCRIPTEN_KEEPALIVE void  shim_set_volume(float v) { g_ctrl_volume = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_volume()        { return g_ctrl_volume; }
EMSCRIPTEN_KEEPALIVE void  shim_set_cutoff(float v) { g_ctrl_cutoff = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_cutoff()        { return g_ctrl_cutoff; }
EMSCRIPTEN_KEEPALIVE void  shim_set_resonance(float v) { g_ctrl_resonance = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_resonance()        { return g_ctrl_resonance; }
EMSCRIPTEN_KEEPALIVE void  shim_set_envelope(float v) { g_ctrl_envelope = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_envelope()        { return g_ctrl_envelope; }
EMSCRIPTEN_KEEPALIVE void  shim_set_portamento(float v) { g_ctrl_portamento = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_portamento()        { return g_ctrl_portamento; }
EMSCRIPTEN_KEEPALIVE void  shim_set_release(float v) { g_ctrl_release = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_release()        { return g_ctrl_release; }
EMSCRIPTEN_KEEPALIVE void  shim_set_channel(float v) { g_ctrl_channel = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_channel()        { return g_ctrl_channel; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    g_desc->run(g_handle, count);
    shim_midi_clear();
}
