/*
 * fftw3.h — FFTW3 float-precision API replacement using kissfft
 *
 * Drop this file into any include path to replace <fftw3.h> for plugins
 * that use the R2HC / HC2R real transforms (fftwf_ prefix).
 * Also provides R2C / C2R via kiss_fftr for plugins like zita-convolver.
 *
 * Implementation is in fftw3_kissfft.c (must be compiled alongside the plugin).
 *
 * Normalization matches FFTW:
 *   Forward (R2HC / R2C): unnormalized
 *   Backward (HC2R / C2R): unnormalized (result scaled by N)
 */

#ifndef FFTW3_KISSFFT_H
#define FFTW3_KISSFFT_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ── Types ──────────────────────────────────────────────────────────────── */

typedef float fftwf_complex[2];   /* [0]=real, [1]=imag */
typedef double fftw_complex[2];

/* Opaque plan pointer — definition in fftw3_kissfft.c */
typedef struct _fftwf_plan_s *fftwf_plan;

/* ── Constants ───────────────────────────────────────────────────────────── */

#define FFTW_R2HC    0
#define FFTW_HC2R    1
#define FFTW_DHT     2

#define FFTW_MEASURE    0U
#define FFTW_ESTIMATE  (1U << 6)
#define FFTW_PATIENT   (1U << 5)
#define FFTW_EXHAUSTIVE (1U << 3)

/* ── Memory ─────────────────────────────────────────────────────────────── */

float         *fftwf_alloc_real   (size_t n);
fftwf_complex *fftwf_alloc_complex(size_t n);
void           fftwf_free         (void *p);

/* ── Real half-complex (R2HC / HC2R) plans ──────────────────────────────── */

fftwf_plan fftwf_plan_r2r_1d(int n, float *in, float *out,
                              int kind, unsigned flags);
void fftwf_execute       (fftwf_plan p);
void fftwf_destroy_plan  (fftwf_plan p);

/* ── Real-to-complex / complex-to-real plans (for zita-convolver etc.) ──── */

fftwf_plan fftwf_plan_dft_r2c_1d(int n, float *in, fftwf_complex *out,
                                  unsigned flags);
fftwf_plan fftwf_plan_dft_c2r_1d(int n, fftwf_complex *in, float *out,
                                  unsigned flags);

/* New-array execute variants (execute with different buffers than at plan creation) */
void fftwf_execute_dft_r2c(fftwf_plan p, float *in, fftwf_complex *out);
void fftwf_execute_dft_c2r(fftwf_plan p, fftwf_complex *in, float *out);

/* ── Misc stubs (no-op — not needed in WASM context) ───────────────────── */

static inline int  fftwf_init_threads(void)           { return 1; }
static inline void fftwf_plan_with_nthreads(int n)    { (void)n; }
static inline void fftwf_cleanup_threads(void)         {}
static inline void fftwf_cleanup(void)                 {}
static inline void fftwf_export_wisdom_to_filename(const char *f) { (void)f; }
static inline int  fftwf_import_wisdom_from_filename(const char *f) { (void)f; return 0; }

#ifdef __cplusplus
}
#endif
#endif /* FFTW3_KISSFFT_H */
