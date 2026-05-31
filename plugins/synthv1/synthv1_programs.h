#pragma once
#include <cstdint>

// Forward decl — full definition not needed in the WASM stub.
class synthv1;

// Qt-free stub: replaces the QMap-based bank/program database.
// Program changes and bank selects are silently ignored in WASM builds.
class synthv1_programs {
public:
    explicit synthv1_programs(synthv1 *) : m_enabled(false) {}
    ~synthv1_programs() {}

    void enabled(bool on) { m_enabled = on; }
    bool enabled() const  { return m_enabled; }

    void prog_change(int) {}
    void bank_select_msb(uint8_t) {}
    void bank_select_lsb(uint8_t) {}

private:
    bool m_enabled;
};
