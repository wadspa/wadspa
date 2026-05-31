// Minimal boost::circular_buffer<T> drop-in using std::vector.
// API subset used by sorcer: push_back, pop_front, front, erase, begin/end, clear, size, empty.
#pragma once
#include <vector>
#include <cstddef>

namespace boost {

template <typename T>
class circular_buffer {
    std::vector<T> buf_;
    std::size_t    cap_;
public:
    using iterator       = typename std::vector<T>::iterator;
    using const_iterator = typename std::vector<T>::const_iterator;

    explicit circular_buffer(std::size_t capacity) : cap_(capacity) { buf_.reserve(capacity); }

    void push_back(const T& v) {
        if (buf_.size() == cap_) buf_.erase(buf_.begin()); // drop oldest when full
        buf_.push_back(v);
    }
    void pop_front()               { if (!buf_.empty()) buf_.erase(buf_.begin()); }
    T&       front()               { return buf_.front(); }
    const T& front() const         { return buf_.front(); }
    bool     empty()  const        { return buf_.empty(); }
    std::size_t size() const       { return buf_.size(); }
    void     clear()               { buf_.clear(); }
    iterator erase(iterator it)    { return buf_.erase(it); }
    iterator begin()               { return buf_.begin(); }
    iterator end()                 { return buf_.end(); }
    const_iterator begin() const   { return buf_.begin(); }
    const_iterator end()   const   { return buf_.end(); }
};

} // namespace boost
