#!/usr/bin/env node
/**
 * Plugin switching audio regression test.
 *
 * This uses the browser demo catalogs, not isolated build outputs. It renders a
 * plugin, switches to another plugin, then switches back to the previous one and
 * asserts every step still produces finite, audible audio.
 *
 * Usage:
 *   node scripts/test-plugin-switching.js [--only <id>] [--verbose]
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
    defaultPortValueForUi,
    defaultPortValuesForUi,
    portValueForSet,
    visibleControlPorts,
} from '../docs/control-utils.js';
import { audibleRenderSummary, isAudibleRender } from './lib/audio-audit.js';
import { readLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const DOCS_PLUGINS = join(DOCS, 'plugins');
const SOUNDFONTS = join(DOCS, 'soundfonts');

const SAMPLE_RATE = 44100;
const BLOCK_SIZE = 128;
const WARMUP_BLOCKS = 8;
const RENDER_BLOCKS = 160;

const args = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const verbose = args.includes('--verbose');

const SKIPS = new Map([
    ['noise-repellent', 'requires a trained noise profile'],
    ['drumkv1', 'requires external drum samples'],
    ['samplv1', 'requires an external sample'],
]);

const instruments = readJson(join(DOCS, 'instruments.json'))
    .map(entry => ({ kind: 'instrument', entry }));
const effects = readJson(join(DOCS_PLUGINS, 'catalog.json'))
    .map(entry => ({ kind: 'effect', entry }));
const registry = new Map(readLv2Registry(ROOT).map(entry => [entry.id, entry]));
const sf2Path = findTestSF2();
const factoryCache = new Map();
const processorCache = new Map();

const allEntries = interleave(instruments, effects);
const skippedEntries = [];
const runnableEntries = allEntries.filter(item => {
    const reason = skipReason(item);
    if (reason) {
        skippedEntries.push({ item, reason });
        return false;
    }
    return true;
});

const switchSequence = buildSwitchSequence(runnableEntries);
if (switchSequence.length === 0) {
    if (onlyId) {
        const skipped = skippedEntries.find(({ item }) => item.entry.id === onlyId);
        if (skipped) {
            console.log(`  ${onlyId} skipped (${skipped.reason})`);
            process.exit(0);
        }
    }
    throw new Error(`No runnable plugins found${onlyId ? ` for --only ${onlyId}` : ''}`);
}

const seen = new Set();
const failed = [];
let passedSteps = 0;
let skipped = onlyId ? skippedEntries.filter(({ item }) => item.entry.id === onlyId).length : skippedEntries.length;

console.log(`plugin switching: ${uniqueCount(switchSequence)} plugins, ${switchSequence.length} render steps`);

for (let i = 0; i < switchSequence.length; i++) {
    const item = switchSequence[i];
    const id = item.entry.id;
    const switchedBack = seen.has(id);
    const prefix = `${String(i + 1).padStart(String(switchSequence.length).length, ' ')}/${switchSequence.length}`;
    process.stdout.write(`  ${prefix} ${item.kind}:${id}${switchedBack ? ' switch-back' : ''} ... `);

    try {
        const render = await renderPlugin(item);
        ensurePlayable(item, render);
        passedSteps++;
        seen.add(id);
        console.log(`ok (${renderSummary(render)})`);
    } catch (error) {
        failed.push(`${item.kind}:${id}${switchedBack ? ' switch-back' : ''}: ${error.message}`);
        seen.add(id);
        console.log(`FAILED (${error.message})`);
    }
}

console.log(`\n${'-'.repeat(60)}`);
console.log(`switch renders: ${passedSteps} passed, ${failed.length} failed, ${skipped} skipped`);
console.log(`unique plugins covered: ${seen.size}`);
const verboseSkips = skippedEntries.filter(({ item }) => !onlyId || item.entry.id === onlyId);
if (verbose && verboseSkips.length > 0) {
    console.log('\nSkipped:');
    for (const { item, reason } of verboseSkips) {
        console.log(`  - ${item.kind}:${item.entry.id}: ${reason}`);
    }
}
if (failed.length > 0) {
    console.log('\nFailures:');
    for (const failure of failed) console.log(`  - ${failure}`);
    process.exit(1);
}

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function interleave(a, b) {
    const out = [];
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        if (a[i]) out.push(a[i]);
        if (b[i]) out.push(b[i]);
    }
    return out;
}

function uniqueCount(items) {
    return new Set(items.map(item => item.entry.id)).size;
}

function buildSwitchSequence(entries) {
    if (onlyId) {
        const target = entries.find(item => item.entry.id === onlyId);
        if (!target) return [];
        const neighbor = entries.find(item => item.entry.id !== onlyId && item.kind !== target.kind)
            ?? entries.find(item => item.entry.id !== onlyId);
        return neighbor ? [target, neighbor, target] : [target];
    }

    const sequence = [];
    let previous = null;
    for (const current of entries) {
        sequence.push(current);
        if (previous) sequence.push(previous);
        previous = current;
    }
    return sequence;
}

function skipReason({ entry }) {
    if (SKIPS.has(entry.id)) return SKIPS.get(entry.id);
    const reg = registry.get(entry.id);
    if (reg?.noTest) return 'marked noTest';
    if (reg?.threads) return 'threaded browser-only build';
    if ((entry.sf2 || entry.id === 'tsf') && !sf2Path) return 'no SF2 in docs/soundfonts';
    if (!entry.ports?.some(port => port.type === 'audio' && port.dir === 'output')) {
        return 'no audio outputs';
    }
    return null;
}

async function renderPlugin(item) {
    const { entry } = item;
    const pluginDir = join(DOCS_PLUGINS, entry.id);
    const wasmFile = entry.wasmFile ?? readdirSync(pluginDir).find(file => file.endsWith('.wasm'));
    if (!wasmFile) throw new Error('no .wasm file in docs plugin directory');

    const wasmBinary = readFileSync(join(pluginDir, wasmFile));
    const factory = await loadFactory(entry, pluginDir);
    const setters = readProcessorSetters(entry, pluginDir);
    const mod = await factory({ wasmBinary, print() {}, printErr() {} });

    if (typeof mod._shim_init !== 'function' || typeof mod._shim_run !== 'function') {
        throw new Error('missing shim init/run exports');
    }
    mod._shim_init(SAMPLE_RATE);

    if (typeof mod._shim_load_sf2 === 'function') {
        if (!sf2Path) throw new Error('no SF2 in docs/soundfonts');
        loadSF2IntoWasm(mod, sf2Path);
    }

    applyBrowserDefaults(mod, item, setters);
    applyCanvasDefaults(mod, entry);

    const outBufFns = Object.keys(mod).filter(key => key.startsWith('_shim_output_buf_')).sort();
    const inBufFns = Object.keys(mod).filter(key => key.startsWith('_shim_input_buf_')).sort();
    if (outBufFns.length === 0) throw new Error('no _shim_output_buf_* functions exported');

    for (let block = 0; block < WARMUP_BLOCKS; block++) {
        fillAudioInputs(mod, inBufFns, -WARMUP_BLOCKS + block, entry.id);
        mod._shim_run(BLOCK_SIZE);
    }

    const hasMidi = typeof mod._shim_midi_note_on === 'function';
    if (hasMidi) sendInitialMidi(mod, entry.id);

    let peak = 0;
    let sumSquares = 0;
    let sampleCount = 0;
    let nonFinite = 0;
    let clipped = 0;

    for (let block = 0; block < RENDER_BLOCKS; block++) {
        if (hasMidi) {
            sendMidiBlock(mod, block, entry.id);
        } else {
            fillAudioInputs(mod, inBufFns, block, entry.id);
        }
        mod._shim_run(BLOCK_SIZE);

        for (const fn of outBufFns) {
            const ptr = mod[fn]() >> 2;
            for (let i = 0; i < BLOCK_SIZE; i++) {
                const value = mod.HEAPF32[ptr + i];
                if (!Number.isFinite(value)) {
                    nonFinite++;
                    continue;
                }
                const abs = Math.abs(value);
                if (abs > peak) peak = abs;
                if (abs >= 0.995) clipped++;
                sumSquares += value * value;
                sampleCount++;
            }
        }
    }

    if (typeof mod._shim_midi_clear === 'function') mod._shim_midi_clear();

    return {
        peak,
        rms: Math.sqrt(sumSquares / Math.max(1, sampleCount)),
        nonFinite,
        clippedRatio: clipped / Math.max(1, sampleCount),
    };
}

async function loadFactory(entry, pluginDir) {
    if (factoryCache.has(entry.id)) return factoryCache.get(entry.id);
    const indexFile = entry.moduleFile ?? 'index.js';
    const indexUrl = pathToFileURL(join(pluginDir, indexFile)).href;
    const { default: factory } = await import(`${indexUrl}?switching=${Date.now()}-${Math.random()}`);
    if (typeof factory !== 'function') throw new Error('index.js default export is not a factory');
    factoryCache.set(entry.id, factory);
    return factory;
}

function readProcessorSetters(entry, pluginDir) {
    if (processorCache.has(entry.id)) return processorCache.get(entry.id);
    const processorFile = entry.processorFile ?? 'processor.js';
    const processorSrc = readFileSync(join(pluginDir, processorFile), 'utf8');
    const match = processorSrc.match(/const SETTERS\s*=\s*(\{[^\n;]*\})/);
    const setters = match ? JSON.parse(match[1]) : {};
    processorCache.set(entry.id, setters);
    return setters;
}

function applyBrowserDefaults(mod, { kind, entry }, setters) {
    const ports = visibleControlPorts(entry.ports);
    const defaults = kind === 'effect'
        ? defaultPortValuesForUi(ports, SAMPLE_RATE, { activateEffectToggles: true })
        : new Map(ports.map(port => [port, defaultPortValueForUi(port, SAMPLE_RATE)]));

    for (const port of ports) {
        const value = defaults.get(port);
        if (!Number.isFinite(value)) continue;
        const fn = setters[setterKey(port)];
        if (fn && typeof mod[fn] === 'function') {
            mod[fn](portValueForSet(port, value, null, SAMPLE_RATE));
        }
    }
}

function applyCanvasDefaults(mod, entry) {
    for (const editor of entry.canvasEditors ?? []) {
        setPluginState(mod, editor.key, pointsToState(editor.defaultPoints));
    }
    if (entry.shaper) {
        setPluginState(mod, 'graph', '0,0;1,1;');
    }
}

function setterKey(port) {
    return port.symbol ? String(port.symbol) : String(port.index);
}

function pointsToState(points) {
    return (points ?? [])
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

function setPluginState(mod, key, value) {
    if (typeof mod._shim_set_plugin_state !== 'function') return;
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

function sendInitialMidi(mod, id) {
    if (typeof mod._shim_midi_cc === 'function') {
        mod._shim_midi_cc(0, 1, 0);
        mod._shim_midi_cc(0, 7, 112);
        mod._shim_midi_cc(0, 74, 96);
    }
    if (typeof mod._shim_midi_channel_pressure === 'function') mod._shim_midi_channel_pressure(0, 0);
    if (typeof mod._shim_midi_pitch_bend === 'function') mod._shim_midi_pitch_bend(0, 0);
    mod._shim_midi_note_on(0, midiNotesFor(id)[0], 112);
}

function sendMidiBlock(mod, block, id) {
    const notes = midiNotesFor(id);
    const interval = /geonkick|chowkick/i.test(id) ? 36 : 48;
    if (block > 0 && block % interval === 0) {
        const note = notes[(block / interval) % notes.length];
        mod._shim_midi_note_on(0, note, 112);
    }
}

function midiNotesFor(id) {
    if (/geonkick|chowkick/i.test(id)) return [36, 40, 43, 48];
    if (/nekobi|303|bass|monosynth|setbfree/i.test(id)) return [36, 43, 48, 55];
    if (/vl1/i.test(id)) return [48, 52, 55, 60];
    return [60, 64, 67, 72, 55, 48];
}

function fillAudioInputs(mod, inBufFns, blockIndex, id) {
    const baseSample = blockIndex * BLOCK_SIZE;
    const beatboxLike = /beatbox/i.test(id);
    for (let channel = 0; channel < inBufFns.length; channel++) {
        const ptr = mod[inBufFns[channel]]() >> 2;
        const fundamental = channel % 2 === 0 ? 110 : 147;
        const overtone = channel % 2 === 0 ? 440 : 330;
        for (let i = 0; i < BLOCK_SIZE; i++) {
            const sample = baseSample + i;
            const t = sample / SAMPLE_RATE;
            const period = Math.round(SAMPLE_RATE * 0.24);
            const phase = ((sample % period) + period) % period / period;
            const transient = phase < 0.035 ? 0.4 * (1 - phase / 0.035) : 0;
            const beatboxEnv = beatboxLike ? (phase < 0.22 ? Math.exp(-phase * 8) : 0.0001) : 1;
            mod.HEAPF32[ptr + i] =
                beatboxEnv * (
                    0.32 * Math.sin(2 * Math.PI * fundamental * t)
                    + 0.18 * Math.sin(2 * Math.PI * overtone * t)
                ) + transient;
        }
    }
}

function ensurePlayable({ entry }, render) {
    if (render.nonFinite > 0) {
        throw new Error(`produced ${render.nonFinite} non-finite samples`);
    }
    if (!isAudibleRender(render)) {
        throw new Error(`inaudible after switch (${audibleRenderSummary(render)})`);
    }
}

function renderSummary(render) {
    const clipped = render.clippedRatio > 0 ? `, clipped ${(render.clippedRatio * 100).toFixed(3)}%` : '';
    const nonFinite = render.nonFinite > 0 ? `, non-finite ${render.nonFinite}` : '';
    return `${audibleRenderSummary(render)}${clipped}${nonFinite}`;
}

function findTestSF2() {
    if (!existsSync(SOUNDFONTS)) return null;
    const file = readdirSync(SOUNDFONTS).find(name => name.endsWith('.sf2'));
    return file ? join(SOUNDFONTS, file) : null;
}

function loadSF2IntoWasm(mod, file) {
    const bytes = readFileSync(file);
    const ptr = mod._malloc(bytes.length);
    mod.HEAPU8.set(bytes, ptr);
    mod._shim_load_sf2(ptr, bytes.length);
    mod._free(ptr);
}
