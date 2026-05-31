#include "filesystem.h"
filesystem& filesystem::get() { static filesystem fs; return fs; }
filesystem::filesystem() {}
bool filesystem::copy(const std::string&, const std::string&) { return false; }
bool filesystem::create_dir(const std::string&) { return false; }
bool filesystem::exists(const std::string&) { return false; }
bool filesystem::move(const std::string&, const std::string&) { return false; }
