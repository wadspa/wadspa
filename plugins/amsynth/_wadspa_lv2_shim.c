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
static float g_ctrl_amp_attack = 0.0f;
static float g_ctrl_amp_decay = 0.0f;
static float g_ctrl_amp_sustain = 1.0f;
static float g_ctrl_amp_release = 0.0f;
static float g_ctrl_osc1_waveform = 2.0f;
static float g_ctrl_filter_attack = 0.0f;
static float g_ctrl_filter_decay = 0.0f;
static float g_ctrl_filter_sustain = 1.0f;
static float g_ctrl_filter_release = 0.0f;
static float g_ctrl_filter_resonance = 0.0f;
static float g_ctrl_filter_env_amount = 0.0f;
static float g_ctrl_filter_cutoff = 1.5f;
static float g_ctrl_osc2_detune = 0.0f;
static float g_ctrl_osc2_waveform = 2.0f;
static float g_ctrl_master_vol = 0.67f;
static float g_ctrl_lfo_freq = 0.0f;
static float g_ctrl_lfo_waveform = 0.0f;
static float g_ctrl_osc2_range = 0.0f;
static float g_ctrl_osc_mix = 0.0f;
static float g_ctrl_freq_mod_amount = 0.0f;
static float g_ctrl_filter_mod_amount = -1.0f;
static float g_ctrl_amp_mod_amount = -1.0f;
static float g_ctrl_osc_mix_mode = 0.0f;
static float g_ctrl_osc1_pulsewidth = 1.0f;
static float g_ctrl_osc2_pulsewidth = 1.0f;
static float g_ctrl_reverb_roomsize = 0.0f;
static float g_ctrl_reverb_damp = 0.0f;
static float g_ctrl_reverb_wet = 0.0f;
static float g_ctrl_reverb_width = 1.0f;
static float g_ctrl_distortion_crunch = 0.0f;
static float g_ctrl_osc2_sync = 0.0f;
static float g_ctrl_portamento_time = 0.0f;
static float g_ctrl_keyboard_mode = 0.0f;
static float g_ctrl_osc2_pitch = 0.0f;
static float g_ctrl_filter_type = 0.0f;
static float g_ctrl_filter_slope = 1.0f;
static float g_ctrl_freq_mod_osc = 0.0f;
static float g_ctrl_filter_kbd_track = 1.0f;
static float g_ctrl_filter_vel_sens = 1.0f;
static float g_ctrl_amp_vel_sens = 1.0f;
static float g_ctrl_portamento_mode = 0.0f;
static uint8_t g_atom_out_notify[MIDI_BUF_SIZE];

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
    { const char *_uri = "http://code.google.com/p/amsynth/amsynth";
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
    g_desc->connect_port(g_handle, 1, g_atom_out_notify);
    g_desc->connect_port(g_handle, 2, g_out_out_l);
    g_desc->connect_port(g_handle, 3, g_out_out_r);
    g_desc->connect_port(g_handle, 4, &g_ctrl_amp_attack);
    g_desc->connect_port(g_handle, 5, &g_ctrl_amp_decay);
    g_desc->connect_port(g_handle, 6, &g_ctrl_amp_sustain);
    g_desc->connect_port(g_handle, 7, &g_ctrl_amp_release);
    g_desc->connect_port(g_handle, 8, &g_ctrl_osc1_waveform);
    g_desc->connect_port(g_handle, 9, &g_ctrl_filter_attack);
    g_desc->connect_port(g_handle, 10, &g_ctrl_filter_decay);
    g_desc->connect_port(g_handle, 11, &g_ctrl_filter_sustain);
    g_desc->connect_port(g_handle, 12, &g_ctrl_filter_release);
    g_desc->connect_port(g_handle, 13, &g_ctrl_filter_resonance);
    g_desc->connect_port(g_handle, 14, &g_ctrl_filter_env_amount);
    g_desc->connect_port(g_handle, 15, &g_ctrl_filter_cutoff);
    g_desc->connect_port(g_handle, 16, &g_ctrl_osc2_detune);
    g_desc->connect_port(g_handle, 17, &g_ctrl_osc2_waveform);
    g_desc->connect_port(g_handle, 18, &g_ctrl_master_vol);
    g_desc->connect_port(g_handle, 19, &g_ctrl_lfo_freq);
    g_desc->connect_port(g_handle, 20, &g_ctrl_lfo_waveform);
    g_desc->connect_port(g_handle, 21, &g_ctrl_osc2_range);
    g_desc->connect_port(g_handle, 22, &g_ctrl_osc_mix);
    g_desc->connect_port(g_handle, 23, &g_ctrl_freq_mod_amount);
    g_desc->connect_port(g_handle, 24, &g_ctrl_filter_mod_amount);
    g_desc->connect_port(g_handle, 25, &g_ctrl_amp_mod_amount);
    g_desc->connect_port(g_handle, 26, &g_ctrl_osc_mix_mode);
    g_desc->connect_port(g_handle, 27, &g_ctrl_osc1_pulsewidth);
    g_desc->connect_port(g_handle, 28, &g_ctrl_osc2_pulsewidth);
    g_desc->connect_port(g_handle, 29, &g_ctrl_reverb_roomsize);
    g_desc->connect_port(g_handle, 30, &g_ctrl_reverb_damp);
    g_desc->connect_port(g_handle, 31, &g_ctrl_reverb_wet);
    g_desc->connect_port(g_handle, 32, &g_ctrl_reverb_width);
    g_desc->connect_port(g_handle, 33, &g_ctrl_distortion_crunch);
    g_desc->connect_port(g_handle, 34, &g_ctrl_osc2_sync);
    g_desc->connect_port(g_handle, 35, &g_ctrl_portamento_time);
    g_desc->connect_port(g_handle, 36, &g_ctrl_keyboard_mode);
    g_desc->connect_port(g_handle, 37, &g_ctrl_osc2_pitch);
    g_desc->connect_port(g_handle, 38, &g_ctrl_filter_type);
    g_desc->connect_port(g_handle, 39, &g_ctrl_filter_slope);
    g_desc->connect_port(g_handle, 40, &g_ctrl_freq_mod_osc);
    g_desc->connect_port(g_handle, 41, &g_ctrl_filter_kbd_track);
    g_desc->connect_port(g_handle, 42, &g_ctrl_filter_vel_sens);
    g_desc->connect_port(g_handle, 43, &g_ctrl_amp_vel_sens);
    g_desc->connect_port(g_handle, 44, &g_ctrl_portamento_mode);
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
EMSCRIPTEN_KEEPALIVE void  shim_set_amp_attack(float v) { g_ctrl_amp_attack = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_amp_attack()        { return g_ctrl_amp_attack; }
EMSCRIPTEN_KEEPALIVE void  shim_set_amp_decay(float v) { g_ctrl_amp_decay = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_amp_decay()        { return g_ctrl_amp_decay; }
EMSCRIPTEN_KEEPALIVE void  shim_set_amp_sustain(float v) { g_ctrl_amp_sustain = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_amp_sustain()        { return g_ctrl_amp_sustain; }
EMSCRIPTEN_KEEPALIVE void  shim_set_amp_release(float v) { g_ctrl_amp_release = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_amp_release()        { return g_ctrl_amp_release; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc1_waveform(float v) { g_ctrl_osc1_waveform = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc1_waveform()        { return g_ctrl_osc1_waveform; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_attack(float v) { g_ctrl_filter_attack = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_attack()        { return g_ctrl_filter_attack; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_decay(float v) { g_ctrl_filter_decay = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_decay()        { return g_ctrl_filter_decay; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_sustain(float v) { g_ctrl_filter_sustain = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_sustain()        { return g_ctrl_filter_sustain; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_release(float v) { g_ctrl_filter_release = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_release()        { return g_ctrl_filter_release; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_resonance(float v) { g_ctrl_filter_resonance = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_resonance()        { return g_ctrl_filter_resonance; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_env_amount(float v) { g_ctrl_filter_env_amount = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_env_amount()        { return g_ctrl_filter_env_amount; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_cutoff(float v) { g_ctrl_filter_cutoff = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_cutoff()        { return g_ctrl_filter_cutoff; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc2_detune(float v) { g_ctrl_osc2_detune = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc2_detune()        { return g_ctrl_osc2_detune; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc2_waveform(float v) { g_ctrl_osc2_waveform = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc2_waveform()        { return g_ctrl_osc2_waveform; }
EMSCRIPTEN_KEEPALIVE void  shim_set_master_vol(float v) { g_ctrl_master_vol = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_master_vol()        { return g_ctrl_master_vol; }
EMSCRIPTEN_KEEPALIVE void  shim_set_lfo_freq(float v) { g_ctrl_lfo_freq = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_lfo_freq()        { return g_ctrl_lfo_freq; }
EMSCRIPTEN_KEEPALIVE void  shim_set_lfo_waveform(float v) { g_ctrl_lfo_waveform = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_lfo_waveform()        { return g_ctrl_lfo_waveform; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc2_range(float v) { g_ctrl_osc2_range = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc2_range()        { return g_ctrl_osc2_range; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc_mix(float v) { g_ctrl_osc_mix = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc_mix()        { return g_ctrl_osc_mix; }
EMSCRIPTEN_KEEPALIVE void  shim_set_freq_mod_amount(float v) { g_ctrl_freq_mod_amount = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_freq_mod_amount()        { return g_ctrl_freq_mod_amount; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_mod_amount(float v) { g_ctrl_filter_mod_amount = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_mod_amount()        { return g_ctrl_filter_mod_amount; }
EMSCRIPTEN_KEEPALIVE void  shim_set_amp_mod_amount(float v) { g_ctrl_amp_mod_amount = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_amp_mod_amount()        { return g_ctrl_amp_mod_amount; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc_mix_mode(float v) { g_ctrl_osc_mix_mode = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc_mix_mode()        { return g_ctrl_osc_mix_mode; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc1_pulsewidth(float v) { g_ctrl_osc1_pulsewidth = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc1_pulsewidth()        { return g_ctrl_osc1_pulsewidth; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc2_pulsewidth(float v) { g_ctrl_osc2_pulsewidth = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc2_pulsewidth()        { return g_ctrl_osc2_pulsewidth; }
EMSCRIPTEN_KEEPALIVE void  shim_set_reverb_roomsize(float v) { g_ctrl_reverb_roomsize = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_reverb_roomsize()        { return g_ctrl_reverb_roomsize; }
EMSCRIPTEN_KEEPALIVE void  shim_set_reverb_damp(float v) { g_ctrl_reverb_damp = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_reverb_damp()        { return g_ctrl_reverb_damp; }
EMSCRIPTEN_KEEPALIVE void  shim_set_reverb_wet(float v) { g_ctrl_reverb_wet = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_reverb_wet()        { return g_ctrl_reverb_wet; }
EMSCRIPTEN_KEEPALIVE void  shim_set_reverb_width(float v) { g_ctrl_reverb_width = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_reverb_width()        { return g_ctrl_reverb_width; }
EMSCRIPTEN_KEEPALIVE void  shim_set_distortion_crunch(float v) { g_ctrl_distortion_crunch = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_distortion_crunch()        { return g_ctrl_distortion_crunch; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc2_sync(float v) { g_ctrl_osc2_sync = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc2_sync()        { return g_ctrl_osc2_sync; }
EMSCRIPTEN_KEEPALIVE void  shim_set_portamento_time(float v) { g_ctrl_portamento_time = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_portamento_time()        { return g_ctrl_portamento_time; }
EMSCRIPTEN_KEEPALIVE void  shim_set_keyboard_mode(float v) { g_ctrl_keyboard_mode = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_keyboard_mode()        { return g_ctrl_keyboard_mode; }
EMSCRIPTEN_KEEPALIVE void  shim_set_osc2_pitch(float v) { g_ctrl_osc2_pitch = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_osc2_pitch()        { return g_ctrl_osc2_pitch; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_type(float v) { g_ctrl_filter_type = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_type()        { return g_ctrl_filter_type; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_slope(float v) { g_ctrl_filter_slope = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_slope()        { return g_ctrl_filter_slope; }
EMSCRIPTEN_KEEPALIVE void  shim_set_freq_mod_osc(float v) { g_ctrl_freq_mod_osc = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_freq_mod_osc()        { return g_ctrl_freq_mod_osc; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_kbd_track(float v) { g_ctrl_filter_kbd_track = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_kbd_track()        { return g_ctrl_filter_kbd_track; }
EMSCRIPTEN_KEEPALIVE void  shim_set_filter_vel_sens(float v) { g_ctrl_filter_vel_sens = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_filter_vel_sens()        { return g_ctrl_filter_vel_sens; }
EMSCRIPTEN_KEEPALIVE void  shim_set_amp_vel_sens(float v) { g_ctrl_amp_vel_sens = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_amp_vel_sens()        { return g_ctrl_amp_vel_sens; }
EMSCRIPTEN_KEEPALIVE void  shim_set_portamento_mode(float v) { g_ctrl_portamento_mode = v; }
EMSCRIPTEN_KEEPALIVE float shim_get_portamento_mode()        { return g_ctrl_portamento_mode; }

EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {
    *(uint32_t*)g_atom_out_notify = MIDI_BUF_SIZE - 8; /* atom.size = capacity */
    g_desc->run(g_handle, count);
    shim_midi_clear();
}
