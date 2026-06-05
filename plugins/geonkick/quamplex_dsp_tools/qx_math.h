/**
 * @file qm_math.h
 * @brief Math utilities for Quamplex DSP Tools.
 *
 * This header provides basic mathematical functions used in audio DSP,
 * such as clamping values to a given range.
 *
 * Project: Quamplex DSP Tools (A small C library of tools for audio DSP processing)
 * Website: https://quamplex.com
 *
 * Copyright (C) 2025 Iurie Nistor
 *
 * This file is part of Quamplex DSP Tools.
 *
 * Quamplex DSP Tools is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
 */

#ifndef QM_MATH_H
#define QM_MATH_H

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Clamp a float value between a minimum and maximum.
 *
 * This function ensures the returned value is not lower than `min`
 * and not greater than `max`.
 *
 * @param value The value to be clamped.
 * @param min The minimum limit.
 * @param max The maximum limit.
 * @return The clamped value.
 */
static inline float qx_clamp_float(float value, float min, float max)
{
    return value < min ? min : (value > max ? max : value);
}

#ifdef __cplusplus
}
#endif

#endif // QM_MATH_H
