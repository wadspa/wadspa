#pragma once

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <limits>
#include <string>
#include <type_traits>

namespace juce {
constexpr float float_Pi = 3.14159265358979323846f;
}

constexpr float float_Pi = juce::float_Pi;
using String = std::string;

template <typename A, typename B>
constexpr std::common_type_t<A, B> jmin(A a, B b)
{
    return a < b ? a : b;
}

template <typename A, typename B>
constexpr std::common_type_t<A, B> jmax(A a, B b)
{
    return a > b ? a : b;
}

template <typename T>
constexpr T jlimit(T low, T high, T value)
{
    return value < low ? low : (value > high ? high : value);
}

inline int roundToInt(float value)
{
    return static_cast<int>(std::lround(value));
}

inline void zeromem(void* data, std::size_t bytes)
{
    std::memset(data, 0, bytes);
}

class Random {
public:
    Random() : state_(0x6d2b79f5d4a7c15ULL) {}
    explicit Random(std::int64_t seed) : state_(static_cast<std::uint64_t>(seed) | 1ULL) {}

    static Random& getSystemRandom()
    {
        static Random random(0x4f1bbcdd3a31d5bULL);
        return random;
    }

    std::int64_t nextInt64()
    {
        return static_cast<std::int64_t>(nextU64());
    }

    float nextFloat()
    {
        return static_cast<float>((nextU64() >> 40) & 0xffffff) / static_cast<float>(0x1000000);
    }

private:
    std::uint64_t state_;

    std::uint64_t nextU64()
    {
        state_ += 0x9e3779b97f4a7c15ULL;
        std::uint64_t z = state_;
        z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9ULL;
        z = (z ^ (z >> 27)) * 0x94d049bb133111ebULL;
        return z ^ (z >> 31);
    }
};
