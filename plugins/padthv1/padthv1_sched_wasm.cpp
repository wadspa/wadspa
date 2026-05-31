// padthv1_sched_wasm.cpp — synchronous WASM replacement for padthv1_sched.cpp
// All scheduling is synchronous and inline; no threads used in WASM.
#include "padthv1_sched.h"
#include <algorithm>
#include <map>
#include <vector>

// Registry of all active sched instances, grouped by padthv1* owner
static std::map<padthv1 *, std::vector<padthv1_sched *>> g_scheds;
// Registry of Notifier listeners, grouped by padthv1* owner
static std::map<padthv1 *, std::vector<padthv1_sched::Notifier *>> g_notifiers;

padthv1_sched::padthv1_sched(padthv1 *pPadth, Type stype, uint32_t nsize)
    : m_pPadth(pPadth), m_stype(stype), m_sync_wait(false)
{
    m_nsize  = (nsize < 4) ? 4 : nsize;
    m_nmask  = m_nsize - 1;
    m_items  = new int[m_nsize]();
    m_iread  = 0;
    m_iwrite = 0;
    g_scheds[pPadth].push_back(this);
}

padthv1_sched::~padthv1_sched()
{
    auto it = g_scheds.find(m_pPadth);
    if (it != g_scheds.end()) {
        auto &v = it->second;
        v.erase(std::remove(v.begin(), v.end(), this), v.end());
    }
    delete[] m_items;
}

padthv1 *padthv1_sched::instance() const { return m_pPadth; }

void padthv1_sched::schedule(int sid)
{
    const uint32_t w = (m_iwrite + 1) & m_nmask;
    if (w != m_iread) { m_items[m_iwrite] = sid; m_iwrite = w; }
    sync_process();
}

bool padthv1_sched::sync_wait() { return false; }

void padthv1_sched::sync_process()
{
    while (m_iread != m_iwrite) {
        const int sid = m_items[m_iread];
        m_iread = (m_iread + 1) & m_nmask;
        process(sid);
    }
}

void padthv1_sched::sync_notify(padthv1 *pPadth, Type stype, int sid)
{
    const auto it = g_notifiers.find(pPadth);
    if (it == g_notifiers.end()) return;
    for (auto *nb : it->second) nb->notify(stype, sid);
}

void padthv1_sched::sync_pending()
{
    for (auto &kv : g_scheds)
        for (auto *s : kv.second) s->sync_process();
}

void padthv1_sched::sync_reset()
{
    for (auto &kv : g_scheds)
        for (auto *s : kv.second) { s->m_iread = 0; s->m_iwrite = 0; }
}

padthv1_sched::Notifier::Notifier(padthv1 *pPadth)
    : m_pPadth(pPadth)
{
    g_notifiers[pPadth].push_back(this);
}

padthv1_sched::Notifier::~Notifier()
{
    auto it = g_notifiers.find(m_pPadth);
    if (it == g_notifiers.end()) return;
    auto &v = it->second;
    v.erase(std::remove(v.begin(), v.end(), this), v.end());
}
