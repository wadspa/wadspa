#pragma once
/* wadspa stub — LV2 feature flags for synthv1 WASM build */

/* Enable core LV2 atom/MIDI support */
#define CONFIG_LV2 1
#define CONFIG_LV2_ATOM_FORGE_OBJECT 1
#define CONFIG_LV2_ATOM_FORGE_KEY    1

/* Use new-style LV2 headers (lv2/core/lv2.h, lv2/urid/urid.h, …) */
/* #undef CONFIG_LV2_OLD_HEADERS */

/* Optional LV2 extensions — disabled for WASM */
/* #undef CONFIG_LV2_PROGRAMS */
/* #undef CONFIG_LV2_PATCH */
/* #undef CONFIG_LV2_PORT_EVENT */
/* #undef CONFIG_LV2_PORT_CHANGE_REQUEST */

/* Project name used in state XML */
#define PROJECT_NAME "synthv1"
