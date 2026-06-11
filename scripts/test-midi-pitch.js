#!/usr/bin/env node
/**
 * MIDI note pitch regression test for packaged instrument WASM builds.
 *
 * A plain audibility smoke test can pass even when a synth ignores MIDI note
 * number and renders every key at the same pitch. This test renders low and
 * high notes, estimates the dominant period, and fails when both estimates are
 * confident but essentially unchanged.
 *
 * Usage:
 *   node scripts/test-midi-pitch.js [--only <id>] [--verbose]
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { audibleRenderSummary, fmtMetric, isAudibleRender } from './lib/audio-audit.js';
import { readLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS = join(ROOT, 'plugins');
const SOUNDFONTS = join(ROOT, 'docs', 'soundfonts');

const SAMPLE_RATE = 44100;
const BLOCK_SIZE = 128;
const WARMUP_BLOCKS = 8;
const RENDER_BLOCKS = 384;
const LOW_NOTE = 48;
const HIGH_NOTE = 72;
const MIN_CONFIDENT_CORRELATION = 0.6;
const MIN_PITCH_RATIO = 1.35;
const MIN_NORMALIZED_NOTE_DIFF = 0.08;

const args = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const verbose = args.includes('--verbose');

const NON_MELODIC_SKIPS = new Map([
    ['chowkick', 'kick drum instrument'],
    ['drumkv1', 'drum sampler'],
    ['geonkick', 'kick drum instrument'],
    ['mda_BeatBox', 'drum machine'],
    ['samplv1', 'requires an external sample'],
]);

const lv2Plugins = new Map(readLv2Registry(ROOT).map(entry => [entry.id, entry]));
const instruments = JSON.parse(readFileSync(join(ROOT, 'docs', 'instruments.json'), 'utf8'));

let passed = 0;
let failed = 0;
let skipped = 0;
let inconclusive = 0;

for (const inst of instruments) {
    if (onlyId && inst.id !== onlyId) continue;
    if (!hasMidiInput(inst)) continue;

    const buildEntry = lv2Plugins.get(inst.id) ?? {};

    process.stdout.write(`  ${inst.id} ... `);

    if (buildEntry.threads) {
        console.log('skipped (threaded browser-only build)');
        skipped++;
        continue;
    }

    if (buildEntry.noTest || inst.noTest || NON_MELODIC_SKIPS.has(inst.id)) {
        console.log(`skipped (${NON_MELODIC_SKIPS.get(inst.id) ?? 'marked noTest'})`);
        skipped++;
        continue;
    }

    try {
        const distDir = join(PLUGINS, inst.id, 'dist');
        const wasmFile = readdirSync(distDir).find(file => file.endsWith('.wasm'));
        if (!wasmFile) throw new Error('no .wasm file in dist/');

        const wasmBinary = readFileSync(join(distDir, wasmFile));
        const indexUrl = pathToFileURL(join(distDir, 'index.js')).href;
        const { default: factory } = await import(`${indexUrl}?pitch=${Date.now()}-${Math.random()}`);

        if (inst.sf2 && !findTestSF2()) {
            console.log('skipped (no SF2 in docs/soundfonts)');
            skipped++;
            continue;
        }

        const low = await renderNote(inst, factory, wasmBinary, LOW_NOTE);
        const high = await renderNote(inst, factory, wasmBinary, HIGH_NOTE);

        if (!isAudibleRender(low.metrics) || !isAudibleRender(high.metrics)) {
            throw new Error(`inaudible note render: low ${audibleRenderSummary(low.metrics)}, high ${audibleRenderSummary(high.metrics)}`);
        }

        const confident = low.pitch.correlation >= MIN_CONFIDENT_CORRELATION
            && high.pitch.correlation >= MIN_CONFIDENT_CORRELATION;
        const ratio = frequencyRatio(low.pitch.frequency, high.pitch.frequency);
        const noteDiff = normalizedDifference(low.samples, high.samples);

        if (confident && ratio < MIN_PITCH_RATIO && noteDiff < MIN_NORMALIZED_NOTE_DIFF) {
            console.log(`FAILED (same pitch/audio: low ${pitchSummary(low.pitch)}, high ${pitchSummary(high.pitch)}, diff ${fmtMetric(noteDiff)})`);
            failed++;
            continue;
        }

        if (!confident) {
            console.log(`inconclusive (${LOW_NOTE} ${pitchSummary(low.pitch)}, ${HIGH_NOTE} ${pitchSummary(high.pitch)})`);
            inconclusive++;
            continue;
        }

        console.log(`passed (${LOW_NOTE} ${pitchSummary(low.pitch)}, ${HIGH_NOTE} ${pitchSummary(high.pitch)}, diff ${fmtMetric(noteDiff)})`);
        passed++;
    } catch (error) {
        console.log(`FAILED (${error.message})`);
        failed++;
    }
}

console.log(`\n${'-'.repeat(40)}`);
console.log(`${passed} passed   ${failed} failed   ${inconclusive} inconclusive   ${skipped} skipped`);
if (failed > 0) process.exit(1);

function hasMidiInput(inst) {
    return inst.ports?.some(port => port.type === 'midi' && port.dir === 'input');
}

async function renderNote(inst, factory, wasmBinary, note) {
    const mod = await factory({ wasmBinary });
    mod._shim_init(SAMPLE_RATE);

    if (typeof mod._shim_load_sf2 === 'function') {
        const sf2Path = findTestSF2();
        if (!sf2Path) throw new Error('no SF2 in docs/soundfonts');
        loadSF2IntoWasm(mod, sf2Path);
    }

    const outBufFns = Object.keys(mod).filter(key => key.startsWith('_shim_output_buf_'));
    if (outBufFns.length === 0) throw new Error('no _shim_output_buf_* functions exported');
    if (typeof mod._shim_midi_note_on !== 'function') throw new Error('no _shim_midi_note_on function exported');

    for (let b = 0; b < WARMUP_BLOCKS; b++) mod._shim_run(BLOCK_SIZE);
    mod._shim_midi_note_on(0, note, 100);

    const channels = outBufFns.map(() => []);
    for (let b = 0; b < RENDER_BLOCKS; b++) {
        mod._shim_run(BLOCK_SIZE);
        for (let c = 0; c < outBufFns.length; c++) {
            const ptr = mod[outBufFns[c]]() >> 2;
            const buf = mod.HEAPF32.subarray(ptr, ptr + BLOCK_SIZE);
            for (let i = 0; i < BLOCK_SIZE; i++) channels[c].push(buf[i]);
        }
    }

    const channel = channels
        .map(samples => Float32Array.from(samples))
        .sort((a, b) => renderMetrics(b).rms - renderMetrics(a).rms)[0];
    const metrics = renderMetrics(channel);
    const pitch = estimatePitch(channel);

    if (verbose) {
        console.log(`\n    note ${note}: ${audibleRenderSummary(metrics)}, ${pitchSummary(pitch)}`);
    }

    return { metrics, pitch, samples: channel };
}

function estimatePitch(samples) {
    const start = Math.floor(samples.length * 0.35);
    const end = samples.length;
    const minLag = Math.floor(SAMPLE_RATE / 4000);
    const maxLag = Math.floor(SAMPLE_RATE / 30);

    let bestLag = 0;
    let bestCorrelation = -Infinity;
    const correlations = [];

    for (let lag = minLag; lag <= maxLag; lag++) {
        let sum = 0;
        let aEnergy = 0;
        let bEnergy = 0;
        for (let i = start + lag; i < end; i++) {
            const a = samples[i];
            const b = samples[i - lag];
            sum += a * b;
            aEnergy += a * a;
            bEnergy += b * b;
        }
        const correlation = sum / Math.sqrt(Math.max(1e-20, aEnergy * bEnergy));
        correlations.push([lag, correlation]);
        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestLag = lag;
        }
    }

    const strongCorrelation = Math.max(MIN_CONFIDENT_CORRELATION, bestCorrelation - 0.015);
    for (const [lag, correlation] of correlations) {
        if (correlation >= strongCorrelation) {
            bestLag = lag;
            bestCorrelation = correlation;
            break;
        }
    }

    return {
        frequency: bestLag > 0 ? SAMPLE_RATE / bestLag : 0,
        correlation: bestCorrelation,
    };
}

function renderMetrics(samples) {
    let peak = 0;
    let sumSquares = 0;
    for (const sample of samples) {
        const abs = Math.abs(sample);
        if (abs > peak) peak = abs;
        sumSquares += sample * sample;
    }
    return { peak, rms: Math.sqrt(sumSquares / samples.length) };
}

function frequencyRatio(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return 0;
    return Math.max(a, b) / Math.min(a, b);
}

function normalizedDifference(a, b) {
    const start = Math.floor(Math.min(a.length, b.length) * 0.35);
    const count = Math.min(a.length, b.length) - start;
    let sumDiff = 0;
    let sumRef = 0;
    for (let i = start; i < start + count; i++) {
        const diff = a[i] - b[i];
        sumDiff += diff * diff;
        sumRef += Math.max(a[i] * a[i], b[i] * b[i]);
    }
    return Math.sqrt(sumDiff / Math.max(1e-20, sumRef));
}

function pitchSummary(pitch) {
    return `${fmtMetric(pitch.frequency)} Hz @ corr ${fmtMetric(pitch.correlation)}`;
}

function findTestSF2() {
    if (!existsSync(SOUNDFONTS)) return null;
    const file = readdirSync(SOUNDFONTS).find(name => name.endsWith('.sf2'));
    return file ? join(SOUNDFONTS, file) : null;
}

function loadSF2IntoWasm(mod, sf2Path) {
    const bytes = readFileSync(sf2Path);
    const ptr = mod._malloc(bytes.length);
    mod.HEAPU8.set(bytes, ptr);
    mod._shim_load_sf2(ptr, bytes.length);
    mod._free(ptr);
}
