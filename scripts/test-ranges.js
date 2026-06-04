#!/usr/bin/env node
/**
 * Range metadata regression tests.
 *
 * The audio control test proves that changing a value can alter sound. This
 * test proves the packaged metadata exposes the full usable parameter space to
 * UI controls: LV2 enum/scale-point ports must keep their real bounds, and
 * LADSPA sample-rate-relative ports must make sense when displayed as Hz.
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
    AUDIBLE_FREQUENCY_MAX_HZ,
    AUDIBLE_FREQUENCY_MIN_HZ,
    isAudibleFrequencyPort,
    portUiRange,
    portValueFromSlider,
    portValueForSet,
    sliderRangeForPort,
    usesLogSlider,
    visibleControlPorts,
} from '../docs/control-utils.js';
import { readLv2Registry } from './lib/lv2-registry.js';
import { parseLv2Ttl } from '../toolchain/src/shim-lv2.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const DOCS_PLUGINS = join(DOCS, 'plugins');
const SAMPLE_RATE = 44100;

const issues = [];
const sourceScalePointPorts = new Map();

for (const entry of readLv2Registry(ROOT)) {
    if (entry.buildScript) continue;
    const pluginDir = join(ROOT, 'plugins', entry.id);
    if (!existsSync(join(pluginDir, 'manifest.ttl'))) continue;

    const descriptor = parseLv2Ttl(pluginDir);
    for (const port of descriptor.ports) {
        if (port.type !== 'control' || port.dir !== 'input') continue;
        validateScalePointCoverage(`${entry.id} source`, port);
        if ((port.scalePoints ?? []).length > 0) {
            sourceScalePointPorts.set(`${entry.id}/${portKey(port)}`, port);
        }
    }
}

for (const entry of [
    ...readJson(join(DOCS, 'instruments.json')),
    ...readJson(join(DOCS_PLUGINS, 'catalog.json')),
]) {
    validateVisibleControlSet(`${entry.id} catalog`, entry.ports ?? []);
    for (const port of entry.ports ?? []) {
        if (port.type !== 'control' || port.dir !== 'input') continue;
        const sourcePort = sourceScalePointPorts.get(`${entry.id}/${portKey(port)}`);
        if (sourcePort && (port.scalePoints ?? []).length === 0) {
            issues.push(`${entry.id} catalog ${port.name}: missing ${sourcePort.scalePoints.length} source scale points`);
        }
        validateScalePointCoverage(`${entry.id} catalog`, port);
        validateSampleRateRange(`${entry.id} catalog`, port);
        validateSampleRateUiDispatch(`${entry.id} catalog`, port);
    }
}

if (issues.length > 0) {
    console.log(`range metadata FAILED (${issues.length} issues)`);
    for (const issue of issues) console.log(`  - ${issue}`);
    process.exit(1);
}

console.log('range metadata ok');

function readJson(path) {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
}

function validateScalePointCoverage(scope, port) {
    const points = (port.scalePoints ?? [])
        .map(point => Number(point.value))
        .filter(Number.isFinite);
    if (points.length === 0) return;

    const min = Number(port.min);
    const max = Number(port.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        issues.push(`${scope} ${port.name}: scale points exist but min/max are missing`);
        return;
    }

    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    const pointLo = Math.min(...points);
    const pointHi = Math.max(...points);
    if (pointLo < lo || pointHi > hi) {
        issues.push(`${scope} ${port.name}: range ${min}..${max} does not cover scale points ${pointLo}..${pointHi}`);
    }
}

function validateSampleRateRange(scope, port) {
    if (!port.sampleRate) return;

    const min = Number(port.min);
    const max = Number(port.max);
    const def = resolveDefault(port.default, min, max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(def)) return;

    const actualMin = Math.min(min, max) * SAMPLE_RATE;
    const actualMax = Math.max(min, max) * SAMPLE_RATE;
    const actualDefault = def >= Math.min(min, max) && def <= Math.max(min, max)
        ? def * SAMPLE_RATE
        : def;

    const tolerance = Math.max(1e-6, Math.abs(actualMax) * 1e-6);
    if (actualDefault < actualMin - tolerance || actualDefault > actualMax + tolerance) {
        issues.push(`${scope} ${port.name}: default ${actualDefault} Hz outside display range ${actualMin}..${actualMax} Hz`);
    }
}

function validateVisibleControlSet(scope, ports) {
    const visible = new Set(visibleControlPorts(ports));
    for (const port of ports) {
        if (port.cv && visible.has(port)) {
            issues.push(`${scope} ${port.name}: CV/modulation port is exposed as a slider`);
        }
    }

    for (const port of visible) {
        const range = portUiRange(port, SAMPLE_RATE);
        if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min === range.max) {
            issues.push(`${scope} ${port.name}: visible slider has invalid UI range ${range.min}..${range.max}`);
        }
        validateAudibleFrequencyUiRange(scope, port, range);
        validateLogSliderMapping(scope, port, range);
    }
}

function validateSampleRateUiDispatch(scope, port) {
    if (!port.sampleRate) return;

    const min = Number(port.min);
    const max = Number(port.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return;

    const uiRange = portUiRange(port, SAMPLE_RATE);
    const hostValue = portValueForSet(port, uiRange.value, null, SAMPLE_RATE);
    if (!Number.isFinite(hostValue)) {
        issues.push(`${scope} ${port.name}: UI dispatch value is not finite`);
        return;
    }

    const actualMin = Math.min(min, max) * SAMPLE_RATE;
    const actualMax = Math.max(min, max) * SAMPLE_RATE;
    const rangeTolerance = Math.max(1e-6, Math.abs(actualMax) * 1e-6);
    if (hostValue < actualMin - rangeTolerance || hostValue > actualMax + rangeTolerance) {
        issues.push(`${scope} ${port.name}: UI dispatch sends ${hostValue} outside ${actualMin}..${actualMax} Hz`);
    }

    const rawDefault = resolveDefault(port.default, min, max);
    if (!Number.isFinite(rawDefault)) return;
    const actualDefault = rawDefault >= Math.min(min, max) && rawDefault <= Math.max(min, max)
        ? rawDefault * SAMPLE_RATE
        : rawDefault;
    const expectedDefault = isAudibleFrequencyPort(port)
        ? clamp(actualDefault, AUDIBLE_FREQUENCY_MIN_HZ, AUDIBLE_FREQUENCY_MAX_HZ)
        : actualDefault;
    const defaultTolerance = Math.max(1e-6, Math.abs(expectedDefault) * 1e-6);
    if (Math.abs(hostValue - expectedDefault) > defaultTolerance) {
        issues.push(`${scope} ${port.name}: UI dispatch default ${hostValue} differs from expected ${expectedDefault} Hz`);
    }
}

function validateAudibleFrequencyUiRange(scope, port, range) {
    if (!isAudibleFrequencyPort(port)) return;

    const lo = Math.min(range.min, range.max);
    const hi = Math.max(range.min, range.max);
    if (lo < AUDIBLE_FREQUENCY_MIN_HZ || hi > AUDIBLE_FREQUENCY_MAX_HZ) {
        issues.push(`${scope} ${port.name}: audible frequency UI range ${lo}..${hi} Hz exceeds ${AUDIBLE_FREQUENCY_MIN_HZ}..${AUDIBLE_FREQUENCY_MAX_HZ} Hz`);
    }
    if (Number.isFinite(range.value) && (range.value < lo || range.value > hi)) {
        issues.push(`${scope} ${port.name}: default UI value ${range.value} outside ${lo}..${hi} Hz`);
    }
}

function validateLogSliderMapping(scope, port, range) {
    if (!usesLogSlider(port, range)) return;

    const slider = sliderRangeForPort(port, range);
    if (slider.min !== 0 || slider.max !== 1 || !Number.isFinite(slider.value)) {
        issues.push(`${scope} ${port.name}: logarithmic slider must use normalized 0..1 control range`);
        return;
    }

    const values = [0, 0.25, 0.5, 0.75, 1]
        .map(position => portValueFromSlider(port, position, range));
    const lo = Math.min(range.min, range.max);
    const hi = Math.max(range.min, range.max);
    const tolerance = Math.max(1e-6, hi * 1e-9);
    for (const value of values) {
        if (!Number.isFinite(value) || value < lo - tolerance || value > hi + tolerance) {
            issues.push(`${scope} ${port.name}: logarithmic slider maps outside ${lo}..${hi}`);
            return;
        }
    }
    for (let i = 1; i < values.length; i++) {
        const monotonic = range.min <= range.max
            ? values[i] > values[i - 1]
            : values[i] < values[i - 1];
        if (!monotonic) {
            issues.push(`${scope} ${port.name}: logarithmic slider is not monotonic`);
            return;
        }
    }
}

function portKey(port) {
    return port.symbol ? String(port.symbol) : String(port.index);
}

function resolveDefault(defaultValue, min, max) {
    if (typeof defaultValue === 'number') return defaultValue;
    if (defaultValue === null || defaultValue === undefined) return null;
    const s = String(defaultValue);
    if (s === 'min') return min;
    if (s === 'max') return max;
    if (s === 'low') return min + (max - min) * 0.25;
    if (s === 'high') return min + (max - min) * 0.75;
    if (s === 'middle') return min + (max - min) * 0.5;
    if (s === '0') return 0;
    if (s === '1') return 1;
    if (s === '100') return 100;
    if (s === '440') return 440;
    const parsed = parseFloat(s);
    return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
