#pragma once
#include <cstdint>
#include <cstring>
#include <cstdio>
#include <cstdarg>

// ── Basic Qt types ──────────────────────────────────────────────────────────
using qreal     = double;
using qint8     = int8_t;   using quint8  = uint8_t;
using qint16    = int16_t;  using quint16 = uint16_t;
using qint32    = int32_t;  using quint32 = uint32_t;
using qint64    = int64_t;  using quint64 = uint64_t;
using qlonglong = long long;  using qulonglong = unsigned long long;
using uchar     = unsigned char;
using uint      = unsigned int;
using ulong     = unsigned long;

// ── Q_OBJECT and signal/slot macros ─────────────────────────────────────────
#define Q_OBJECT
#define Q_GADGET
#define signals   public
#define slots
#define emit
#define Q_SIGNALS public
#define Q_SLOTS
#define Q_EMIT
#define Q_CLASSINFO(a, b)
#define Q_ENUMS(x)
#define Q_FLAGS(x)
#define Q_PROPERTY(...)

// ── Utility macros ──────────────────────────────────────────────────────────
#define Q_UNUSED(x)           (void)(x)
#define Q_ASSERT(cond)        ((void)0)
#define Q_ASSERT_X(c,w,m)    ((void)0)
#define Q_DISABLE_COPY(C)     C(const C &) = delete; C &operator=(const C &) = delete;
#define Q_DECLARE_PRIVATE(C)
#define Q_DECLARE_PUBLIC(C)
#define Q_D(C)                C##Private * const d = nullptr; Q_UNUSED(d)
#define Q_Q(C)                C * const q = nullptr; Q_UNUSED(q)
#define Q_DECLARE_METATYPE(T)
#define Q_DECLARE_FLAGS(F,E)  using F = unsigned int;
#define Q_DECLARE_OPERATORS_FOR_FLAGS(F)
#define QT_BEGIN_NAMESPACE
#define QT_END_NAMESPACE
#define QT_USE_NAMESPACE
#define Q_DECL_OVERRIDE   override
#define Q_DECL_FINAL      final
#define Q_DECL_DEPRECATED [[deprecated]]
#define Q_LIKELY(x)   (x)
#define Q_UNLIKELY(x) (x)
#define Q_NULLPTR     nullptr
#define Q_CONSTEXPR   constexpr
#define Q_NOEXCEPT    noexcept
#define Q_STATIC_ASSERT(x) static_assert(x, #x)
#define Q_STATIC_ASSERT_X(x,m) static_assert(x, m)
#define Q_GLOBAL_STATIC(Type, name) static Type *name() { static Type t; return &t; }
#define Q_GLOBAL_STATIC_WITH_ARGS(Type, name, args) static Type *name() { static Type t args; return &t; }
#define QT_VERSION_CHECK(ma,mi,pa) ((ma<<16)|(mi<<8)|pa)
#define QT_VERSION QT_VERSION_CHECK(5,15,0)

// ── Foreach ─────────────────────────────────────────────────────────────────
#define Q_FOREACH(variable, container) for (auto variable : container)
#define foreach(variable, container)   for (auto variable : container)

// ── Debug output (swallowed) ─────────────────────────────────────────────────
__attribute__((format(printf,1,2)))
inline void qDebug   (const char *, ...) {}
__attribute__((format(printf,1,2)))
inline void qWarning (const char *, ...) {}
__attribute__((format(printf,1,2)))
inline void qCritical(const char *, ...) {}
inline void qFatal   (const char *) {}

// ── Qt namespace ─────────────────────────────────────────────────────────────
namespace Qt {
    enum CaseSensitivity { CaseInsensitive = 0, CaseSensitive = 1 };
    enum MatchFlag { MatchExactly = 0, MatchFixedString = 8, MatchContains = 1,
                     MatchStartsWith = 2, MatchEndsWith = 3, MatchCaseSensitive = 16,
                     MatchRegExp = 4, MatchWildcard = 5, MatchWrap = 32 };
    using MatchFlags = unsigned int;
    enum SortOrder { AscendingOrder = 0, DescendingOrder = 1 };
    enum ConnectionType { AutoConnection = 0, DirectConnection = 1,
                          QueuedConnection = 2, BlockingQueuedConnection = 3,
                          UniqueConnection = 0x80 };
    enum Orientation { Horizontal = 1, Vertical = 2 };
    enum AlignmentFlag { AlignLeft = 1, AlignRight = 2, AlignHCenter = 4,
                         AlignTop = 32, AlignBottom = 64, AlignVCenter = 128 };
    using Alignment = unsigned int;
    enum ItemDataRole { DisplayRole = 0, EditRole = 2, CheckStateRole = 10,
                        UserRole = 256 };
    enum ItemFlag { ItemIsSelectable = 1, ItemIsEditable = 2, ItemIsEnabled = 32 };
    using ItemFlags = unsigned int;
    enum CheckState { Unchecked = 0, PartiallyChecked = 1, Checked = 2 };
    enum GlobalColor { black = 2, white = 3, red = 7, green = 8, blue = 9 };
    enum WindowModality { NonModal = 0, WindowModal = 1, ApplicationModal = 2 };
    enum Key { Key_Enter = 0x01000005, Key_Return = 0x01000004, Key_Escape = 0x01000000 };
    enum KeyboardModifier { NoModifier = 0, ShiftModifier = 1, ControlModifier = 2,
                            AltModifier = 4, MetaModifier = 8 };
    using KeyboardModifiers = unsigned int;
    enum MouseButton { NoButton = 0, LeftButton = 1, RightButton = 2, MiddleButton = 4 };
    using MouseButtons = unsigned int;
    enum ScrollBarPolicy { ScrollBarAsNeeded = 0, ScrollBarAlwaysOff = 1 };
    enum ToolButtonStyle { ToolButtonIconOnly = 0, ToolButtonTextOnly = 1,
                           ToolButtonTextBesideIcon = 2 };
    enum TextInteractionFlag { NoTextInteraction = 0, TextSelectableByMouse = 1 };
    using TextInteractionFlags = unsigned int;
    enum WrapMode { NoWrap = 0, WordWrap = 1 };
    enum Edge { TopEdge = 1, LeftEdge = 2, RightEdge = 4, BottomEdge = 8 };
    using Edges = unsigned int;
    // Application attributes (mirrors QCoreApplication::ApplicationAttribute)
    enum ApplicationAttribute {
        AA_ImmediateWidgetCreation       = 0,
        AA_MSWindowsUseDirect3DByDefault = 1,
        AA_DontShowIconsInMenus          = 2,
        AA_NativeWindows                 = 3,
        AA_DontCreateNativeWidgetSiblings= 4,
        AA_MacPluginApplication          = 5,
        AA_DontUseNativeMenuBar          = 6,
        AA_MacDontSwapCtrlAndMeta        = 7,
        AA_Use96Dpi                      = 8,
        AA_SynthesizeMouseForUnhandledTouchEvents = 11,
        AA_ForceRasterWidgets            = 14,
        AA_UseDesktopOpenGL              = 15,
        AA_UseOpenGLES                   = 16,
        AA_UseSoftwareOpenGL             = 17,
        AA_ShareOpenGLContexts           = 18,
        AA_SetPalette                    = 19,
        AA_EnableHighDpiScaling          = 20,
        AA_DisableHighDpiScaling         = 21,
        AA_UseStyleSheetPropagationInWidgetStyles = 22,
        AA_DontUseNativeDialogs          = 23,
        AA_SynthesizeTouchForUnhandledMouseEvents = 24,
        AA_SynthesizeMouseForUnhandledTabletEvents = 25,
        AA_CompressHighFrequencyEvents   = 26,
        AA_DontCheckOpenGLContextThreadAffinity = 27,
        AA_DisableWindowContextHelpButton = 28,
        AA_DisableSessionManager         = 31,
        AA_AttributeCount
    };
}

// ── Qt math helpers ──────────────────────────────────────────────────────────
#include <cmath>
#include <algorithm>
template<typename T> inline T qAbs(T x)  { return x < 0 ? -x : x; }
template<typename T> inline T qMin(T a, T b) { return a < b ? a : b; }
template<typename T> inline T qMax(T a, T b) { return a > b ? a : b; }
template<typename T> inline T qBound(T lo, T v, T hi) { return qMin(hi, qMax(lo, v)); }
template<typename T> inline T qRound(T v) { return (T)std::round(v); }
inline int    qRound(double v) { return (int)std::round(v); }
inline int    qRound(float v)  { return (int)std::round(v); }
inline bool   qFuzzyCompare(float a, float b)  { return std::fabs(a-b) <= 1e-5f * qMax(qAbs(a), qAbs(b)); }
inline bool   qFuzzyCompare(double a, double b){ return std::fabs(a-b) <= 1e-12 * qMax(qAbs(a), qAbs(b)); }
inline bool   qFuzzyIsNull(float v)  { return std::fabs(v) <= 1e-5f; }
inline bool   qFuzzyIsNull(double v) { return std::fabs(v) <= 1e-12; }
inline int    qIntCast(float f)  { return (int)f; }
inline int    qIntCast(double d) { return (int)d; }
inline double qSqrt(double v) { return std::sqrt(v); }
inline float  qSqrt(float v)  { return std::sqrtf(v); }
inline double qLn(double v)   { return std::log(v); }

template<typename T> inline void qSwap(T &a, T &b) { std::swap(a, b); }
template<typename T> inline void qDelete(T *&p) { delete p; p = nullptr; }
// qDeleteAll: delete all pointer elements in a sequence container
template<typename Container>
inline void qDeleteAll(const Container &c) { for (auto p : c) delete p; }

// qHash overloads for QHash<QString, ...>  (uses std::hash<std::string>)
#include <string>
#include <functional>
template<typename T>
inline size_t qHash(const T &v, size_t seed = 0) {
    return std::hash<T>{}(v) ^ (seed * 2654435761u);
}

// ── QChar (minimal) ──────────────────────────────────────────────────────────
class QChar {
    char m_c;
public:
    QChar() : m_c(' ') {}
    QChar(char c) : m_c(c) {}
    QChar(unsigned short c) : m_c((char)c) {}
    char toLatin1() const { return m_c; }
    bool isSpace()  const { return m_c == ' ' || m_c == '\t' || m_c == '\n'; }
    bool isNull()   const { return m_c == '\0'; }
    bool isLetter() const { return ::isalpha((unsigned char)m_c) != 0; }
    bool isDigit()  const { return ::isdigit((unsigned char)m_c) != 0; }
    bool isLower()  const { return ::islower((unsigned char)m_c) != 0; }
    bool isUpper()  const { return ::isupper((unsigned char)m_c) != 0; }
    QChar toLower() const { return QChar((char)::tolower((unsigned char)m_c)); }
    QChar toUpper() const { return QChar((char)::toupper((unsigned char)m_c)); }
    // Explicit char comparisons to avoid ambiguity with implicit conversion
    bool operator==(QChar o) const { return m_c == o.m_c; }
    bool operator!=(QChar o) const { return m_c != o.m_c; }
    bool operator< (QChar o) const { return m_c <  o.m_c; }
    bool operator> (QChar o) const { return m_c >  o.m_c; }
    bool operator<=(QChar o) const { return m_c <= o.m_c; }
    bool operator>=(QChar o) const { return m_c >= o.m_c; }
    bool operator==(char c) const { return m_c == c; }
    bool operator!=(char c) const { return m_c != c; }
    bool operator< (char c) const { return m_c <  c; }
    bool operator> (char c) const { return m_c >  c; }
    // Implicit conversion kept for range-for and other uses
    operator char() const { return m_c; }
};
