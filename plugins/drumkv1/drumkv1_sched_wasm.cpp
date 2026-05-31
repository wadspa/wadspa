// drumkv1_sched_wasm.cpp — synchronous WASM replacement for drumkv1_sched.cpp
// All scheduled work is executed inline (no threads in WASM).
#include "drumkv1_sched.h"
#include <cstring>
#include <map>
#include <vector>

static std::map<drumkv1 *, std::vector<drumkv1_sched::Notifier *>> g_notifiers;

drumkv1_sched::drumkv1_sched(drumkv1 *pDrumk, Type stype, uint32_t nsize)
    : m_pDrumk(pDrumk), m_stype(stype), m_sync_wait(false)
{
    m_nsize = 8;
    while (m_nsize < nsize) m_nsize <<= 1;
    m_nmask = m_nsize - 1;
    m_items = new int[m_nsize]();
    m_iread = m_iwrite = 0;
}

drumkv1_sched::~drumkv1_sched()
{
    delete[] m_items;
}

drumkv1 *drumkv1_sched::instance() const { return m_pDrumk; }

void drumkv1_sched::schedule(int sid)
{
    const uint32_t w = (m_iwrite + 1) & m_nmask;
    if (w != m_iread) { m_items[m_iwrite] = sid; m_iwrite = w; }
    sync_process();
}

bool drumkv1_sched::sync_wait()
{
    bool was = m_sync_wait;
    if (!was) m_sync_wait = true;
    return was;
}

void drumkv1_sched::sync_process()
{
    uint32_t r = m_iread;
    while (r != m_iwrite) {
        const int sid = m_items[r];
        process(sid);
        sync_notify(m_pDrumk, m_stype, sid);
        m_items[r] = 0;
        ++r &= m_nmask;
    }
    m_iread = r;
    m_sync_wait = false;
}

void drumkv1_sched::sync_notify(drumkv1 *pDrumk, Type stype, int sid)
{
    auto it = g_notifiers.find(pDrumk);
    if (it == g_notifiers.end()) return;
    for (auto *n : it->second) n->notify(stype, sid);
}

void drumkv1_sched::sync_pending() {}
void drumkv1_sched::sync_reset()   {}

drumkv1_sched::Notifier::Notifier(drumkv1 *pDrumk) : m_pDrumk(pDrumk)
{
    g_notifiers[pDrumk].push_back(this);
}

drumkv1_sched::Notifier::~Notifier()
{
    auto it = g_notifiers.find(m_pDrumk);
    if (it == g_notifiers.end()) return;
    auto &v = it->second;
    v.erase(std::remove(v.begin(), v.end(), this), v.end());
    if (v.empty()) g_notifiers.erase(it);
}
