#include <stdint.h>

void geonkick_usleep(unsigned long int usecods)
{
    (void)usecods;
}

int geonkick_rand(unsigned int *seed)
{
    uint32_t s = (seed && *seed) ? *seed : 1u;
    s = s * 1103515245u + 12345u;
    if (seed) *seed = s;
    return (int)(s & 0x7fffffffu);
}
