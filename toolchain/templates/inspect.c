#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "ladspa.h"

extern const LADSPA_Descriptor *ladspa_descriptor(unsigned long index);

static const char *default_hint(LADSPA_PortRangeHintDescriptor h) {
    switch (h & LADSPA_HINT_DEFAULT_MASK) {
        case LADSPA_HINT_DEFAULT_MINIMUM: return "min";
        case LADSPA_HINT_DEFAULT_LOW:     return "low";
        case LADSPA_HINT_DEFAULT_MIDDLE:  return "middle";
        case LADSPA_HINT_DEFAULT_HIGH:    return "high";
        case LADSPA_HINT_DEFAULT_MAXIMUM: return "max";
        case LADSPA_HINT_DEFAULT_0:       return "0";
        case LADSPA_HINT_DEFAULT_1:       return "1";
        case LADSPA_HINT_DEFAULT_100:     return "100";
        case LADSPA_HINT_DEFAULT_440:     return "440";
        default:                          return "none";
    }
}

static void json_str(const char *s) {
    putchar('"');
    for (; *s; s++) {
        if (*s == '"' || *s == '\\') putchar('\\');
        putchar(*s);
    }
    putchar('"');
}

int main(void) {
    const LADSPA_Descriptor *d = ladspa_descriptor(0);
    if (!d) { fprintf(stderr, "ladspa_descriptor(0) returned NULL\n"); return 1; }

    printf("{\n");
    printf("  \"id\": %lu,\n", d->UniqueID);
    printf("  \"label\": "); json_str(d->Label);   printf(",\n");
    printf("  \"name\":  "); json_str(d->Name);    printf(",\n");
    printf("  \"maker\": "); json_str(d->Maker);   printf(",\n");
    printf("  \"ports\": [\n");

    for (unsigned long i = 0; i < d->PortCount; i++) {
        LADSPA_PortDescriptor       pd = d->PortDescriptors[i];
        LADSPA_PortRangeHint        ph = d->PortRangeHints[i];
        LADSPA_PortRangeHintDescriptor hd = ph.HintDescriptor;

        int is_input = (pd & LADSPA_PORT_INPUT)   != 0;
        int is_audio = (pd & LADSPA_PORT_AUDIO)   != 0;

        printf("    {");
        printf("\"index\":%lu, ", i);
        printf("\"name\":"); json_str(d->PortNames[i]); printf(", ");
        printf("\"dir\":\"%s\", ", is_input ? "input" : "output");
        printf("\"type\":\"%s\"", is_audio ? "audio" : "control");

        if (!is_audio) {
            if (hd & LADSPA_HINT_BOUNDED_BELOW) printf(", \"min\":%g", ph.LowerBound);
            if (hd & LADSPA_HINT_BOUNDED_ABOVE) printf(", \"max\":%g", ph.UpperBound);
            printf(", \"default\":\"%s\"", default_hint(hd));
            if (hd & LADSPA_HINT_INTEGER)      printf(", \"integer\":true");
            if (hd & LADSPA_HINT_LOGARITHMIC)  printf(", \"logarithmic\":true");
            if (hd & LADSPA_HINT_TOGGLED)      printf(", \"toggled\":true");
            if (hd & LADSPA_HINT_SAMPLE_RATE)  printf(", \"sampleRate\":true");
        }

        printf("}%s\n", i < d->PortCount - 1 ? "," : "");
    }

    printf("  ]\n}\n");
    return 0;
}
