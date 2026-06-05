export const AUDIBLE_FREQUENCY_MIN_HZ = 20;
export const AUDIBLE_FREQUENCY_MAX_HZ = 20000;

export function isVisibleControlPort(port) {
  return port?.type === 'control'
    && port?.dir === 'input'
    && !port?.cv
    && !isOperationalStatePort(port);
}

export function visibleControlPorts(ports = []) {
  return (ports ?? []).filter(port => isVisibleControlPort(port) && !hasHiddenModulationSource(port, ports));
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

  const active = activeUiRangeForPort(p, min, max);
  if (active) {
    min = active.min;
    max = active.max;
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

export function defaultPortValuesForUi(ports = [], sampleRate = 44100, options = {}) {
  const values = new Map();
  for (const port of ports) {
    values.set(port, defaultPortValueForUi(port, sampleRate, options));
  }

  applyZamDynamicEqUiDefaults(ports, values, sampleRate);
  applyControlPortModeDefaults(ports, values, sampleRate);
  applyAudibleEnvelopeDefaults(ports, values, sampleRate);
  applyAudibleDynamicsDefaults(ports, values, sampleRate);
  applyAudibleEqBandDefaults(ports, values, sampleRate);
  applyAudibleModulationDefaults(ports, values, sampleRate);
  applyAudibleTapDelayDefaults(ports, values, sampleRate);
  applyAudibleReverbDefaults(ports, values, sampleRate);
  applyAudibleDependentControlDefaults(ports, values, sampleRate);
  applyPlayableBeatBoxDefaults(ports, values, sampleRate);
  return values;
}

export function exclusiveToggleGroupForPort(port, ports = []) {
  const symbol = String(port?.symbol ?? '');
  if (!['togglelow', 'togglepeak', 'togglehigh'].includes(symbol)) return [];
  const group = ports.filter(item => ['togglelow', 'togglepeak', 'togglehigh'].includes(String(item?.symbol ?? '')));
  return group.length >= 2 ? group : [];
}

export function shouldActivateToggleByDefault(p) {
  if (!p?.toggled) return false;
  const text = controlText(p);
  if (/\b(bypass|reset|learn|listen|residual|sidechain|sync|invert|swap|stereo|haas|detection|reverse|loop|freeze|insane|mode)\b|control\s*mode|controlmode/i.test(text)) {
    return false;
  }
  return /enable|enabled|\bactive\b|\bprocess\b|\bon\b|filter|section|shelf|peak|band|highpass|lowpass|compressor/i.test(text);
}

export function sliderRangeForPort(p, uiRange, value = uiRange.value) {
  if (!usesLogSlider(p, uiRange)) return { ...uiRange, value };
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
  if (usesMenuControl(p)) return false;
  const min = Math.min(uiRange.min, uiRange.max);
  const max = Math.max(uiRange.min, uiRange.max);
  return min > 0 && max > min && (p?.logarithmic || shouldInferLogSlider(p, min, max));
}

function shouldInferLogSlider(p, min, max) {
  if (!(min > 0) || !(max > min)) return false;
  const text = controlText(p);
  if (/threshold|gain|level|volume|mix|wet|dry|depth|amount|ratio|\bq\b|bandwidth|\bbw\b|shape|mode|select|channel|sustain|resonance|reso/i.test(text)) {
    return false;
  }
  const frequencyLike = /frequency|freq|cutoff|xover|crossover|damping/i.test(text);
  const minimumRatio = frequencyLike ? 8 : 20;
  if (max / min < minimumRatio) return false;
  return /frequency|freq|cutoff|xover|crossover|damping|attack|decay|release|hold|delay|time|slew|rate|bpm|speed/i.test(text);
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

function activeUiRangeForPort(p, min, max) {
  const text = controlText(p);
  if (/tap\s*\d+\s+distance\s*\(inches\)/i.test(text) && min === 0 && max === 4) {
    return { min, max: 2 };
  }
  if (String(p?.symbol ?? '') === 'feedback'
      && /^Feedback$/i.test(String(p?.name ?? ''))
      && finitePortNumber(p.default) === 0.25
      && min === 0
      && max === 1) {
    return { min: 0.5, max };
  }
  if (String(p?.symbol ?? '') === 'attack'
      && /^Attack$/i.test(String(p?.name ?? ''))
      && finitePortNumber(p.default) === 128
      && min === 4
      && max === 500) {
    return { min: 376, max };
  }
  return null;
}

function controlText(p) {
  return `${p.name ?? ''} ${p.symbol ?? ''}`;
}

export function isOperationalStatePort(port) {
  const symbol = String(port?.symbol ?? '').trim();
  const name = String(port?.name ?? '').trim();
  return /^record$/i.test(symbol) || /^record$/i.test(name);
}

function hasHiddenModulationSource(port, ports = []) {
  const text = controlText(port).toLowerCase();
  const sourceText = sourceTextForModulationGain(text);
  if (!sourceText) return false;
  return ports.some(other => {
    if (other === port || other?.dir !== 'input' || other?.type !== 'control') return false;
    if (!other.cv) return false;
    const otherText = controlText(other).toLowerCase();
    return sourceText.every(part => otherText.includes(part));
  });
}

function sourceTextForModulationGain(text) {
  if (/exp.*fm.*gain|gain.*exp.*fm/.test(text)) return ['exp', 'fm'];
  if (/lin.*fm.*gain|gain.*lin.*fm/.test(text)) return ['lin', 'fm'];
  if (/res(?:onance)?.*gain|gain.*res(?:onance)?/.test(text)) return ['res'];
  return null;
}

function applyZamDynamicEqUiDefaults(ports, values, sampleRate) {
  const bySymbol = new Map(ports.map(port => [String(port?.symbol ?? ''), port]));
  if (!bySymbol.has('detectfreq') || !bySymbol.has('targetfreq') || !bySymbol.has('boostcut')) return;
  if (!bySymbol.has('togglelow') || !bySymbol.has('togglepeak') || !bySymbol.has('togglehigh')) return;

  setValue(values, bySymbol.get('togglelow'), 0, sampleRate);
  setValue(values, bySymbol.get('togglepeak'), 1, sampleRate);
  setValue(values, bySymbol.get('togglehigh'), 0, sampleRate);
  setValue(values, bySymbol.get('thr'), -8, sampleRate);
  setValue(values, bySymbol.get('kn'), 4, sampleRate);
  setValue(values, bySymbol.get('rat'), 5, sampleRate);
}

function applyControlPortModeDefaults(ports, values, sampleRate) {
  for (const port of ports) {
    const text = controlText(port);
    if (!/control\s*mode|controlmode/i.test(text)) continue;
    if (!scalePointOptions(port).some(point => /control\s+ports/i.test(point.label))) continue;
    setValue(values, port, finitePortNumber(port.max) ?? 1, sampleRate);
  }
}

function setValue(values, port, value, sampleRate = 44100) {
  if (!port || !Number.isFinite(value)) return;
  const range = portUiRange(port, sampleRate);
  values.set(port, clamp(value, Math.min(range.min, range.max), Math.max(range.min, range.max)));
}

function applyAudibleEnvelopeDefaults(ports, values, sampleRate) {
  const allText = ports.map(controlText).join(' ');
  const hasEnvelope = /attack|att\b|decay|dec\b|sustain|sus\b|release|rel\b|hold|env|envelope/i.test(allText);
  if (!hasEnvelope) return;

  const hasFilterEnvelope = /filter|cutoff|vcf|dcf|resonance|reso/i.test(allText)
    && /env|envelope|attack|decay|sustain|release/i.test(allText);

  for (const port of ports) {
    const text = controlText(port);
    const current = values.get(port);

    if (/sustain|sus\b/i.test(text)
        && /decay|dec\b/i.test(allText)
        && isHighEnvelopeValue(port, current)) {
      setValue(values, port, envelopeSustainValue(port), sampleRate);
      continue;
    }

    if (/attack|att\b/i.test(text)
        && /decay|dec\b/i.test(allText)
        && isHighEnvelopeValue(port, current)) {
      setValue(values, port, lowValue(port), sampleRate);
      continue;
    }

    if (hasFilterEnvelope
        && /env.*amount|amount.*env|vcf[_\s-]*env|dcf\d*[_\s-]*envelope/i.test(text)
        && !/attack|att\b|decay|dec\b|sustain|sus\b|release|rel\b|hold/i.test(text)) {
      if (!Number.isFinite(current) || Math.abs(current) < 0.25) {
        setValue(values, port, audibleHighValue(port), sampleRate);
      }
      continue;
    }

    if (hasFilterEnvelope
        && /filter.*cutoff|cutoff.*filter|vcf[_\s-]*freq|dcf\d*[_\s-]*cutoff/i.test(text)
        && isHighEnvelopeValue(port, current)) {
      setValue(values, port, midValue(port), sampleRate);
    }
  }
}

function applyAudibleDynamicsDefaults(ports, values, sampleRate) {
  const allText = ports.map(controlText).join(' ');
  if (!/\bcomp|compress|threshold|thresh|knee|ratio|gate|limiter|rms|peak|de[-_ ]?ess|makeup/i.test(allText)) {
    return;
  }
  const gateContext = /\bgate\b|gate[_\s-]*thr|key filter/i.test(allText);

  for (const port of ports) {
    const text = controlText(port);
    const current = values.get(port);

    if (port.toggled && /compress|comp.*enable|enable.*comp/i.test(text)) {
      setValue(values, port, finitePortNumber(port.max) ?? 1, sampleRate);
      continue;
    }

    if (/gate.*thr|thr.*gate/i.test(text) && isOffThresholdValue(port, current)) {
      setValue(values, port, activeThresholdValue(port, 0.67), sampleRate);
      continue;
    }

    if (/threshold|thresh/i.test(text) && !/gate/i.test(text) && isInactiveThresholdValue(port, current)) {
      const fraction = /de[-_ ]?ess/i.test(allText) ? 0.08 : gateContext || /knee|rms|peak/i.test(allText) ? 0.67 : 0.25;
      setValue(values, port, activeThresholdValue(port, fraction), sampleRate);
      continue;
    }

    if (gateContext && /attack|att\b/i.test(text) && !isMuteLikeValue(port, current)) {
      setValue(values, port, lowValue(port), sampleRate);
      continue;
    }

    if (/ratio/i.test(text) && !/fixed/i.test(text) && isNearNeutralRatio(port, current)) {
      setValue(values, port, highValue(port), sampleRate);
      continue;
    }

    if (/comp(?:Attack|Release|Threshold|Makeup)|comp[_\s-]*(?:attack|release|threshold|makeup)/i.test(text)
        && isMuteLikeValue(port, current)) {
      setValue(values, port, midValue(port), sampleRate);
      continue;
    }

    if (/\bcomp|compress/i.test(allText)
        && /^(?:vol|volume|osc\d+vol)\b/i.test(String(port?.symbol ?? port?.name ?? ''))
        && !isNearMaxValue(port, current)) {
      setValue(values, port, audibleHighValue(port), sampleRate);
    }
  }
}

function applyAudibleEqBandDefaults(ports, values, sampleRate) {
  const groups = new Map();
  for (const port of ports) {
    for (const key of eqGroupKeys(port)) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(port);
    }
  }

  for (const group of groups.values()) {
    const hasShape = group.some(isEqShapePort);
    const gains = group.filter(isEqGainPort);
    if (!hasShape || gains.length === 0) continue;
    for (const gain of gains) {
      const current = values.get(gain);
      if (Number.isFinite(current) && Math.abs(current) > 1e-6) continue;
      setValue(values, gain, eqBoostValue(gain), sampleRate);
    }
  }

  const ungroupedShapePorts = ports.filter(port => eqGroupKeys(port).length === 0 && isEqShapePort(port));
  const ungroupedGains = ports.filter(port => eqGroupKeys(port).length === 0 && isEqGainPort(port));
  if (ungroupedShapePorts.length > 0 && ungroupedGains.length === 1) {
    const gain = ungroupedGains[0];
    const current = values.get(gain);
    if (!Number.isFinite(current) || Math.abs(current) <= 1e-6) {
      setValue(values, gain, eqBoostValue(gain), sampleRate);
    }
  }
}

function eqBoostValue(port) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (Number.isFinite(min) && Number.isFinite(max) && min < 0 && max > 0) {
    return Math.min(max, Math.max(min, 6));
  }
  return Number.isFinite(max) ? max : 1;
}

function eqGroupKeys(port) {
  const raw = `${port?.symbol ?? ''} ${port?.name ?? ''}`.toLowerCase();
  const keys = new Set();
  for (const match of raw.matchAll(/\bf(\d+)[_\s-]*(?:freq|gain|q|bw|bandwidth)\b|(?:freq|gain|q|bw|bandwidth)[_\s-]*f(\d+)\b/g)) {
    keys.add(`band:f${match[1] ?? match[2]}`);
  }
  for (const match of raw.matchAll(/band\s*[_-]?(\d+)|band(\d+)/g)) {
    keys.add(`band:${match[1] ?? match[2]}`);
  }
  for (const match of raw.matchAll(/(?:freq(?:uency)?|bw|bandwidth|q|gain|boost|cut|section|sec)[_\s-]*(\d+)/g)) {
    keys.add(`band:${match[1]}`);
  }
  for (const match of raw.matchAll(/(?:freq|bw|gain|sec|q|boost|cut)(\d+)/g)) {
    keys.add(`band:${match[1]}`);
  }
  if (/\blow[-_\s]*shel|lowshel|^ls|[\s_]ls/.test(raw)) keys.add('shelf:low');
  if (/\bhigh[-_\s]*shel|highshel|^hs|[\s_]hs/.test(raw)) keys.add('shelf:high');
  if (/^(boostl|fl)\b/.test(raw)) keys.add('shelf:low');
  if (/^(boosth|fh)\b/.test(raw)) keys.add('shelf:high');
  return [...keys];
}

function isEqShapePort(port) {
  const text = controlText(port);
  return /freq|frequency|cutoff|bandwidth|\bbw\b|\bq\b|slope|resonance|reso/i.test(text)
    && !isEqGainPort(port);
}

function isEqGainPort(port) {
  const text = controlText(port);
  if (!/gain|boost|cut/i.test(text)) return false;
  if (/input|output|master|makeup|drive|feedback|sidechain|reduction|control/i.test(text)) return false;
  return true;
}

function applyAudibleModulationDefaults(ports, values, sampleRate) {
  const allText = ports.map(controlText).join(' ');
  const hasModulation = /lfo|mod|vibrato|chorus|flanger|phaser|slowdown|detune|voice/i.test(allText)
    || (/frequency|rate/i.test(allText) && /depth|wet|mix|feedback/i.test(allText));
  if (!hasModulation) return;

  for (const port of ports) {
    const text = controlText(port);
    const current = values.get(port);
    if (port.toggled || usesMenuControl(port)) continue;

    if (/number of voices|voices|sections/i.test(text)) {
      setValue(values, port, finitePortNumber(port.max) ?? current, sampleRate);
      continue;
    }

    if (/depth|amount|\bmod\b|mod.*amp|amp.*mod|slowdown|detune|feedback|mix|range/i.test(text)
        && (!Number.isFinite(current) || Math.abs(current) <= 1e-6)) {
      setValue(values, port, audibleHighValue(port), sampleRate);
      continue;
    }

    if (/wet/i.test(text) && isMuteLikeValue(port, current)) {
      setValue(values, port, audibleHighValue(port), sampleRate);
      continue;
    }

    if (/lfo.*freq|freq.*lfo|mod.*freq|freq.*mod|frequency|rate/i.test(text)
        && (!Number.isFinite(current) || Math.abs(current) <= 1e-6)) {
      setValue(values, port, midValue(port), sampleRate);
    }
  }

  if (/lfo\d*.*ring\s*mod|ring\s*mod.*lfo\d*/i.test(allText)) {
    for (const port of ports) {
      const text = controlText(port);
      const current = values.get(port);
      if (/lfo/i.test(text)) continue;
      if (/ring\s*mod|ringmod/i.test(text) && (!Number.isFinite(current) || Math.abs(current) <= 1e-6)) {
        setValue(values, port, audibleHighValue(port), sampleRate);
      }
    }
  }

  if (/lfo\d*.*reso|reso.*lfo\d*/i.test(allText)) {
    for (const port of ports) {
      const text = controlText(port);
      const current = values.get(port);
      if (/lfo/i.test(text)) continue;
      if (/resonance|reso/i.test(text) && (!Number.isFinite(current) || Math.abs(current) <= 1e-6)) {
        setValue(values, port, midValue(port), sampleRate);
      }
    }
  }
}

function applyAudibleTapDelayDefaults(ports, values, sampleRate) {
  const groups = new Map();
  for (const port of ports) {
    const key = tapGroupKey(port);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(port);
  }

  for (const group of groups.values()) {
    const distance = group.find(port => /distance|delay|time/i.test(controlText(port)));
    const level = group.find(port => /level|gain|volume/i.test(controlText(port)));
    if (distance) {
      const current = values.get(distance);
      const shortValue = shortTimeValue(distance);
      if (!Number.isFinite(current) || Math.abs(current) <= 1e-6 || current > shortValue) {
        setValue(values, distance, shortTimeValue(distance), sampleRate);
      }
    }
    if (level) {
      const current = values.get(level);
      if (isMuteLikeValue(level, current)) setValue(values, level, audibleHighValue(level), sampleRate);
    }
  }
}

function applyAudibleReverbDefaults(ports, values, sampleRate) {
  const bySymbol = new Map(ports.map(port => [String(port?.symbol ?? '').toLowerCase(), port]));
  const rtLow = bySymbol.get('rt_low');
  const rtMid = bySymbol.get('rt_mid');
  if (rtLow && rtMid) {
    setValue(values, rtLow, highValue(rtLow), sampleRate);
    setValue(values, rtMid, lowValue(rtMid), sampleRate);
  }
}

function applyAudibleDependentControlDefaults(ports, values, sampleRate) {
  const allText = ports.map(controlText).join(' ');

  for (const port of ports) {
    const text = controlText(port);
    const current = values.get(port);

    if (/crossover.*amplitude|amplitude.*crossover/i.test(text) && /smoothing/i.test(allText) && isMuteLikeValue(port, current)) {
      setValue(values, port, audibleHighValue(port), sampleRate);
      continue;
    }

    if (/\brate\b/i.test(text) && /integrator/i.test(allText) && isNearMaxValue(port, current)) {
      setValue(values, port, lowValue(port), sampleRate);
      continue;
    }

    if (/\bdither\b/i.test(text) && /dith.*amp|amp.*dith/i.test(allText) && isMuteLikeValue(port, current)) {
      setValue(values, port, highValue(port), sampleRate);
      continue;
    }

    if (/r\/l delay|rl_delay/i.test(text) && /fixed.*ratio/i.test(allText)) {
      setValue(values, port, lowValue(port), sampleRate);
      continue;
    }

    if (/level[_\s-]*sw|level switch/i.test(text) && /\blevel\b/i.test(allText)) {
      setValue(values, port, lowValue(port), sampleRate);
      continue;
    }

    if (/\btype\b/i.test(text) && /dry.*mix|thresh|release/i.test(allText) && /tune|sub/i.test(allText)) {
      setValue(values, port, finitePortNumber(port.max) ?? highValue(port), sampleRate);
      continue;
    }

    if (/tracking/i.test(text) && /max.*freq|freq.*max/i.test(allText)) {
      setValue(values, port, finitePortNumber(port.max) ?? 1, sampleRate);
      continue;
    }

    if (/\bnoise\b/i.test(text) && /hurst|fractal/i.test(allText) && isMuteLikeValue(port, current)) {
      setValue(values, port, audibleHighValue(port), sampleRate);
      continue;
    }

    if (/warp.*type/i.test(text) && /warp.*amount/i.test(allText) && isMuteLikeValue(port, current)) {
      setValue(values, port, highValue(port), sampleRate);
      continue;
    }

    if (/portamento|glide/i.test(text) && /portamento.*mode|keyboard.*mode/i.test(allText) && isMuteLikeValue(port, current)) {
      setValue(values, port, midValue(port), sampleRate);
      continue;
    }

    if (/keyboard.*mode|mono|legato/i.test(text) && /portamento/i.test(allText)) {
      setValue(values, port, midValue(port), sampleRate);
    }
  }
}

function applyPlayableBeatBoxDefaults(ports, values, sampleRate) {
  const bySymbol = new Map(ports.map(port => [String(port?.symbol ?? '').toLowerCase(), port]));
  if (!bySymbol.has('kik_trig') || !bySymbol.has('snr_trig') || !bySymbol.has('thru_mix')) return;

  setValue(values, bySymbol.get('hat_thr'), -40, sampleRate);
  setValue(values, bySymbol.get('kik_thr'), -40, sampleRate);
  setValue(values, bySymbol.get('snr_thr'), -40, sampleRate);
  setValue(values, bySymbol.get('kik_trig'), 110, sampleRate);
  setValue(values, bySymbol.get('snr_trig'), 880, sampleRate);
  setValue(values, bySymbol.get('hat_mix'), -9, sampleRate);
  setValue(values, bySymbol.get('kik_mix'), -9, sampleRate);
  setValue(values, bySymbol.get('snr_mix'), -9, sampleRate);
  setValue(values, bySymbol.get('thru_mix'), -45, sampleRate);
}

function tapGroupKey(port) {
  const raw = controlText(port).toLowerCase();
  const match = raw.match(/tap\s*(\d+)/);
  return match ? `tap:${match[1]}` : '';
}

function midValue(port) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return finitePortNumber(port.default) ?? 0;
  return min + (max - min) * 0.5;
}

function lowValue(port) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return finitePortNumber(port.default) ?? 0;
  return min + (max - min) * 0.1;
}

function highValue(port) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return finitePortNumber(port.default) ?? 1;
  return min + (max - min) * 0.9;
}

function shortTimeValue(port) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return finitePortNumber(port.default) ?? 0;
  return Math.min(max, Math.max(min, max > 20 ? 80 : min + (max - min) * 0.25));
}

function audibleHighValue(port) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return finitePortNumber(port.default) ?? 1;
  if (min < 0 && max >= 0) return max;
  return highValue(port);
}

function envelopeSustainValue(port) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return finitePortNumber(port.default) ?? 0.35;
  if (min < 0 && max <= 0) return min + (max - min) * 0.7;
  return min + (max - min) * 0.35;
}

function activeThresholdValue(port, fraction) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return finitePortNumber(port.default) ?? 0;
  return min + (max - min) * fraction;
}

function isNearMaxValue(port, value) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) return false;
  const span = Math.abs(max - min);
  return Math.abs(value - max) <= Math.max(1e-7, span * 0.05);
}

function isHighEnvelopeValue(port, value) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) return false;
  return value >= min + (max - min) * 0.75;
}

function isOffThresholdValue(port, value) {
  const min = finitePortNumber(port.min);
  if (!Number.isFinite(value) || !Number.isFinite(min)) return false;
  return Math.abs(value - min) <= Math.max(1e-7, Math.abs(min) * 1e-4);
}

function isInactiveThresholdValue(port, value) {
  const min = finitePortNumber(port.min);
  const max = finitePortNumber(port.max);
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) return false;
  return isOffThresholdValue(port, value) || isNearMaxValue(port, value) || Math.abs(value) <= 1e-7;
}

function isNearNeutralRatio(port, value) {
  if (!Number.isFinite(value)) return false;
  const min = finitePortNumber(port.min);
  if (Number.isFinite(min) && Math.abs(value - min) <= Math.max(1e-7, Math.abs(min) * 1e-4)) return true;
  return Math.abs(value - 1) <= 1e-7;
}

function isMuteLikeValue(port, value) {
  if (!Number.isFinite(value)) return false;
  if (finitePortNumber(port.min) !== null && value <= finitePortNumber(port.min) + 1e-7) return true;
  return Math.abs(value) <= 1e-7;
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
