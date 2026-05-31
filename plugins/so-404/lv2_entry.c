/* wadspa: expose so-404 as lv2_descriptor(0) */
#include "so-404.h"

LV2_SYMBOL_EXPORT const LV2_Descriptor *lv2_descriptor(uint32_t index) {
    return (index == 0) ? &so_404_Descriptor : NULL;
}
