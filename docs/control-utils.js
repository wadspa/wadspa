export const AUDIBLE_FREQUENCY_MIN_HZ = 20;
export const AUDIBLE_FREQUENCY_MAX_HZ = 20000;

export function isVisibleControlPort(port) {
  return port?.type === 'control' && port?.dir === 'input' && !port?.cv;
}

export function visibleControlPorts(ports = []) {
  return (ports ?? []).filter(isVisibleControlPort);
}

export function resolvePortDefault(p) {
  const d = p.default;
  if (d === null || d === undefined) return null;
  if (typeof d === 'number') return d;
  const s = String(d);
  const min = finitePortNumber(p.min);
  const max = finitePortNumber(p.max);
  if (s === 'min') return min;
  if (s === 'max') return max;
  if (s === 'low') return Number.isFinite(min) && Number.isFinite(max) ? min + (max - min) * 0.25 : null;
  if (s === 'high') return Number.isFinite(min) && Number.isFinite(max) ? min + (max - min) * 0.75 : null;
  if (s === 'middle') return Number.isFinite(min) && Number.isFinite(max) ? min + (max - min) * 0.5 : null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export function valueInRawRange(p, value) {
  const min = finitePortNumber(p.min);
  const max = finitePortNumber(p.max);
  if (!Number.isFinite(value)) return false;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  return value >= Math.min(min, max) && value <= Math.max(min, max);
}

export function portUiRange(p, sampleRate = 44100) {
  const rate = Number.isFinite(Number(sampleRate)) && Number(sampleRate) > 0
    ? Number(sampleRate)
    : 44100;
  const rawMin = finitePortNumber(p.min) ?? 0;
  const rawMax = finitePortNumber(p.max) ?? 1;
  const scale = p.sampleRate ? rate : 1;
  let min = rawMin * scale;
  let max = rawMax * scale;
  const rawDefault = resolvePortDefault(p);
  let value = Number.isFinite(rawDefault)
    ? (p.sampleRate && valueInRawRange(p, rawDefault) ? rawDefault * scale : rawDefault)
    : min;

  if (usesMenuControl(p)) {
    const points = scalePointOptions(p);
    const nearest = points.reduce((best, point) =>
      Math.abs(point.value - value) < Math.abs(best.value - value) ? point : best, points[0]);
    value = nearest?.value ?? value;
  }

  if (isAudibleFrequencyPort(p)) {
    const clamped = clampRange(min, max, AUDIBLE_FREQUENCY_MIN_HZ, AUDIBLE_FREQUENCY_MAX_HZ);
    min = clamped.min;
    max = clamped.max;
    value = clamp(value, Math.min(min, max), Math.max(min, max));
  }

  const span = Math.abs(max - min);
  const step = p.integer || p.enumeration || p.toggled
    ? 1
    : p.sampleRate
      ? 'any'
      : Math.max(span / 200, 0.000001);

  return { min, max, value, step };
}

export function portValueForSet(_p, uiValue, _control, _sampleRate = 44100) {
  return uiValue;
}

export function defaultPortValueForUi(p, sampleRate = 44100, options = {}) {
  const range = portUiRange(p, sampleRate);
  if (options.activateEffectToggles && shouldActivateToggleByDefault(p)) return 1;
  return range.value;
}

export function shouldActivateToggleByDefault(p) {
  if (!p?.toggled) return false;
  const text = controlText(p);
  if (/\b(bypass|reset|learn|listen|residual|sidechain|sync|invert|swap|stereo|haas|detection|reverse|loop|freeze|insane|mode|control\s*mode)\b/i.test(text)) {
    return false;
  }
  return /\b(enable|enabled|active|process|on|filter|section|shelf|peak|band|highpass|lowpass|compressor)\b/i.test(text);
}

export function sliderRangeForPort(p, uiRange, value = uiRange.value) {
  if (!usesLogSlider(p, uiRange)) return uiRange;
  return { min: 0, max: 1, value: sliderValueFromPortValue(p, value, uiRange), step: 'any' };
}

export function portValueFromSlider(p, sliderValue, uiRange) {
  if (!usesLogSlider(p, uiRange)) return sliderValue;
  const min = Math.min(uiRange.min, uiRange.max);
  const max = Math.max(uiRange.min, uiRange.max);
  const fraction = clamp(Number(sliderValue), 0, 1);
  const value = Math.exp(Math.log(min) + (Math.log(max) - Math.log(min)) * fraction);
  return uiRange.min <= uiRange.max ? value : min + max - value;
}

export function sliderValueFromPortValue(p, value, uiRange) {
  if (!usesLogSlider(p, uiRange)) return value;
  const min = Math.min(uiRange.min, uiRange.max);
  const max = Math.max(uiRange.min, uiRange.max);
  if (!(min > 0) || !(max > min) || !Number.isFinite(value)) return 0;
  const clamped = clamp(value, min, max);
  const fraction = (Math.log(clamped) - Math.log(min)) / (Math.log(max) - Math.log(min));
  return uiRange.min <= uiRange.max ? fraction : 1 - fraction;
}

export function usesLogSlider(p, uiRange = portUiRange(p)) {
  if (!p?.logarithmic || usesMenuControl(p)) return false;
  const min = Math.min(uiRange.min, uiRange.max);
  const max = Math.max(uiRange.min, uiRange.max);
  return min > 0 && max > min;
}

export function scalePointOptions(p) {
  const seen = new Set();
  return (p.scalePoints ?? [])
    .map(point => ({ label: String(point.label ?? point.value), value: Number(point.value) }))
    .filter(point => Number.isFinite(point.value))
    .sort((a, b) => a.value - b.value)
    .filter(point => {
      const key = String(point.value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function usesMenuControl(p) {
  const points = scalePointOptions(p);
  return points.length > 1 && (p.integer || p.enumeration || p.toggled || points.length <= 16);
}

export function portUsesHz(p) {
  if (isFrequencyBandGainLabel(p)) return false;
  const text = controlText(p);
  if (/\b(lfo|mod|pwm|flange|chorus|tremolo|vibrato|autopan|rotor|horn)\b/i.test(text)) {
    return /\bHz\b/i.test(text);
  }
  if (/\bHz\b/i.test(text)) return true;
  if (p.sampleRate && !/\bsample\s*rate\b/i.test(text)) return true;

  const max = finitePortNumber(p.max);
  return /\b(freq|frequency|cutoff|xover|crossover)\b/i.test(text)
    && Number.isFinite(max)
    && Math.abs(max) >= 200;
}

export function isAudibleFrequencyPort(p) {
  if (!portUsesHz(p)) return false;
  const text = controlText(p);
  if (/\b(lfo|mod|pwm|flange|chorus|tremolo|vibrato|autopan|rotor|horn|sample\s*rate)\b/i.test(text)) {
    return false;
  }

  return /\b(freq|frequency|cutoff|xover|crossover|filter|shelv|band\s*\d)\b/i.test(text)
    || p.sampleRate;
}

export function scalePointLabel(p, value) {
  const point = scalePointOptions(p).find(item => Math.abs(item.value - value) < 1e-6);
  return point ? `${point.label} (${trimNumber(point.value)})` : null;
}

export function formatPortValue(p, value) {
  if (!Number.isFinite(value)) return '';
  const pointLabel = scalePointLabel(p, value);
  if (pointLabel) return pointLabel;

  if (p.toggled) return value >= 0.5 ? 'on' : 'off';

  const text = `${p.name ?? ''} ${p.symbol ?? ''}`;
  if (portUsesHz(p)) {
    return `${trimNumber(value, value >= 100 ? 0 : value >= 10 ? 1 : 2)} Hz`;
  }
  if (/\bBPM\b/i.test(text)) return `${trimNumber(value, 1)} bpm`;
  if (/\b(ms|msec|millisecond)s?\b/i.test(text)) return `${trimNumber(value, 2)} ms`;
  if (/\b(sec|second)s?\b|\btime\b|\bdelay\b/i.test(text)) return `${trimNumber(value, 2)} s`;
  if (/\bdB\b|gain|boost|cut|threshold|level|volume/i.test(text)) return trimNumber(value, 2);
  if (Math.abs(value) >= 100) return trimNumber(value, 0);
  if (Math.abs(value) >= 10) return trimNumber(value, 1);
  return trimNumber(value, 2);
}

export function trimNumber(value, decimals = 2) {
  const text = Number(value).toFixed(decimals);
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
}

function finitePortNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return value;
  return Math.min(max, Math.max(min, value));
}

function clampRange(min, max, clampMin, clampMax) {
  const lo = Math.max(Math.min(min, max), clampMin);
  const hi = Math.min(Math.max(min, max), clampMax);
  if (lo > hi) return { min, max };
  return min <= max ? { min: lo, max: hi } : { min: hi, max: lo };
}

function controlText(p) {
  return `${p.name ?? ''} ${p.symbol ?? ''}`;
}

function isFrequencyBandGainLabel(p) {
  const text = `${p.name ?? ''}`.trim();
  const min = finitePortNumber(p.min);
  const max = finitePortNumber(p.max);
  return /^\d+(?:\.\d+)?\s*Hz$/i.test(text)
    && Number.isFinite(min)
    && Number.isFinite(max)
    && min < 0
    && max > 0;
}
