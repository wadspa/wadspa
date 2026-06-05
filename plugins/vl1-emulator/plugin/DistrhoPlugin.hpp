#pragma once

#include <cstdint>

#define DISTRHO_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(ClassName)
#define DISTRHO_SAFE_ASSERT(cond) do { (void)sizeof(cond); } while (0)
#define DISTRHO_SAFE_ASSERT_RETURN(cond, ret) do { if (!(cond)) return ret; } while (0)

#ifndef d_version
#define d_version(major, minor, micro) (((uint32_t)(major) << 16) | ((uint32_t)(minor) << 8) | (uint32_t)(micro))
#endif

#ifndef d_cconst
#define d_cconst(a, b, c, d) ((((int64_t)(a)) << 24) | (((int64_t)(b)) << 16) | (((int64_t)(c)) << 8) | ((int64_t)(d)))
#endif

using uint = unsigned int;

namespace DISTRHO {

enum ParameterHints {
    kParameterIsAutomable = 1u << 0,
    kParameterIsInteger = 1u << 1,
};

struct AudioPort {
    const char* symbol = nullptr;
    const char* name = nullptr;
};

struct ParameterRanges {
    float def = 0.0f;
    float min = 0.0f;
    float max = 1.0f;
};

struct ParameterEnumerationValue {
    float value = 0.0f;
    const char* label = nullptr;
};

struct ParameterEnumerationValues {
    ParameterEnumerationValue* values = nullptr;
    uint32_t count = 0;
    bool restrictedMode = false;
};

struct Parameter {
    const char* symbol = nullptr;
    const char* name = nullptr;
    const char* unit = nullptr;
    uint32_t hints = 0;
    ParameterRanges ranges;
    ParameterEnumerationValues enumValues;
};

class String {
public:
    String& operator=(const char* value)
    {
        text = value;
        return *this;
    }

    operator const char*() const { return text; }

private:
    const char* text = "";
};

struct MidiEvent {
    uint32_t frame = 0;
    uint32_t size = 0;
    uint8_t data[4] = {};
};

class Plugin {
public:
    Plugin(uint32_t parameterCount, uint32_t programCount, uint32_t stateCount)
        : parameterCount(parameterCount), programCount(programCount), stateCount(stateCount)
    {
    }

    virtual ~Plugin() = default;

    double getSampleRate() const noexcept { return sampleRate_; }

protected:
    virtual const char* getLabel() const noexcept { return ""; }
    virtual const char* getDescription() const { return ""; }
    virtual const char* getMaker() const noexcept { return ""; }
    virtual const char* getHomePage() const { return ""; }
    virtual const char* getLicense() const noexcept { return ""; }
    virtual uint32_t getVersion() const noexcept { return 0; }
    virtual int64_t getUniqueId() const noexcept { return 0; }
    virtual void initAudioPort(bool, uint32_t, AudioPort&) {}
    virtual void initParameter(uint32_t, Parameter&) {}
    virtual void initProgramName(uint32_t, String&) {}
    virtual float getParameterValue(uint32_t) const { return 0.0f; }
    virtual void setParameterValue(uint32_t, float) {}
    virtual void loadProgram(uint32_t) {}
    virtual void sampleRateChanged(double) {}
    virtual void activate() {}
    virtual void deactivate() {}
    virtual void run(const float**, float**, uint32_t, const MidiEvent*, uint32_t) {}

    double sampleRate_ = 44100.0;
    uint32_t parameterCount = 0;
    uint32_t programCount = 0;
    uint32_t stateCount = 0;
};

Plugin* createPlugin();

} // namespace DISTRHO

using DISTRHO::AudioPort;
using DISTRHO::MidiEvent;
using DISTRHO::Parameter;
using DISTRHO::ParameterEnumerationValue;
using DISTRHO::ParameterEnumerationValues;
using DISTRHO::Plugin;
using DISTRHO::String;
using DISTRHO::kParameterIsAutomable;
using DISTRHO::kParameterIsInteger;
