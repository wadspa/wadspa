#!/usr/bin/env node
/**
 * Setup script for noise-repellent — broadband noise reduction LV2.
 *
 * noise-repellent depends on libspecbleach (bundled in its subprojects/)
 * which uses FFTW3 for its FFT transform. We replace fft_transform.c with a
 * kissfft-based implementation (toolchain/kissfft/) so no FFTW3 is needed.
 *
 * Structure:
 *   plugins/noise-repellent/
 *     nrepellent.c           — patched (../src/ → ./)
 *     noise_profile_state.c/h
 *     signal_crossfade.c/h
 *     kiss_fft.c/h + _kiss_fft_guts.h   — vendored FFT library
 *     fft_transform.c        — kissfft-based replacement for FFTW3
 *     manifest.ttl / nrepellent.ttl
 *     libspecbleach/
 *       include/  — public API headers
 *       src/      — all shared C sources (hierarchy preserved)
 *                   nlm_filter_avx.c excluded (x86 AVX, not WASM-portable)
 *                   fft_transform.c excluded (replaced by root-level stub)
 */

import { copyFileSync, mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT        = join(dirname(fileURLToPath(import.meta.url)), '..');
const NR_REPO     = join(ROOT, 'noise-repellent');
const LSB_REPO    = join(ROOT, 'libspecbleach');
const KISSFFT_DIR = join(ROOT, 'toolchain', 'kissfft');
const OUT         = join(ROOT, 'plugins', 'noise-repellent');

for (const repo of [NR_REPO, LSB_REPO, KISSFFT_DIR]) {
    if (!existsSync(repo)) {
        console.error(`Source not found: ${repo} — run fetch-sources.js first (or check toolchain/kissfft/)`);
        process.exit(1);
    }
}

mkdirSync(OUT, { recursive: true });

// ── Recursive copy helper ─────────────────────────────────────────────────────
function copyDir(src, dst, skip = []) {
    mkdirSync(dst, { recursive: true });
    for (const name of readdirSync(src)) {
        if (skip.includes(name)) continue;
        const s = join(src, name), d = join(dst, name);
        if (statSync(s).isDirectory()) {
            copyDir(s, d, skip);
        } else {
            copyFileSync(s, d);
        }
    }
}

// ── 1. Copy kissfft files ─────────────────────────────────────────────────────
for (const f of ['kiss_fft.h', 'kiss_fft.c', '_kiss_fft_guts.h', 'kiss_fft_log.h']) {
    copyFileSync(join(KISSFFT_DIR, f), join(OUT, f));
}
console.log('  ✓ kissfft files');

// ── 2. Copy libspecbleach (preserve hierarchy, skip AVX and original fft_transform) ──
const LSB_OUT = join(OUT, 'libspecbleach');
copyDir(join(LSB_REPO, 'include'), join(LSB_OUT, 'include'));
copyDir(join(LSB_REPO, 'src'), join(LSB_OUT, 'src'), [
    'nlm_filter_avx.c',   // x86 AVX intrinsics — not WASM-portable
    'fft_transform.c',    // replaced by kissfft-based version at plugins root
]);
console.log('  ✓ libspecbleach (hierarchy preserved, AVX and fft_transform skipped)');

// ── 3. kissfft-based fft_transform.c replacement ─────────────────────────────
// Replaces FFTW3's R2HC / HC2R with kissfft complex FFT.
// Same API and normalization behavior (both forward and backward unnormalized).
// Half-complex format: hc[0]=DC, hc[k]=Re[k], hc[N-k]=Im[k], hc[N/2]=Nyquist.
writeFileSync(join(OUT, 'fft_transform.c'), `\
/* fft_transform.c — kissfft replacement for libspecbleach's FFTW3 dependency
 *
 * Emulates FFTW R2HC/HC2R half-complex format using kissfft complex FFT:
 *   hc[0]   = Re[X[0]]    (DC, always real)
 *   hc[k]   = Re[X[k]]    k = 1 .. N/2-1
 *   hc[N/2] = Re[X[N/2]]  (Nyquist, always real)
 *   hc[N-k] = Im[X[k]]    k = 1 .. N/2-1  (imaginary, stored in reverse)
 *
 * Normalization: both forward and backward unnormalized (backward scales by N),
 * matching FFTW_R2HC / FFTW_HC2R convention.
 */
#include "shared/stft/fft_transform.h"
#include "shared/utils/general_utils.h"
#include "kiss_fft.h"
#include <stdlib.h>
#include <string.h>

struct FftTransform {
  kiss_fft_cfg cfg_forward;
  kiss_fft_cfg cfg_backward;
  kiss_fft_cpx* cpx_in;
  kiss_fft_cpx* cpx_out;

  uint32_t fft_size;
  uint32_t frame_size;
  uint32_t zeropadding_amount;
  uint32_t copy_position;
  ZeroPaddingType padding_type;
  uint32_t padding_amount;
  float* input_fft_buffer;
  float* output_fft_buffer;
};

static uint32_t calculate_fft_size(FftTransform* self) {
  switch (self->padding_type) {
    case NO_PADDING:
      self->padding_amount = 0;
      return (uint32_t)get_next_divisible_two((int)self->frame_size);
    case NEXT_POWER_OF_TWO: {
      uint32_t p2 = (uint32_t)get_next_power_two((int)self->frame_size);
      self->padding_amount = p2 - self->frame_size;
      return p2;
    }
    case FIXED_AMOUNT:
      self->padding_amount = self->zeropadding_amount;
      return (uint32_t)get_next_divisible_two((int)(self->frame_size + self->padding_amount));
    default:
      return (uint32_t)get_next_divisible_two((int)self->frame_size);
  }
}

static bool allocate_bufs(FftTransform* self) {
  const uint32_t n = self->fft_size;
  self->cfg_forward   = kiss_fft_alloc((int)n, 0, NULL, NULL);
  self->cfg_backward  = kiss_fft_alloc((int)n, 1, NULL, NULL);
  self->cpx_in        = (kiss_fft_cpx*)calloc(n, sizeof(kiss_fft_cpx));
  self->cpx_out       = (kiss_fft_cpx*)calloc(n, sizeof(kiss_fft_cpx));
  self->input_fft_buffer  = (float*)calloc(n, sizeof(float));
  self->output_fft_buffer = (float*)calloc(n, sizeof(float));
  return self->cfg_forward && self->cfg_backward &&
         self->cpx_in && self->cpx_out &&
         self->input_fft_buffer && self->output_fft_buffer;
}

FftTransform* fft_transform_initialize(const uint32_t frame_size,
                                       const ZeroPaddingType padding_type,
                                       const uint32_t zeropadding_amount) {
  FftTransform* self = (FftTransform*)calloc(1U, sizeof(FftTransform));
  if (!self) return NULL;
  self->padding_type       = padding_type;
  self->zeropadding_amount = zeropadding_amount;
  self->frame_size         = frame_size;
  self->fft_size           = calculate_fft_size(self);
  self->copy_position      = (self->fft_size / 2U) - (self->frame_size / 2U);
  if (!allocate_bufs(self)) { fft_transform_free(self); return NULL; }
  return self;
}

FftTransform* fft_transform_initialize_bins(const uint32_t fft_size) {
  FftTransform* self = (FftTransform*)calloc(1U, sizeof(FftTransform));
  if (!self) return NULL;
  self->fft_size   = fft_size;
  self->frame_size = fft_size;
  if (!allocate_bufs(self)) { fft_transform_free(self); return NULL; }
  return self;
}

void fft_transform_free(FftTransform* self) {
  if (!self) return;
  kiss_fft_free(self->cfg_forward);
  kiss_fft_free(self->cfg_backward);
  free(self->cpx_in);
  free(self->cpx_out);
  free(self->input_fft_buffer);
  free(self->output_fft_buffer);
  free(self);
}

uint32_t get_fft_size(FftTransform* self) {
  return self ? self->fft_size : 0U;
}

uint32_t get_fft_real_spectrum_size(FftTransform* self) {
  return self ? (self->fft_size / 2U) + 1U : 0U;
}

bool fft_load_input_samples(FftTransform* self, const float* input) {
  if (!self || !input) return false;
  if (self->frame_size + self->copy_position > self->fft_size) return false;
  memset(self->input_fft_buffer, 0, self->fft_size * sizeof(float));
  for (uint32_t i = 0; i < self->frame_size; i++)
    self->input_fft_buffer[self->copy_position + i] = input[i];
  return true;
}

bool fft_get_output_samples(FftTransform* self, float* output) {
  if (!self || !output) return false;
  if (self->frame_size + self->copy_position > self->fft_size) return false;
  for (uint32_t i = 0; i < self->frame_size; i++)
    output[i] = self->input_fft_buffer[self->copy_position + i];
  return true;
}

bool compute_forward_fft(FftTransform* self) {
  if (!self) return false;
  const uint32_t n  = self->fft_size;
  const uint32_t n2 = n / 2U;

  for (uint32_t k = 0; k < n; k++) {
    self->cpx_in[k].r = self->input_fft_buffer[k];
    self->cpx_in[k].i = 0.0f;
  }
  kiss_fft(self->cfg_forward, self->cpx_in, self->cpx_out);

  // Pack to FFTW half-complex format
  self->output_fft_buffer[0]  = self->cpx_out[0].r;
  self->output_fft_buffer[n2] = self->cpx_out[n2].r;
  for (uint32_t k = 1; k < n2; k++) {
    self->output_fft_buffer[k]   = self->cpx_out[k].r;
    self->output_fft_buffer[n-k] = self->cpx_out[k].i;
  }
  return true;
}

bool compute_backward_fft(FftTransform* self) {
  if (!self) return false;
  const uint32_t n  = self->fft_size;
  const uint32_t n2 = n / 2U;

  // Unpack half-complex → full conjugate-symmetric complex
  self->cpx_in[0].r  = self->output_fft_buffer[0];
  self->cpx_in[0].i  = 0.0f;
  self->cpx_in[n2].r = self->output_fft_buffer[n2];
  self->cpx_in[n2].i = 0.0f;
  for (uint32_t k = 1; k < n2; k++) {
    self->cpx_in[k].r    = self->output_fft_buffer[k];
    self->cpx_in[k].i    = self->output_fft_buffer[n-k];
    self->cpx_in[n-k].r  = self->output_fft_buffer[k];
    self->cpx_in[n-k].i  = -self->output_fft_buffer[n-k];
  }

  // Backward FFT (unnormalized: result is N × original, matching FFTW HC2R)
  kiss_fft(self->cfg_backward, self->cpx_in, self->cpx_out);
  for (uint32_t k = 0; k < n; k++)
    self->input_fft_buffer[k] = self->cpx_out[k].r;
  return true;
}

float* get_fft_input_buffer(FftTransform* self)  { return self ? self->input_fft_buffer  : NULL; }
float* get_fft_output_buffer(FftTransform* self) { return self ? self->output_fft_buffer : NULL; }
`);
console.log('  ✓ fft_transform.c (kissfft-based replacement)');

// ── 4. noise-repellent plugin source files ────────────────────────────────────
// nrepellent.c uses "../src/noise_profile_state.h" (relative to plugins/);
// after flattening to the plugin root, patch to local includes.
const nrSrc = readFileSync(join(NR_REPO, 'plugins', 'nrepellent.c'), 'utf8')
    .replace(/["']\.\.\/src\/(noise_profile_state|signal_crossfade)\.h["']/g, '"$1.h"');
writeFileSync(join(OUT, 'nrepellent.c'), nrSrc);

for (const f of ['noise_profile_state.c', 'noise_profile_state.h',
                 'signal_crossfade.c', 'signal_crossfade.h']) {
    copyFileSync(join(NR_REPO, 'src', f), join(OUT, f));
}
console.log('  ✓ nrepellent.c (patched), noise_profile_state, signal_crossfade');

// ── 5. TTL files ──────────────────────────────────────────────────────────────
// manifest: only the nrepellent.wasm binary entry (mono plugin, index 0)
writeFileSync(join(OUT, 'manifest.ttl'), `\
@prefix lv2:  <http://lv2plug.in/ns/lv2core#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.

<https://github.com/lucianodato/noise-repellent#new>
  a lv2:Plugin ;
  lv2:binary <nrepellent.wasm> ;
  rdfs:seeAlso <nrepellent.ttl> .
`);

// nrepellent.ttl from template (version vars → 0)
let ttlSrc = readFileSync(join(NR_REPO, 'lv2ttl', 'nrepellent.ttl.in'), 'utf8')
    .replace(/@MINOR_VERSION@/g, '0')
    .replace(/@MICRO_VERSION@/g, '0');
writeFileSync(join(OUT, 'nrepellent.ttl'), ttlSrc);
console.log('  ✓ manifest.ttl, nrepellent.ttl');

// ── 6. Update lv2.json ────────────────────────────────────────────────────────
const lv2JsonPath = join(ROOT, 'plugins', 'lv2.json');
const registry = JSON.parse(readFileSync(lv2JsonPath, 'utf8'));

// Enumerate all libspecbleach .c sources (excluding AVX and fft_transform)
const SKIP_SRCS = new Set(['nlm_filter_avx.c', 'fft_transform.c']);
function collectSources(dir, base) {
    const results = [];
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
            results.push(...collectSources(full, base));
        } else if (name.endsWith('.c') && !SKIP_SRCS.has(name)) {
            results.push(relative(base, full));
        }
    }
    return results;
}

const lsbSources = collectSources(join(LSB_OUT, 'src'), OUT).sort();

const entry = {
    id: 'noise-repellent',
    description: 'Noise Repellent — broadband noise reduction (LV2)',
    category: 'Effects',
    includes: [
        'plugins/noise-repellent/libspecbleach/src',
        'plugins/noise-repellent/libspecbleach/include',
    ],
    sources: [
        'nrepellent.c',
        'noise_profile_state.c',
        'signal_crossfade.c',
        'kiss_fft.c',
        'fft_transform.c',
        ...lsbSources,
    ],
};

const existing = registry.findIndex(e => e.id === 'noise-repellent');
if (existing >= 0) registry[existing] = entry;
else registry.push(entry);
writeFileSync(lv2JsonPath, `${JSON.stringify(registry, null, 2)}\n`);

console.log(`  ✓ lv2.json (${entry.sources.length} sources)`);
console.log('\n✓ noise-repellent setup complete');
console.log('  Run: node scripts/build-instruments.js --only noise-repellent');
