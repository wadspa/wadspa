// C-linkage WASM export that routes to the DPF state bridge (also C linkage, defined
// in DistrhoPluginLV2.cpp with extern "C" inside the DISTRHO namespace scope).
#include <emscripten.h>

extern "C" { void wadspa_set_plugin_state(const char*, const char*); }

extern "C" {
EMSCRIPTEN_KEEPALIVE void shim_set_plugin_state(const char* key, const char* value) {
    wadspa_set_plugin_state(key, value);
}
}
