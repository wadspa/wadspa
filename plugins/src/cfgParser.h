/* setBfree cfgParser.h — minimal WASM stub (types only, no implementation) */
#pragma once
#include <stdio.h>
#include <stdint.h>

#define INCOMPLETE_DOC "", 0, 0, 0
#define DOC_SENTINEL {NULL, CFG_TEXT, "", "", "", 0, 0, 0}
#define DENORMAL_HACK (1e-14)

typedef struct _configContext {
  const char *fname;
  int         linenr;
  const char *name;
  const char *value;
} ConfigContext;

enum conftype { CFG_TEXT=0, CFG_DOUBLE, CFG_DECIBEL, CFG_FLOAT, CFG_INT, CFG_LAST };

typedef struct _configDoc {
  const char   *name;
  enum conftype type;
  char const   *dflt;
  char const   *desc;
  char const   *unit;
  double        ui_min;
  double        ui_max;
  double        ui_step;
} ConfigDoc;

/* Declarations only — lv2.c in each plugin provides the actual stub implementations. */
int getConfigParameter_d(const char *n, ConfigContext *c, double *v);
int getConfigParameter_dr(const char *n, ConfigContext *c, double *v, double lo, double hi);
int getConfigParameter_f(const char *n, ConfigContext *c, float *v);
int getConfigParameter_fr(const char *n, ConfigContext *c, float *v, float lo, float hi);
int getConfigParameter_i(const char *n, ConfigContext *c, int *v);
int getConfigParameter_ir(const char *n, ConfigContext *c, int *v, int lo, int hi);
