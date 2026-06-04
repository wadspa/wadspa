#!/usr/bin/env node
/**
 * Node WASM audio smoke test for all effects in docs/plugins/catalog.json.
 *
 * For each effect:
 *   1. Instantiate the WASM module directly (no AudioWorklet needed)
 *   2. Dispatch browser-visible slider defaults through the same UI value path
 *   3. Fill all audio input buffers with a 440 Hz sine tone
 *   4. Run 64 blocks of 128 samples (~186 ms)
 *   5. Assert peak amplitude > 1e-6 (non-silent)
 *
 * Usage:
 *   node scripts/test-effects.js [--only <id>]
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname }             from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { portUiRange, portValueForSet, visibleControlPorts } from '../docs/control-utils.js';

const ROOT         = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_PLUGINS = join(ROOT, 'docs', 'plugins');
const SAMPLE_RATE  = 44100;
const BLOCK_SIZE   = 128;
const BLOCKS       = 64;   // ~186 ms

const args   = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

// Effects that cannot produce non-silent output in a headless test
// without special runtime state. Listed by id.
const KNOWN_SKIPS = new Set([
    'noise-repellent',  // requires a trained noise profile before reducing anything
]);

const catalog = JSON.parse(readFileSync(join(DOCS_PLUGINS, 'catalog.json'), 'utf8'));

let passed = 0, failed = 0, skipped = 0;

for (const eff of catalog) {
    if (onlyId && eff.id !== onlyId) continue;

    process.stdout.write(`  ${eff.id} … `);

    if (KNOWN_SKIPS.has(eff.id)) {
        console.log('⏭  skipped (requires runtime state)');
        skipped++;
        continue;
    }

    const audioOut = eff.ports.filter(p => p.type === 'audio' && p.dir === 'output');
    if (audioOut.length === 0) {
        console.log('⏭  skipped (no audio outputs)');
        skipped++;
        continue;
    }

    const pluginDir = join(DOCS_PLUGINS, eff.id);
    const indexUrl  = pathToFileURL(join(pluginDir, 'index.js')).href;

    try {
        const wasmFile = readdirSync(pluginDir).find(f => f.endsWith('.wasm'));
        if (!wasmFile) throw new Error('no .wasm file in plugin directory');
        const wasmBinary = readFileSync(join(pluginDir, wasmFile));

        // Parse the SETTERS map from processor.js so we can dispatch controls by
        // port index (LADSPA) or symbol (LV2) without duplicating the naming logic.
        const processorSrc = readFileSync(join(pluginDir, 'processor.js'), 'utf8');
        const settersMatch = processorSrc.match(/const SETTERS\s*=\s*(\{[^\n]+\})/);
        const SETTERS = settersMatch ? JSON.parse(settersMatch[1]) : {};

        const { default: factory } = await import(indexUrl);
        let peak = await renderPeak(eff, factory, wasmBinary, SETTERS);
        let activated = 0;
        if (peak <= 1e-6) {
            const overrides = activationOverrides(eff.ports);
            if (overrides.size > 0) {
                peak = await renderPeak(eff, factory, wasmBinary, SETTERS, overrides);
                activated = overrides.size;
            }
        }

        if (peak > 1e-6) {
            const note = activated > 0 ? ` after ${activated} activation overrides` : '';
            console.log(`✓  peak ${peak.toFixed(5)}${note}`);
            passed++;
        } else {
            console.log(`✗  SILENT (peak ${peak})`);
            failed++;
        }
    } catch (e) {
        console.log(`✗  ERROR: ${e.message}`);
        failed++;
    }
}

console.log(`\n${'─'.repeat(40)}`);
console.log(`✓ ${passed} passed   ✗ ${failed} failed   ⏭ ${skipped} skipped`);
if (failed > 0) process.exit(1);

function resolveDefault(d, min, max) {
    if (d === null || d === undefined) return null;
    if (typeof d === 'number') return d;
    const s = String(d);
    if (s === 'min')    return min;
    if (s === 'max')    return max;
    if (s === 'low')    return min + (max - min) * 0.25;
    if (s === 'high')   return min + (max - min) * 0.75;
    if (s === 'middle') return min + (max - min) * 0.5;
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
}

async function renderPeak(eff, factory, wasmBinary, SETTERS, overrides = new Map()) {
    const mod = await factory({ wasmBinary });
    mod._shim_init(SAMPLE_RATE);

    // Dispatch values exactly like renderChain() does in the browser. This keeps
    // sample-rate-relative display values and hidden CV ports covered by tests.
    for (const p of visibleControlPorts(eff.ports)) {
        const key = setterKey(p);
        const uiValue = overrides.has(key)
            ? uiValueForPort(p, overrides.get(key))
            : portUiRange(p, SAMPLE_RATE).value;
        if (!Number.isFinite(uiValue)) continue;
        const fn = SETTERS[key];
        if (fn && typeof mod[fn] === 'function') {
            mod[fn](portValueForSet(p, uiValue, null, SAMPLE_RATE));
        }
    }

    const inBufFns  = Object.keys(mod).filter(k => k.startsWith('_shim_input_buf_'));
    const outBufFns = Object.keys(mod).filter(k => k.startsWith('_shim_output_buf_'));

    if (outBufFns.length === 0) throw new Error('no _shim_output_buf_* functions exported');

    let peak = 0;
    for (let b = 0; b < BLOCKS; b++) {
        fillAudioInputs(mod, inBufFns, b);
        mod._shim_run(BLOCK_SIZE);
        for (const fn of outBufFns) {
            const ptr = mod[fn]() >> 2;
            const buf = mod.HEAPF32.subarray(ptr, ptr + BLOCK_SIZE);
            for (let i = 0; i < BLOCK_SIZE; i++) {
                const abs = Math.abs(buf[i]);
                if (abs > peak) peak = abs;
            }
        }
    }

    return peak;
}

function activationOverrides(ports) {
    const overrides = new Map();

    for (const port of visibleControlPorts(ports)) {
        const text = `${port.symbol ?? ''} ${port.name ?? ''}`;
        const def = resolveDefault(port.default, port.min, port.max);
        if (/bypass|program|preset|latency|meter|peakreset|reset|sync|channel/i.test(text)) continue;

        if (/dry|thru|input|output|master|main|volume|level|gain|makeup|send/i.test(text)
            && isMuteLikeValue(port, def)) {
            overrides.set(setterKey(port), audibleHighValue(port));
        }

        if (/wet|mix/i.test(text) && isMuteLikeValue(port, def)) {
            overrides.set(setterKey(port), midValue(port));
        }

        if (/tap\s*\d+\s*level|feedback|feedb/i.test(text) && isMuteLikeValue(port, def)) {
            overrides.set(setterKey(port), audibleHighValue(port));
        }

        if (/enable|enabled|active|on$/i.test(text)) {
            overrides.set(setterKey(port), onValue(port));
        }
    }

    return overrides;
}

function setterKey(port) {
    return port.symbol ? String(port.symbol) : String(port.index);
}

function uiValueForPort(port, value) {
    return shouldScaleBySampleRate(port, value) ? value * SAMPLE_RATE : value;
}

function shouldScaleBySampleRate(port, value) {
    if (!port?.sampleRate || !Number.isFinite(value)) return false;
    const min = Number(port.min);
    const max = Number(port.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
    return value >= Math.min(min, max) && value <= Math.max(min, max);
}

function isMuteLikeValue(port, value) {
    if (!Number.isFinite(value)) return false;
    const text = `${port.symbol ?? ''} ${port.name ?? ''}`;
    if (/dB/i.test(text) && value <= -40) return true;
    if (Number.isFinite(port.min) && value <= Number(port.min) + Math.max(1e-7, Math.abs(Number(port.min)) * 1e-7)) return true;
    return Math.abs(value) <= 1e-7;
}

function onValue(port) {
    if (Number.isFinite(port.max) && Number.isFinite(port.min) && port.max !== port.min) return Number(port.max);
    const def = Number(port.default);
    return Number.isFinite(def) && def !== 1 ? 1 : 1;
}

function midValue(port) {
    if (!Number.isFinite(port.min) || !Number.isFinite(port.max)) return Number(port.default) || 0;
    return Number(port.min) + (Number(port.max) - Number(port.min)) * 0.5;
}

function audibleHighValue(port) {
    if (!Number.isFinite(port.min) || !Number.isFinite(port.max)) return Number(port.default) || 1;
    const min = Number(port.min);
    const max = Number(port.max);
    if (min < 0 && max > 0) return max;
    return min + (max - min) * 0.9;
}

function fillAudioInputs(mod, inBufFns, blockIndex) {
    const baseSample = blockIndex * BLOCK_SIZE;
    for (let i = 0; i < inBufFns.length; i++) {
        const ptr = mod[inBufFns[i]]() >> 2;
        // Alternate frequency slightly between channels so stereo plugins
        // receive genuinely different L/R signals rather than identical ones.
        const freq = i % 2 === 0 ? 440 : 554.37;
        for (let s = 0; s < BLOCK_SIZE; s++) {
            const t = (baseSample + s) / SAMPLE_RATE;
            mod.HEAPF32[ptr + s] = 0.5 * Math.sin(2 * Math.PI * freq * t);
        }
    }
}
