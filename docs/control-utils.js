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
  if (s === 'min') return p.min;
  if (s === 'max') return p.max;
  if (s === 'low') return p.min + (p.max - p.min) * 0.25;
  if (s === 'high') return p.min + (p.max - p.min) * 0.75;
  if (s === 'middle') return p.min + (p.max - p.min) * 0.5;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export function valueInRawRange(p, value) {
  const min = Number(p.min);
  const max = Number(p.max);
  if (!Number.isFinite(value)) return false;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  return value >= Math.min(min, max) && value <= Math.max(min, max);
}

export function portUiRange(p, sampleRate = 44100) {
  const rate = Number.isFinite(Number(sampleRate)) && Number(sampleRate) > 0
    ? Number(sampleRate)
    : 44100;
  const rawMin = Number.isFinite(Number(p.min)) ? Number(p.min) : 0;
  const rawMax = Number.isFinite(Number(p.max)) ? Number(p.max) : 1;
  const scale = p.sampleRate ? rate : 1;
  const min = rawMin * scale;
  const max = rawMax * scale;
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

export function scalePointLabel(p, value) {
  const point = scalePointOptions(p).find(item => Math.abs(item.value - value) < 1e-6);
  return point ? `${point.label} (${trimNumber(point.value)})` : null;
}

export function formatPortValue(p, value) {
  if (!Number.isFinite(value)) return '';
  const pointLabel = scalePointLabel(p, value);
  if (pointLabel) return pointLabel;

  const text = `${p.name ?? ''} ${p.symbol ?? ''}`;
  if (p.sampleRate || /\bHz\b|frequency|freq|cutoff|bandwidth/i.test(text)) {
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
