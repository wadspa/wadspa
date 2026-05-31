// drumkv1_sample_stub.cpp — libsndfile-free sample implementation.
// open() generates 0.5s of white noise so drums are audible without files.
#include "drumkv1_sample.h"
#include <cstdlib>
#include <cstring>
#include <cmath>

// ── drumkv1_sample ──────────────────────────────────────────────────────────

drumkv1_sample::drumkv1_sample(float srate)
    : m_srate(srate), m_filename(nullptr), m_nchannels(0),
      m_rate0(srate), m_freq0(440.0f), m_ratio(1.0f), m_nframes(0),
      m_pframes(nullptr), m_reverse(false),
      m_offset(false), m_offset_start(0), m_offset_end(0),
      m_offset_phase0(0.0f), m_offset_end2(0) {}

drumkv1_sample::drumkv1_sample(const drumkv1_sample& s)
    : m_srate(s.m_srate), m_filename(nullptr), m_nchannels(0),
      m_rate0(s.m_rate0), m_freq0(s.m_freq0), m_ratio(s.m_ratio),
      m_nframes(0), m_pframes(nullptr),
      m_reverse(false), m_offset(false),
      m_offset_start(0), m_offset_end(0),
      m_offset_phase0(0.0f), m_offset_end2(0)
{
    if (s.m_filename) open(s.m_filename, s.m_freq0);
}

drumkv1_sample::~drumkv1_sample() { close(); }

bool drumkv1_sample::open(const char *filename, float freq0)
{
    close();

    // Generate a short (0.5s) white-noise burst as placeholder sample.
    const uint32_t nframes = (uint32_t)(m_srate * 0.5f) + 4; // +4 for interp guard
    m_nchannels = 1;
    m_rate0     = m_srate;
    m_freq0     = freq0 > 0.0f ? freq0 : 440.0f;
    m_ratio     = m_rate0 / (m_freq0 * m_srate);
    m_nframes   = nframes;

    m_pframes = new float *[1];
    m_pframes[0] = new float[nframes + 4](); // +4 for hermite overread
    // Fill with white noise, amplitude decays over time
    unsigned rng = 0x12345678u;
    for (uint32_t i = 0; i < nframes; ++i) {
        rng = rng * 1664525u + 1013904223u;
        float n = (float)(int)rng / 2147483648.0f; // -1..1
        float env = 1.0f - (float)i / (float)nframes;
        m_pframes[0][i] = n * env * 0.5f;
    }

    // Store filename
    if (filename) {
        size_t len = ::strlen(filename);
        m_filename = new char[len + 1];
        ::memcpy(m_filename, filename, len + 1);
    }

    m_offset_start = 0;
    m_offset_end   = m_nframes;
    m_offset_end2  = m_nframes;
    m_offset_phase0 = 0.0f;
    m_reverse = false;
    m_offset  = false;

    return true;
}

void drumkv1_sample::close()
{
    if (m_pframes) {
        for (uint16_t k = 0; k < m_nchannels; ++k) delete[] m_pframes[k];
        delete[] m_pframes;
        m_pframes = nullptr;
    }
    delete[] m_filename;
    m_filename  = nullptr;
    m_nchannels = 0;
    m_nframes   = 0;
    m_offset_start = m_offset_end = m_offset_end2 = 0;
}

void drumkv1_sample::setOffsetRange(uint32_t start, uint32_t end)
{
    m_offset_start = start;
    m_offset_end   = end < m_nframes ? end : m_nframes;
    updateOffset();
}

void drumkv1_sample::updateOffset()
{
    m_offset_end2   = m_offset ? m_offset_end : m_nframes;
    m_offset_phase0 = m_offset ? (float)m_offset_start : 0.0f;
}

void drumkv1_sample::reverse_sync()
{
    if (!m_pframes || m_nframes == 0) return;
    for (uint16_t k = 0; k < m_nchannels; ++k) {
        float *f = m_pframes[k];
        uint32_t lo = 0, hi = m_nframes - 1;
        while (lo < hi) { float t = f[lo]; f[lo++] = f[hi]; f[hi--] = t; }
    }
}

uint32_t drumkv1_sample::zero_crossing(uint32_t i, int *slope) const
{
    if (!m_pframes || !m_pframes[0]) { if (slope) *slope = 0; return i; }
    const float *f = m_pframes[0];
    while (i + 1 < m_nframes) {
        if (f[i] <= 0.0f && f[i+1] > 0.0f) { if (slope) *slope = +1; return i; }
        if (f[i] >= 0.0f && f[i+1] < 0.0f) { if (slope) *slope = -1; return i; }
        ++i;
    }
    if (slope) *slope = 0;
    return i;
}

float drumkv1_sample::zero_crossing_k(uint32_t i) const
{
    if (!m_pframes || !m_pframes[0] || i + 1 >= m_nframes) return 0.0f;
    const float *f = m_pframes[0];
    const float denom = f[i+1] - f[i];
    return denom != 0.0f ? -f[i] / denom : 0.0f;
}
