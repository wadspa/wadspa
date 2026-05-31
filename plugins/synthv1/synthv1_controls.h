#pragma once

// Forward decl — full definition not needed in the WASM stub.
class synthv1;

// Qt-free stub: replaces the QMap-based MIDI CC controller database.
// Controller events are silently dropped in WASM builds; parameters are
// still settable through LV2 control ports.
class synthv1_controls {
public:
    explicit synthv1_controls(synthv1 *) : m_enabled(false) {}
    ~synthv1_controls() {}

    void enabled(bool on) { m_enabled = on; }
    bool enabled() const  { return m_enabled; }

    void process_enqueue(unsigned short, unsigned short, unsigned short) {}
    void process_dequeue() {}
    void reset() {}
    void process(unsigned int) {}

private:
    bool m_enabled;
};
