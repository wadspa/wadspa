#include "synthv1_sched.h"
#include <cstring>

synthv1_sched::synthv1_sched(synthv1 *pSynth, Type stype, uint32_t nsize)
    : m_pSynth(pSynth), m_stype(stype), m_sync_wait(false)
{
    m_nsize = 8;
    while (m_nsize < nsize) m_nsize <<= 1;
    m_nmask = m_nsize - 1;
    m_items = new int[m_nsize];
    ::memset(m_items, 0, m_nsize * sizeof(int));
    m_iread = m_iwrite = 0;
}

synthv1_sched::~synthv1_sched()
{
    delete[] m_items;
}

synthv1 *synthv1_sched::instance() const
{
    return m_pSynth;
}

void synthv1_sched::schedule(int sid)
{
    uint32_t w = (m_iwrite + 1) & m_nmask;
    if (w != m_iread) {
        m_items[m_iwrite] = sid;
        m_iwrite = w;
    }
    // Synchronous: flush the queue immediately on the calling thread.
    sync_process();
}

bool synthv1_sched::sync_wait()
{
    const bool was = m_sync_wait;
    if (!was) m_sync_wait = true;
    return was;
}

void synthv1_sched::sync_process()
{
    uint32_t r = m_iread;
    while (r != m_iwrite) {
        const int sid = m_items[r];
        process(sid);
        m_items[r] = 0;
        ++r &= m_nmask;
    }
    m_iread = r;
    m_sync_wait = false;
}

void synthv1_sched::sync_notify(synthv1 *, Type, int) {}
void synthv1_sched::sync_pending() {}
void synthv1_sched::sync_reset() {}

synthv1_sched::Notifier::Notifier(synthv1 *) {}
synthv1_sched::Notifier::~Notifier() {}
