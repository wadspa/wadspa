#pragma once
/**
 * Minimal fftw3.h stub for WASM compilation.
 * Implements fftwf_plan_r2r_1d(FFTW_HC2R) — the only FFTW function
 * used by padthv1_sample.cpp for PADsynth wavetable generation.
 *
 * HC2R (half-complex to real) inverse transform:
 *   Input in half-complex format: data[0..N/2] real, data[N-1..N/2+1] imag
 *   Output: N real values (in-place, same buffer)
 *
 * This is an O(N²) DFT — correct but slow. It is only called at init
 * time (wavetable generation), never in the audio render loop.
 */

#include <cstdlib>
#include <cmath>

// FFTW float types
typedef float fftwf_complex[2];
typedef struct fftwf_plan_s *fftwf_plan;

// Transform kind flags
#define FFTW_R2HC  0
#define FFTW_HC2R  1
#define FFTW_DHT   2
#define FFTW_REDFT00 3
#define FFTW_ESTIMATE  (1u << 6)
#define FFTW_MEASURE   0u
#define FFTW_PATIENT   (1u << 5)
#define FFTW_EXHAUSTIVE (1u << 3)

struct fftwf_plan_s {
    int     n;
    int     kind;
    float  *in;
    float  *out;
};

inline fftwf_plan fftwf_plan_r2r_1d(int n, float *in, float *out, int kind, unsigned /*flags*/) {
    fftwf_plan_s *p = new fftwf_plan_s;
    p->n    = n;
    p->kind = kind;
    p->in   = in;
    p->out  = out;
    return p;
}

inline fftwf_plan fftwf_plan_dft_r2c_1d(int n, float *in, fftwf_complex *out, unsigned /*flags*/) {
    fftwf_plan_s *p = new fftwf_plan_s;
    p->n    = n;
    p->kind = FFTW_R2HC;
    p->in   = in;
    p->out  = (float *)out;
    return p;
}

inline fftwf_plan fftwf_plan_dft_c2r_1d(int n, fftwf_complex *in, float *out, unsigned /*flags*/) {
    fftwf_plan_s *p = new fftwf_plan_s;
    p->n    = n;
    p->kind = FFTW_HC2R;
    p->in   = (float *)in;
    p->out  = out;
    return p;
}

inline void fftwf_execute(fftwf_plan p) {
    const int N = p->n;
    if (p->kind == FFTW_HC2R) {
        // Half-complex to real inverse DFT (in-place, in==out in padthv1)
        // HC format: data[0] = DC, data[1..N/2-1] = real parts,
        //            data[N/2] = Nyquist, data[N-1..N/2+1] = imag parts (reverse)
        const float *src = p->in;
        float *dst = new float[N]();
        const double inv_n = 1.0 / N;
        const double two_pi = 2.0 * 3.14159265358979323846;

        for (int n = 0; n < N; ++n) {
            double s = src[0]; // DC
            if (N % 2 == 0 && N > 0)
                s += src[N / 2] * (n % 2 == 0 ? 1.0 : -1.0); // Nyquist

            for (int k = 1; k < N / 2; ++k) {
                double re =  src[k];          // real part of bin k
                double im = -src[N - k];      // imag part of bin k (sign: HC2R convention)
                double angle = two_pi * k * n * inv_n;
                s += 2.0 * (re * std::cos(angle) - im * std::sin(angle));
            }
            dst[n] = (float)s;
        }
        // Copy result back into output buffer
        for (int n = 0; n < N; ++n) p->out[n] = dst[n];
        delete[] dst;
    }
    // FFTW_R2HC forward transform: not needed by padthv1, left as no-op
}

inline void fftwf_execute_r2r(fftwf_plan p, float *in, float *out) {
    p->in  = in;
    p->out = out;
    fftwf_execute(p);
}

inline void fftwf_destroy_plan(fftwf_plan p) {
    delete p;
}

inline void *fftwf_malloc(size_t n) { return ::malloc(n); }
inline void  fftwf_free(void *p)    { ::free(p); }
inline void  fftwf_cleanup()        {}

// Double-precision versions (fallback stubs)
typedef double fftw_complex[2];
typedef struct fftw_plan_s *fftw_plan;
struct fftw_plan_s {};
inline fftw_plan fftw_plan_dft_r2c_1d(int, double *, fftw_complex *, unsigned) { return nullptr; }
inline fftw_plan fftw_plan_dft_c2r_1d(int, fftw_complex *, double *, unsigned) { return nullptr; }
inline void fftw_execute(fftw_plan) {}
inline void fftw_destroy_plan(fftw_plan) {}
inline void *fftw_malloc(size_t n) { return ::malloc(n); }
inline void  fftw_free(void *p)    { ::free(p); }
