#include "synthv1_tuning.h"
#include <cmath>

synthv1_tuning::synthv1_tuning(float refPitch, int refNote)
    : m_refPitch(refPitch), m_refNote(refNote),
      m_zeroNote(0), m_mapRepeatInc(1), m_basePitch(0.0f)
{
    reset(refPitch, refNote);
}

void synthv1_tuning::reset(float refPitch, int refNote)
{
    m_refPitch    = refPitch;
    m_refNote     = refNote;
    m_zeroNote    = 0;
    m_mapRepeatInc = 12;

    m_scale.clear();
    for (int i = 0; i < 12; ++i)
        m_scale.push_back(::powf(2.0f, (i + 1) / 12.0f));

    m_mapping.clear();
    m_mapping.push_back(0);

    updateBasePitch();
}

bool synthv1_tuning::loadKeyMapFile(const QString &)  { return false; }
bool synthv1_tuning::loadScaleFile(const QString &)   { return false; }

float synthv1_tuning::parseScaleLine(const QString &) const { return 0.0f; }

void synthv1_tuning::updateBasePitch()
{
    m_basePitch = m_refPitch / ::powf(2.0f, float(m_refNote) / 12.0f);
}

float synthv1_tuning::noteToPitch(int note) const
{
    if (note < 0 || note > 127 || m_mapping.empty())
        return m_refPitch * ::powf(2.0f, (note - m_refNote) / 12.0f);

    const int mapSize  = (int)m_mapping.size();
    const int mapIndex = ((note - m_zeroNote) % mapSize + mapSize) % mapSize;
    const int nRepeats = (note - m_zeroNote - mapIndex) / mapSize;

    if (m_mapping.at(mapIndex) < 0)
        return -1.0f; // unmapped note

    const int scaleDegree = nRepeats * m_mapRepeatInc + m_mapping.at(mapIndex);
    const int scaleSize   = (int)m_scale.size();

    if (scaleSize == 0)
        return m_refPitch * ::powf(2.0f, (note - m_refNote) / 12.0f);

    const int   nOctaves   = scaleDegree / scaleSize;
    const int   scaleIndex = scaleDegree % scaleSize;
    const float octavePitch
        = m_basePitch * ::powf(m_scale.at(scaleSize - 1), nOctaves);

    return (scaleIndex == 0) ? octavePitch
        : octavePitch * m_scale.at(scaleIndex - 1);
}
