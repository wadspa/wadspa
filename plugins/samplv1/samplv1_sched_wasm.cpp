// samplv1_sched_wasm.cpp — synchronous WASM replacement for samplv1_sched.cpp
#include "samplv1_sched.h"
#include <algorithm>
#include <map>
#include <vector>

static std::map<samplv1 *, std::vector<samplv1_sched *>> g_scheds;
static std::map<samplv1 *, std::vector<samplv1_sched::Notifier *>> g_notifiers;

samplv1_sched::samplv1_sched(samplv1 *pSampl, Type stype, uint32_t nsize)
    : m_pSampl(pSampl), m_stype(stype), m_sync_wait(false)
{
    m_nsize  = (nsize < 4) ? 4 : nsize;
    m_nmask  = m_nsize - 1;
    m_items  = new int[m_nsize]();
    m_iread  = 0;
    m_iwrite = 0;
    g_scheds[pSampl].push_back(this);
}

samplv1_sched::~samplv1_sched()
{
    auto it = g_scheds.find(m_pSampl);
    if (it != g_scheds.end()) {
        auto &v = it->second;
        v.erase(std::remove(v.begin(), v.end(), this), v.end());
    }
    delete[] m_items;
}

samplv1 *samplv1_sched::instance() const { return m_pSampl; }

void samplv1_sched::schedule(int sid)
{
    const uint32_t w = (m_iwrite + 1) & m_nmask;
    if (w != m_iread) { m_items[m_iwrite] = sid; m_iwrite = w; }
    sync_process();
}

bool samplv1_sched::sync_wait() { return false; }

void samplv1_sched::sync_process()
{
    while (m_iread != m_iwrite) {
        const int sid = m_items[m_iread];
        m_iread = (m_iread + 1) & m_nmask;
        process(sid);
    }
}

void samplv1_sched::sync_notify(samplv1 *pSampl, Type stype, int sid)
{
    const auto it = g_notifiers.find(pSampl);
    if (it == g_notifiers.end()) return;
    for (auto *nb : it->second) nb->notify(stype, sid);
}

void samplv1_sched::sync_pending()
{
    for (auto &kv : g_scheds)
        for (auto *s : kv.second) s->sync_process();
}

void samplv1_sched::sync_reset()
{
    for (auto &kv : g_scheds)
        for (auto *s : kv.second) { s->m_iread = 0; s->m_iwrite = 0; }
}

samplv1_sched::Notifier::Notifier(samplv1 *pSampl) : m_pSampl(pSampl)
{
    g_notifiers[pSampl].push_back(this);
}

samplv1_sched::Notifier::~Notifier()
{
    auto it = g_notifiers.find(m_pSampl);
    if (it == g_notifiers.end()) return;
    auto &v = it->second;
    v.erase(std::remove(v.begin(), v.end(), this), v.end());
}
