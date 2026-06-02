/**
 * tsf_plugin.c -- wadspa TinySoundFont plugin
 *
 * Wraps TinySoundFont (single-header, MIT) to provide General MIDI SF2
 * synthesis as a wadspa instrument.  Call shim_load_sf2(ptr, size) with
 * raw SF2 bytes copied into WASM heap, then use the MIDI shim functions.
 *
 * All 16 MIDI channels are supported including channel 9 (drums).
 *
 * Emscripten convention: C functions have no leading underscore; the _
 * prefix is added by the JS module wrapper (EXPORTED_FUNCTIONS=['_shim_init']).
 */
#define TSF_IMPLEMENTATION
#include "tsf.h"
#include <stdlib.h>
#include <string.h>
#include <emscripten.h>

#define BLOCK_SIZE 128

static tsf*  g_tsf  = NULL;
static int   g_sr   = 44100;
static float g_gain = 0.5f;

/* TSF_STEREO_UNWEAVED: g_buf[0..127]=L, g_buf[128..255]=R */
static float g_buf[BLOCK_SIZE * 2];

EMSCRIPTEN_KEEPALIVE void shim_init(int sr) {
    g_sr = sr;
}

/* Called from JavaScript after copying SF2 bytes into WASM heap. */
EMSCRIPTEN_KEEPALIVE void shim_load_sf2(const void* data, int size) {
    if (g_tsf) { tsf_close(g_tsf); g_tsf = NULL; }
    g_tsf = tsf_load_memory(data, size);
    if (g_tsf) {
        tsf_set_output(g_tsf, TSF_STEREO_UNWEAVED, g_sr, 0.0f);
        tsf_set_volume(g_tsf, g_gain);
        /* Initialize all 16 GM channels so tsf_channel_note_on works without
           requiring a prior program-change message on each channel. */
        for (int ch = 0; ch < 16; ch++)
            tsf_channel_set_presetnumber(g_tsf, ch, 0, ch == 9);
    }
}

EMSCRIPTEN_KEEPALIVE void shim_set_gain(float v) {
    g_gain = v;
    if (g_tsf) tsf_set_volume(g_tsf, v);
}

EMSCRIPTEN_KEEPALIVE void shim_midi_note_on(int ch, int note, int vel) {
    if (g_tsf) tsf_channel_note_on(g_tsf, ch, note, vel / 127.0f);
}

EMSCRIPTEN_KEEPALIVE void shim_midi_note_off(int ch, int note) {
    if (g_tsf) tsf_channel_note_off(g_tsf, ch, note);
}

EMSCRIPTEN_KEEPALIVE void shim_midi_cc(int ch, int cc, int val) {
    if (g_tsf) tsf_channel_midi_control(g_tsf, ch, cc, val);
}

EMSCRIPTEN_KEEPALIVE void shim_midi_pitch_bend(int ch, int bend) {
    /* bend: -8192..+8191 -> TSF wheel: 0..16383 */
    if (g_tsf) tsf_channel_set_pitchwheel(g_tsf, ch, bend + 8192);
}

EMSCRIPTEN_KEEPALIVE void shim_midi_program_change(int ch, int program) {
    /* ch 9 = drums in General MIDI */
    if (g_tsf) tsf_channel_set_presetnumber(g_tsf, ch, program, ch == 9);
}

EMSCRIPTEN_KEEPALIVE void shim_run(int frames) {
    if (!g_tsf) {
        memset(g_buf, 0, frames * 2 * sizeof(float));
        return;
    }
    /* flag_mixing=0: overwrite rather than mix into existing buffer */
    tsf_render_float(g_tsf, g_buf, frames, 0);
}

EMSCRIPTEN_KEEPALIVE float* shim_output_buf_out_l() { return g_buf; }
EMSCRIPTEN_KEEPALIVE float* shim_output_buf_out_r() { return g_buf + BLOCK_SIZE; }
