/* setBfree midi.h — minimal WASM stub (type declaration only) */
#pragma once
#include "cfgParser.h"
#include <stdint.h>
/* lv2.c in each plugin provides its own inline stub for this function. */
void useMIDIControlFunction(void *m, const char *cfname, void (*f)(void *, unsigned char), void *d);
