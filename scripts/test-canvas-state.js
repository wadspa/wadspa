#!/usr/bin/env node
/**
 * Audio influence test for plugin canvas/state editors.
 *
 * Sliders, menus, toggles, and checkboxes are covered by test-sliders.js. This
 * covers editor surfaces that write plugin state directly, such as Geonkick's
 * drawable amp and pitch envelopes.
 */

import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
    CONTROL_MAX_DIFF_FLOOR,
    CONTROL_REL_DIFF_FLOOR,
    CONTROL_RMS_DIFF_FLOOR,
    audibleRenderSummary,
    fmtMetric,
    isAudibleRender,
} from './lib/audio-audit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const DOCS_PLUGINS = join(DOCS, 'plugins');
const SAMPLE_RATE = 44100;
const BLOCK_SIZE = 128;
const WARMUP_BLOCKS = 4;
const RENDER_BLOCKS = 1024;
const NOISE_MULTIPLIER = 6;
const MAX_DEFAULT_PEAK = 0.98;
const MAX_CLIPPED_RATIO = 0.0005;
const BODY_WINDOW_SAMPLES = Math.floor(SAMPLE_RATE * 0.7);
const GEONKICK_MIN_BODY_RMS = 0.04;

const args = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const verbose = args.includes('--verbose');

const instruments = readJson(join(DOCS, 'instruments.json'));
const candidates = instruments
    .filter(entry => Array.isArray(entry.canvasEditors) && entry.canvasEditors.length > 0)
    .filter(entry => !onlyId || entry.id === onlyId);

let passed = 0;
let failed = 0;
let testedEditors = 0;

for (const entry of candidates) {
    process.stdout.write(`  ${entry.id} ... `);
    try {
        const pluginDir = join(DOCS_PLUGINS, entry.id);
        const meta = readMeta(pluginDir);
        const processorSrc = readFileSync(join(pluginDir, 'processor.js'), 'utf8');
        const setters = parseSetters(processorSrc);
        const wasmFile = readdirSync(pluginDir).find(file => file.endsWith('.wasm'));
        if (!wasmFile) throw new Error('no .wasm file in docs plugin directory');

        const wasmBinary = readFileSync(join(pluginDir, wasmFile));
        const indexUrl = pathToFileURL(join(pluginDir, 'index.js')).href;
        const { default: factory } = await import(`${indexUrl}?test=${Date.now()}-${Math.random()}`);
        const options = { entry, meta, setters, factory, wasmBinary };

        const defaultStates = defaultCanvasStates(entry);
        const baseline = await renderWith(options, defaultStates);
        const repeat = await renderWith(options, defaultStates);
        ensureGoodRender(`${entry.id} default canvas state`, baseline);
        ensureGoodRender(`${entry.id} repeat canvas state`, repeat);
        if (!isAudibleRender(baseline)) {
            throw new Error(`default canvas state is inaudible (${audibleRenderSummary(baseline)})`);
        }
        if (baseline.peak > MAX_DEFAULT_PEAK || baseline.clippedRatio > MAX_CLIPPED_RATIO) {
            throw new Error(`default canvas state is too hot (${renderSummary(baseline)})`);
        }
        if (entry.id === 'geonkick' && baseline.bodyRms < GEONKICK_MIN_BODY_RMS) {
            throw new Error(`Geonkick default canvas state has too little body (${renderSummary(baseline)})`);
        }

        const noise = compareAudio(baseline.audio, repeat.audio);
        const issues = [];
        for (const editor of entry.canvasEditors) {
            testedEditors++;
            const variants = editorVariants(editor);
            const diffs = [];
            let changed = false;
            for (const variant of variants) {
                const states = new Map(defaultStates);
                states.set(editor.key, pointsToState(variant.points));
                const rendered = await renderWith(options, states);
                ensureGoodRender(`${entry.id}/${editor.key}/${variant.name}`, rendered);
                const diff = compareAudio(baseline.audio, rendered.audio);
                diffs.push(`${variant.name} rms=${fmtMetric(diff.rms)} rel=${fmtMetric(diff.relative)}`);
                if (audioChanged(diff, noise)) {
                    changed = true;
                    if (!verbose) break;
                }
            }
            if (!changed) {
                issues.push(`${editor.name ?? editor.key}: no audible state change (${diffs.join(', ')})`);
            } else if (verbose) {
                console.log(`\n    ${editor.name ?? editor.key}: ${diffs.join(', ')}`);
            }
        }

        if (issues.length > 0) {
            failed++;
            console.log(`FAILED (${issues.length} canvas issues)`);
            for (const issue of issues) console.log(`    - ${issue}`);
        } else {
            passed++;
            console.log(`ok (${entry.canvasEditors.length} canvas editors, ${renderSummary(baseline)})`);
        }
    } catch (error) {
        failed++;
        console.log(`ERROR: ${error.message}`);
    }
}

console.log(`\n${'-'.repeat(60)}`);
console.log(`plugins: ${passed} passed, ${failed} failed`);
console.log(`canvas editors: ${testedEditors} tested`);
if (failed > 0) process.exit(1);

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function readMeta(pluginDir) {
    const src = readFileSync(join(pluginDir, 'index.js'), 'utf8');
    const match = src.match(/export const meta\s*=\s*(\{[\s\S]*?\});\s*export/);
    if (!match) throw new Error('could not parse exported meta from index.js');
    return JSON.parse(match[1]);
}

function parseSetters(processorSrc) {
    const match = processorSrc.match(/const SETTERS\s*=\s*(\{[^\n]*\})/);
    if (!match) return {};
    return JSON.parse(match[1]);
}

function defaultCanvasStates(entry) {
    const states = new Map();
    for (const editor of entry.canvasEditors ?? []) {
        states.set(editor.key, pointsToState(editor.defaultPoints));
    }
    return states;
}

function editorVariants(editor) {
    const variants = [];
    for (const [name, points] of Object.entries(editor.presets ?? {})) {
        if (pointsDifferent(editor.defaultPoints, points)) variants.push({ name, points });
    }

    if (variants.length === 0) {
        variants.push({ name: 'low', points: [{ x: 0, y: 0.15 }, { x: 1, y: 0.15 }] });
        variants.push({ name: 'high', points: [{ x: 0, y: 0.95 }, { x: 1, y: 0.95 }] });
    }

    return variants;
}

function pointsDifferent(a = [], b = []) {
    if (a.length !== b.length) return true;
    return a.some((point, index) =>
        Math.abs(Number(point.x) - Number(b[index]?.x)) > 1e-6
        || Math.abs(Number(point.y) - Number(b[index]?.y)) > 1e-6);
}

function pointsToState(points) {
    return [...points]
        .map(point => ({
            x: Math.max(0, Math.min(1, Number(point.x))),
            y: Math.max(0, Math.min(1, Number(point.y))),
        }))
        .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
        .sort((a, b) => a.x - b.x)
        .map(point => `${formatPointNumber(point.x)},${formatPointNumber(point.y)}`)
        .join(';') + ';';
}

function formatPointNumber(value) {
    return Number(value).toFixed(6).replace(/\.?0+$/, '');
}

async function renderWith(options, states) {
    const mod = await options.factory({ wasmBinary: options.wasmBinary, print() {}, printErr() {} });
    mod._shim_init(SAMPLE_RATE);
    applyDefaults(mod, options.meta.ports, options.setters);
    for (const [key, value] of states) setPluginState(mod, key, value);

    const outBufFns = Object.keys(mod).filter(k => k.startsWith('_shim_output_buf_')).sort();
    const inBufFns = Object.keys(mod).filter(k => k.startsWith('_shim_input_buf_')).sort();
    if (outBufFns.length === 0) throw new Error('no _shim_output_buf_* functions exported');

    for (let block = 0; block < WARMUP_BLOCKS; block++) {
        fillAudioInputs(mod, inBufFns, -WARMUP_BLOCKS + block);
        mod._shim_run(BLOCK_SIZE);
    }

    if (typeof mod._shim_midi_note_on === 'function') {
        mod._shim_midi_note_on(0, 48, 100);
    }

    const audio = new Float32Array(outBufFns.length * BLOCK_SIZE * RENDER_BLOCKS);
    let write = 0;
    let peak = 0;
    let sumSquares = 0;
    let bodySumSquares = 0;
    let bodySampleCount = 0;
    let sampleCount = 0;
    let clipped = 0;
    let nonFinite = 0;

    for (let block = 0; block < RENDER_BLOCKS; block++) {
        if (typeof mod._shim_midi_note_on !== 'function') {
            fillAudioInputs(mod, inBufFns, block);
        }
        mod._shim_run(BLOCK_SIZE);
        for (const fn of outBufFns) {
            const ptr = mod[fn]() >> 2;
            for (let i = 0; i < BLOCK_SIZE; i++) {
                let sample = mod.HEAPF32[ptr + i];
                if (!Number.isFinite(sample)) {
                    nonFinite++;
                    sample = 0;
                }
                audio[write++] = sample;
                const abs = Math.abs(sample);
                if (abs > peak) peak = abs;
                if (abs >= 0.995) clipped++;
                sumSquares += sample * sample;
                if (block * BLOCK_SIZE + i < BODY_WINDOW_SAMPLES) {
                    bodySumSquares += sample * sample;
                    bodySampleCount++;
                }
                sampleCount++;
            }
        }
    }

    return {
        audio,
        peak,
        rms: Math.sqrt(sumSquares / sampleCount),
        bodyRms: Math.sqrt(bodySumSquares / Math.max(1, bodySampleCount)),
        clipped,
        clippedRatio: clipped / sampleCount,
        nonFinite,
    };
}

function applyDefaults(mod, ports, setters) {
    for (const port of ports) {
        if (port.type !== 'control' || port.dir !== 'input') continue;
        const value = resolveDefault(port.default, port.min, port.max);
        if (!Number.isFinite(value)) continue;
        const fn = setters[setterKey(port)];
        if (typeof mod[fn] === 'function') mod[fn](scaleValueForPort(port, value));
    }
}

function resolveDefault(defaultValue, min, max) {
    if (typeof defaultValue === 'number') return defaultValue;
    if (defaultValue === null || defaultValue === undefined) {
        return Number.isFinite(min) && Number.isFinite(max) ? min + (max - min) * 0.5 : null;
    }
    const s = String(defaultValue);
    if (s === 'min') return min;
    if (s === 'max') return max;
    if (s === 'low') return min + (max - min) * 0.25;
    if (s === 'high') return min + (max - min) * 0.75;
    if (s === 'middle') return min + (max - min) * 0.5;
    return Number(defaultValue);
}

function setterKey(port) {
    return port.symbol ? String(port.symbol) : String(port.index);
}

function scaleValueForPort(port, value) {
    return port.sampleRate ? value * SAMPLE_RATE : value;
}

function setPluginState(mod, key, value) {
    if (typeof mod._shim_set_plugin_state !== 'function') {
        throw new Error('plugin has canvas editors but does not export _shim_set_plugin_state');
    }
    if (typeof mod._malloc !== 'function' || typeof mod._free !== 'function') {
        throw new Error('plugin state export requires _malloc/_free');
    }
    const keyPtr = writeCString(mod, key);
    const valuePtr = writeCString(mod, value);
    try {
        mod._shim_set_plugin_state(keyPtr, valuePtr);
    } finally {
        mod._free(keyPtr);
        mod._free(valuePtr);
    }
}

function writeCString(mod, value) {
    const bytes = new TextEncoder().encode(`${value}\0`);
    const ptr = mod._malloc(bytes.length);
    const heap = mod.HEAPU8 ?? new Uint8Array(mod.HEAPF32.buffer);
    heap.set(bytes, ptr);
    return ptr;
}

function fillAudioInputs(mod, inBufFns, blockIndex) {
    const baseSample = blockIndex * BLOCK_SIZE;
    for (let channel = 0; channel < inBufFns.length; channel++) {
        const fn = inBufFns[channel];
        const ptr = mod[fn]() >> 2;
        const fundamental = channel % 2 === 0 ? 110 : 147;
        const overtone = channel % 2 === 0 ? 440 : 330;
        for (let i = 0; i < BLOCK_SIZE; i++) {
            const t = (baseSample + i) / SAMPLE_RATE;
            mod.HEAPF32[ptr + i] =
                0.35 * Math.sin(2 * Math.PI * fundamental * t)
                + 0.2 * Math.sin(2 * Math.PI * overtone * t);
        }
    }
}

function ensureGoodRender(label, rendered) {
    if (rendered.nonFinite > 0) {
        throw new Error(`${label} produced ${rendered.nonFinite} non-finite samples`);
    }
}

function compareAudio(a, b) {
    const n = Math.min(a.length, b.length);
    let sumSquares = 0;
    let refSquares = 0;
    let max = 0;
    for (let i = 0; i < n; i++) {
        const delta = a[i] - b[i];
        const abs = Math.abs(delta);
        if (abs > max) max = abs;
        sumSquares += delta * delta;
        refSquares += a[i] * a[i];
    }
    const rms = Math.sqrt(sumSquares / n);
    const refRms = Math.sqrt(refSquares / n);
    return { rms, max, relative: rms / Math.max(refRms, 1e-9) };
}

function audioChanged(diff, noise) {
    const rmsFloor = Math.max(CONTROL_RMS_DIFF_FLOOR, noise.rms * NOISE_MULTIPLIER);
    const relFloor = Math.max(CONTROL_REL_DIFF_FLOOR, noise.relative * NOISE_MULTIPLIER);
    return diff.rms > rmsFloor && diff.relative > relFloor && diff.max > CONTROL_MAX_DIFF_FLOOR;
}

function renderSummary(rendered) {
    return `${audibleRenderSummary(rendered)}, body rms ${fmtMetric(rendered.bodyRms)}, clipped ${(rendered.clippedRatio * 100).toFixed(3)}%`;
}
