// samplv1_sample.cpp — WASM stub: generates a sine-wave sample instead of loading a file.
#include "samplv1_sample.h"
#include <cmath>
#include <cstring>
#include <cstdlib>

samplv1_sample::samplv1_sample(float srate)
    : m_srate(srate), m_ntabs(1),
      m_filename(nullptr), m_nchannels(0),
      m_rate0(srate), m_freq0(440.0f), m_ratio(1.0f),
      m_nframes(0), m_pframes(nullptr), m_reverse(false),
      m_offset(false), m_offset_start(0), m_offset_end(0),
      m_offset_phase0(nullptr), m_offset_end2(0),
      m_loop(false), m_loop_start(0), m_loop_end(0),
      m_loop_phase1(nullptr), m_loop_phase2(nullptr),
      m_loop_xfade(0), m_loop_xzero(false), m_loop_end_release(false)
{}

samplv1_sample::samplv1_sample(const samplv1_sample& s)
    : m_srate(s.m_srate), m_ntabs(0),
      m_filename(nullptr), m_nchannels(0),
      m_rate0(s.m_rate0), m_freq0(s.m_freq0), m_ratio(s.m_ratio),
      m_nframes(0), m_pframes(nullptr), m_reverse(s.m_reverse),
      m_offset(s.m_offset), m_offset_start(s.m_offset_start), m_offset_end(s.m_offset_end),
      m_offset_phase0(nullptr), m_offset_end2(s.m_offset_end2),
      m_loop(s.m_loop), m_loop_start(s.m_loop_start), m_loop_end(s.m_loop_end),
      m_loop_phase1(nullptr), m_loop_phase2(nullptr),
      m_loop_xfade(s.m_loop_xfade), m_loop_xzero(s.m_loop_xzero),
      m_loop_end_release(s.m_loop_end_release)
{}

samplv1_sample::~samplv1_sample() { close(); }

bool samplv1_sample::open(const char *filename, float freq0, uint16_t /*otabs*/)
{
    close();
    m_filename  = ::strdup(filename ? filename : "");
    m_freq0     = (freq0 > 0.0f ? freq0 : 440.0f);
    m_rate0     = 44100.0f;

    // Allocate: 1 tab, 1 channel, 256 frames — float ***m_pframes[tab][ch][frame]
    const uint32_t N = 256;
    m_ntabs     = 1;
    m_nchannels = 1;
    m_nframes   = N;

    m_pframes       = new float **[m_ntabs];
    m_pframes[0]    = new float  *[m_nchannels];
    m_pframes[0][0] = new float   [N];

    for (uint32_t i = 0; i < N; ++i)
        m_pframes[0][0][i] = 0.5f * sinf(2.0f * float(M_PI) * i / N);

    m_ratio       = m_rate0 / (m_freq0 * m_srate);
    m_offset_end  = N;
    m_offset_end2 = N;
    return true;
}

void samplv1_sample::close()
{
    if (m_pframes) {
        for (uint16_t t = 0; t < m_ntabs; ++t) {
            if (m_pframes[t]) {
                for (uint16_t k = 0; k < m_nchannels; ++k)
                    delete[] m_pframes[t][k];
                delete[] m_pframes[t];
            }
        }
        delete[] m_pframes;
        m_pframes = nullptr;
    }
    if (m_filename) { ::free(m_filename); m_filename = nullptr; }
    m_nframes   = 0;
    m_nchannels = 0;

    delete[] m_offset_phase0; m_offset_phase0 = nullptr;
    delete[] m_loop_phase1;   m_loop_phase1   = nullptr;
    delete[] m_loop_phase2;   m_loop_phase2   = nullptr;
}

void samplv1_sample::setOffsetRange(uint32_t start, uint32_t end)
{
    m_offset_start = start;
    m_offset_end   = end;
    updateOffset();
}

void samplv1_sample::setLoopRange(uint32_t start, uint32_t end)
{
    m_loop_start = start;
    m_loop_end   = end;
    updateLoop();
}

void samplv1_sample::reverse_sync() {}

uint32_t samplv1_sample::zero_crossing(uint16_t /*itab*/, uint32_t i, int * /*slope*/) const
{
    return i;
}

float samplv1_sample::zero_crossing_k(uint16_t /*itab*/, uint32_t /*i*/) const
{
    return 0.0f;
}

void samplv1_sample::updateOffset()
{
    m_offset_end2 = m_offset ? m_offset_end : m_nframes;
}

void samplv1_sample::updateLoop() {}
