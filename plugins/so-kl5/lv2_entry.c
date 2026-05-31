/* wadspa: expose so-kl5 as lv2_descriptor(0) */
#include "so-kl5.h"

LV2_SYMBOL_EXPORT const LV2_Descriptor *lv2_descriptor(uint32_t index) {
    return (index == 0) ? &so_kl5_Descriptor : NULL;
}
