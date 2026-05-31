/* wadspa: expose so-666 as lv2_descriptor(0) */
#include "so-666.h"

LV2_SYMBOL_EXPORT const LV2_Descriptor *lv2_descriptor(uint32_t index) {
    return (index == 0) ? &so_666_Descriptor : NULL;
}
