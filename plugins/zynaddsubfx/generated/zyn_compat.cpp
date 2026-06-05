#include "Misc/XMLwrapper.h"
#include "Misc/Master.h"
#include "Misc/WavFile.h"
#include "Nio/Nio.h"
#include <rtosc/ports.h>
#include <algorithm>
#include <cstdlib>
#include <cstring>
#include <set>
#include <utility>

namespace zyn {
XmlNode::XmlNode(std::string name_) : name(std::move(name_)) {}
std::string &XmlNode::operator[](std::string key) {
    for (auto &attr : attrs) if (attr.name == key) return attr.value;
    attrs.push_back({key, ""});
    return attrs.back().value;
}
bool XmlNode::has(std::string key) {
    return std::any_of(attrs.begin(), attrs.end(), [&](const XmlAttr &attr) { return attr.name == key; });
}

XMLwrapper::XMLwrapper() : minimal(false), SaveFullXml(false), tree(nullptr), root(nullptr), node(nullptr), info(nullptr), _fileversion() {}
XMLwrapper::~XMLwrapper() = default;
int XMLwrapper::saveXMLfile(const std::string &, int) const { return -1; }
char *XMLwrapper::getXMLdata() const {
    const char *empty = R"xml(<!DOCTYPE ZynAddSubFX-data><ZynAddSubFX-data version-major="3" version-minor="0" version-revision="7"></ZynAddSubFX-data>)xml";
    char *out = static_cast<char *>(std::malloc(std::strlen(empty) + 1));
    std::strcpy(out, empty);
    return out;
}
void XMLwrapper::addpar(const std::string &, int) {}
void XMLwrapper::addparreal(const std::string &, float) {}
void XMLwrapper::addparbool(const std::string &, int) {}
void XMLwrapper::addparstr(const std::string &, const std::string &) {}
void XMLwrapper::beginbranch(const std::string &) {}
void XMLwrapper::beginbranch(const std::string &, int) {}
void XMLwrapper::endbranch() {}
int XMLwrapper::loadXMLfile(const std::string &) { return -1; }
bool XMLwrapper::putXMLdata(const char *) { return false; }
int XMLwrapper::enterbranch(const std::string &) { return 0; }
int XMLwrapper::enterbranch(const std::string &, int) { return 0; }
void XMLwrapper::exitbranch() {}
int XMLwrapper::getbranchid(int min, int) const { return min; }
int XMLwrapper::getpar(const std::string &, int defaultpar, int, int) const { return defaultpar; }
int XMLwrapper::getpar127(const std::string &, int defaultpar) const { return defaultpar; }
bool XMLwrapper::getparbool(const std::string &, bool defaultpar) const { return defaultpar; }
void XMLwrapper::getparstr(const std::string &, char *par, int maxstrlen) const { if (maxstrlen > 0) par[0] = 0; }
std::string XMLwrapper::getparstr(const std::string &, const std::string &defaultpar) const { return defaultpar; }
bool XMLwrapper::hasparreal(const char *) const { return false; }
float XMLwrapper::getparreal(const char *, float defaultpar) const { return defaultpar; }
float XMLwrapper::getparreal(const char *, float defaultpar, float, float) const { return defaultpar; }
void XMLwrapper::setPadSynth(bool) {}
bool XMLwrapper::hasPadSynth() const { return false; }
void XMLwrapper::add(const XmlNode &) {}
std::vector<XmlNode> XMLwrapper::getBranch() const { return {}; }

extern const rtosc::Ports preset_ports = {};
extern const rtosc::Ports real_preset_ports = {};
extern const rtosc::Ports bankPorts = {};

namespace Nio {
bool autoConnect = false;
bool pidInClientName = false;
std::string defaultSource = "null";
std::string defaultSink = "null";
void init(const SYNTH_T &, const oss_devs_t &, Master *) {}
bool start() { return true; }
void stop() {}
void setDefaultSource(std::string name) { defaultSource = name; }
void setDefaultSink(std::string name) { defaultSink = name; }
bool setSource(std::string name) { defaultSource = name; return true; }
bool setSink(std::string name) { defaultSink = name; return true; }
void setPostfix(std::string) {}
std::string getPostfix() { return ""; }
std::set<std::string> getSources() { return {"null"}; }
std::set<std::string> getSinks() { return {"null"}; }
std::string getSource() { return defaultSource; }
std::string getSink() { return defaultSink; }
void preferredSampleRate(unsigned &) {}
void masterSwap(Master *) {}
void waveNew(WavFile *) {}
void waveStart() {}
void waveStop() {}
void waveEnd() {}
void setAudioCompressor(bool) {}
bool getAudioCompressor() { return false; }
}
}
