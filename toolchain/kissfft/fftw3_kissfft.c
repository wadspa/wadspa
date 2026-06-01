/*
 * fftw3_kissfft.c — FFTW3 float API implemented via kissfft.
 *
 * Compile this file alongside any plugin that previously linked libfftw3f.
 * Requires kiss_fft.c and kiss_fftr.c to also be compiled in.
 *
 * R2HC / HC2R half-complex format (matching FFTW convention):
 *   hc[0]     = DC (Re[X[0]])
 *   hc[k]     = Re[X[k]]     k = 1 .. N/2-1
 *   hc[N/2]   = Nyquist (Re[X[N/2]])
 *   hc[N-k]   = Im[X[k]]     k = 1 .. N/2-1  (stored in reverse order)
 *
 * R2C / C2R uses kiss_fftr which gives the standard N/2+1 complex spectrum.
 */

#include "kiss_fft.h"
#include "kiss_fftr.h"
#include "fftw3.h"
#include <stdlib.h>
#include <string.h>

/* ── Plan types ─────────────────────────────────────────────────────────── */

#define PLAN_KIND_R2HC  0
#define PLAN_KIND_HC2R  1
#define PLAN_KIND_R2C   2
#define PLAN_KIND_C2R   3

struct _fftwf_plan_s {
    int kind;
    int n;
    /* For R2HC / HC2R */
    kiss_fft_cfg  cfg_fwd;
    kiss_fft_cfg  cfg_inv;
    kiss_fft_cpx *cpx_in;
    kiss_fft_cpx *cpx_out;
    float        *real_in;
    float        *real_out;
    /* For R2C / C2R */
    kiss_fftr_cfg cfg_r2c;
    kiss_fftr_cfg cfg_c2r;
};

/* ── Memory ─────────────────────────────────────────────────────────────── */

float *fftwf_alloc_real(size_t n) {
    return (float *)calloc(n, sizeof(float));
}
fftwf_complex *fftwf_alloc_complex(size_t n) {
    return (fftwf_complex *)calloc(n, sizeof(fftwf_complex));
}
void fftwf_free(void *p) { free(p); }

/* ── R2HC / HC2R plans ──────────────────────────────────────────────────── */

fftwf_plan fftwf_plan_r2r_1d(int n, float *in, float *out,
                              int kind, unsigned flags)
{
    (void)flags;
    struct _fftwf_plan_s *p =
        (struct _fftwf_plan_s *)calloc(1, sizeof *p);
    if (!p) return NULL;
    p->n        = n;
    p->real_in  = in;
    p->real_out = out;
    p->kind     = (kind == FFTW_HC2R) ? PLAN_KIND_HC2R : PLAN_KIND_R2HC;
    p->cfg_fwd  = kiss_fft_alloc(n, 0, NULL, NULL);
    p->cfg_inv  = kiss_fft_alloc(n, 1, NULL, NULL);
    p->cpx_in   = (kiss_fft_cpx *)calloc(n, sizeof(kiss_fft_cpx));
    p->cpx_out  = (kiss_fft_cpx *)calloc(n, sizeof(kiss_fft_cpx));
    return p;
}

/* ── R2C / C2R plans ────────────────────────────────────────────────────── */

fftwf_plan fftwf_plan_dft_r2c_1d(int n, float *in, fftwf_complex *out,
                                  unsigned flags)
{
    (void)flags; (void)in; (void)out;
    struct _fftwf_plan_s *p =
        (struct _fftwf_plan_s *)calloc(1, sizeof *p);
    if (!p) return NULL;
    p->n       = n;
    p->kind    = PLAN_KIND_R2C;
    p->cfg_r2c = kiss_fftr_alloc(n, 0, NULL, NULL);
    return p;
}

fftwf_plan fftwf_plan_dft_c2r_1d(int n, fftwf_complex *in, float *out,
                                  unsigned flags)
{
    (void)flags; (void)in; (void)out;
    struct _fftwf_plan_s *p =
        (struct _fftwf_plan_s *)calloc(1, sizeof *p);
    if (!p) return NULL;
    p->n       = n;
    p->kind    = PLAN_KIND_C2R;
    p->cfg_c2r = kiss_fftr_alloc(n, 1, NULL, NULL);
    return p;
}

/* ── Execute helpers ─────────────────────────────────────────────────────── */

static void do_r2hc(struct _fftwf_plan_s *p, const float *in, float *out) {
    const int n = p->n, n2 = n / 2;
    for (int k = 0; k < n; k++) {
        p->cpx_in[k].r = in[k];
        p->cpx_in[k].i = 0.0f;
    }
    kiss_fft(p->cfg_fwd, p->cpx_in, p->cpx_out);
    out[0]  = p->cpx_out[0].r;
    out[n2] = p->cpx_out[n2].r;
    for (int k = 1; k < n2; k++) {
        out[k]   = p->cpx_out[k].r;
        out[n-k] = p->cpx_out[k].i;
    }
}

static void do_hc2r(struct _fftwf_plan_s *p, const float *in, float *out) {
    const int n = p->n, n2 = n / 2;
    p->cpx_in[0].r  = in[0];  p->cpx_in[0].i  = 0.0f;
    p->cpx_in[n2].r = in[n2]; p->cpx_in[n2].i = 0.0f;
    for (int k = 1; k < n2; k++) {
        p->cpx_in[k].r    = in[k];
        p->cpx_in[k].i    = in[n-k];
        p->cpx_in[n-k].r  = in[k];
        p->cpx_in[n-k].i  = -in[n-k];
    }
    kiss_fft(p->cfg_inv, p->cpx_in, p->cpx_out);
    for (int k = 0; k < n; k++)
        out[k] = p->cpx_out[k].r;
}

static void do_r2c(kiss_fftr_cfg cfg, const float *in, fftwf_complex *out, int n) {
    kiss_fft_cpx *cpx = (kiss_fft_cpx *)out;
    /* kiss_fftr output has the same layout as FFTW R2C (N/2+1 complex values) */
    kiss_fftr(cfg, in, cpx);
    (void)n;
}

static void do_c2r(kiss_fftr_cfg cfg, const fftwf_complex *in, float *out, int n) {
    const kiss_fft_cpx *cpx = (const kiss_fft_cpx *)in;
    kiss_fftri(cfg, cpx, out);
    (void)n;
}

/* ── Execute (uses buffers from plan creation) ───────────────────────────── */

void fftwf_execute(fftwf_plan p) {
    if (!p) return;
    switch (p->kind) {
        case PLAN_KIND_R2HC: do_r2hc(p, p->real_in,  p->real_out); break;
        case PLAN_KIND_HC2R: do_hc2r(p, p->real_in,  p->real_out); break;
        default: break; /* R2C/C2R: use execute_dft_r2c / execute_dft_c2r */
    }
}

/* ── New-array execute variants ──────────────────────────────────────────── */

void fftwf_execute_dft_r2c(fftwf_plan p, float *in, fftwf_complex *out) {
    if (!p || p->kind != PLAN_KIND_R2C) return;
    do_r2c(p->cfg_r2c, in, out, p->n);
}

void fftwf_execute_dft_c2r(fftwf_plan p, fftwf_complex *in, float *out) {
    if (!p || p->kind != PLAN_KIND_C2R) return;
    do_c2r(p->cfg_c2r, in, out, p->n);
}

/* ── Destroy ─────────────────────────────────────────────────────────────── */

void fftwf_destroy_plan(fftwf_plan p) {
    if (!p) return;
    kiss_fft_free(p->cfg_fwd);
    kiss_fft_free(p->cfg_inv);
    kiss_fft_free(p->cfg_r2c);
    kiss_fft_free(p->cfg_c2r);
    free(p->cpx_in);
    free(p->cpx_out);
    free(p);
}
