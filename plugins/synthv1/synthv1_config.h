#pragma once
#include "config.h"
#include <QString>

// Forward decls expected by synthv1.cpp
class synthv1_controls;
class synthv1_programs;

// Qt-free stub: replaces the QSettings-based synthv1_config for WASM builds.
// All preset/tuning file I/O is disabled; tuning is always standard 12-TET.
class synthv1_config {
public:
    synthv1_config()
        : bTuningEnabled(false),
          fTuningRefPitch(440.0f),
          iTuningRefNote(69) {}

    ~synthv1_config() {}

    // Micro-tuning: disabled by default so synthv1.cpp skips all file I/O.
    bool    bTuningEnabled;
    float   fTuningRefPitch;
    int     iTuningRefNote;
    QString sTuningKeyMapFile;   // isEmpty() == true by default
    QString sTuningScaleFile;    // isEmpty() == true by default

    // Config load/save — no-ops for WASM
    void loadControls(synthv1_controls *) {}
    void loadPrograms(synthv1_programs *) {}
    void savePrograms(synthv1_programs *) {}

    static synthv1_config *getInstance() { return nullptr; }
};
