#ifndef ZYN_VERSION_H
#define ZYN_VERSION_H
#include <iosfwd>
namespace zyn {
class version_type {
    char version[3];
    constexpr int v_strcmp(const version_type& v2, int i) const {
        return (i == 3) ? 0 : ((version[i] == v2.version[i]) ? v_strcmp(v2, i + 1) : (version[i] - v2.version[i]));
    }
public:
    constexpr version_type(char maj, char min, char rev) : version{maj, min, rev} {}
    constexpr version_type() : version_type(3, 0, 7) {}
    void set_major(int maj) { version[0] = static_cast<char>(maj); }
    void set_minor(int min) { version[1] = static_cast<char>(min); }
    void set_revision(int rev) { version[2] = static_cast<char>(rev); }
    int get_major() const { return version[0]; }
    int get_minor() const { return version[1]; }
    int get_revision() const { return version[2]; }
    constexpr bool operator<(const version_type& other) const { return v_strcmp(other, 0) < 0; }
    constexpr bool operator>=(const version_type& other) const { return !operator<(other); }
    friend std::ostream& operator<<(std::ostream& os, const version_type& v);
};
constexpr version_type version;
}
#endif
