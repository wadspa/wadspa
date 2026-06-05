#!/usr/bin/env node
/**
 * Node WASM audio smoke test for LV2 plugins.
 *
 * For each LV2 plugin in plugins/lv2.json:
 *   1. Instantiate the WASM module directly (no AudioWorklet needed)
 *   2. Send a MIDI note-on or feed a short audio test tone
 *   3. Run 128 blocks of 128 samples
 *   4. Assert peak and RMS exceed audible floors
 *
 * Usage:
 *   node scripts/test-instruments.js [--only <id>]
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname }            from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { audibleRenderSummary, isAudibleRender } from './lib/audio-audit.js';
import { readLv2Registry }          from './lib/lv2-registry.js';

const ROOT        = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS     = join(ROOT, 'plugins');
const SOUNDFONTS  = join(ROOT, 'docs', 'soundfonts');

// Find the first available SF2 in docs/soundfonts/ for testing SF2-capable plugins.
function findTestSF2() {
    if (!existsSync(SOUNDFONTS)) return null;
    const f = readdirSync(SOUNDFONTS).find(n => n.endsWith('.sf2'));
    return f ? join(SOUNDFONTS, f) : null;
}

// Load an SF2 file into a WASM module that exports _shim_load_sf2 + _malloc/_free.
function loadSF2IntoWasm(mod, sf2Path) {
    const bytes = readFileSync(sf2Path);
    const ptr   = mod._malloc(bytes.length);
    mod.HEAPU8.set(bytes, ptr);
    mod._shim_load_sf2(ptr, bytes.length);
    mod._free(ptr);
}
const SAMPLE_RATE = 44100;
const BLOCK_SIZE  = 128;
const BLOCKS      = 128;  // ~371 ms — enough for ADSR attack and audible level checks

const args   = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const lv2Plugins = readLv2Registry(ROOT);

let passed = 0, failed = 0, skipped = 0;

for (const inst of lv2Plugins) {
    if (onlyId && inst.id !== onlyId) continue;

    const distDir  = join(PLUGINS, inst.id, 'dist');
    const indexUrl = pathToFileURL(join(distDir, 'index.js')).href;

    process.stdout.write(`  ${inst.id} … `);

    // Threaded builds use SharedArrayBuffer and can't run in plain Node
    if (inst.threads) {
        console.log('⏭  skipped (threaded — browser-only)');
        skipped++;
        continue;
    }

    // Plugins that require external sample files cannot produce sound without them
    if (inst.noTest) {
        console.log('⏭  skipped (requires external samples)');
        skipped++;
        continue;
    }

    try {
        const wasmFile   = readdirSync(distDir).find(f => f.endsWith('.wasm'));
        if (!wasmFile) throw new Error('no .wasm file in dist/');
        const wasmBinary = readFileSync(join(distDir, wasmFile));

        const { default: factory } = await import(indexUrl);
        const mod = await factory({ wasmBinary });

        mod._shim_init(SAMPLE_RATE);

        const outBufFns = Object.keys(mod).filter(k => k.startsWith('_shim_output_buf_'));
        const inBufFns  = Object.keys(mod).filter(k => k.startsWith('_shim_input_buf_'));
        if (outBufFns.length === 0) throw new Error('no _shim_output_buf_* functions exported');

        // SF2-capable plugins (e.g. tsf) export _shim_load_sf2 and need an SF2
        // loaded before they produce any sound.
        if (typeof mod._shim_load_sf2 === 'function') {
            const sf2Path = findTestSF2();
            if (!sf2Path) {
                console.log('⏭  skipped (no SF2 in docs/soundfonts/ — run fetch-soundfonts.js)');
                skipped++;
                continue;
            }
            loadSF2IntoWasm(mod, sf2Path);
        }

        const hasMidi = typeof mod._shim_midi_note_on === 'function';
        const audioDriven = !hasMidi && inBufFns.length > 0;

        // Run a few silent warmup blocks before the note-on so that
        // PADsynth-style instruments (padthv1) can pre-generate their
        // wavetables during the first process() call's reset_test().
        if (hasMidi) {
            for (let b = 0; b < 4; b++) mod._shim_run(BLOCK_SIZE);
            mod._shim_midi_note_on(0, 60, 100);
        }

        let peak = 0;
        let sumSquares = 0;
        let sampleCount = 0;
        for (let b = 0; b < BLOCKS; b++) {
            if (audioDriven) fillAudioInputs(mod, inBufFns, b);
            mod._shim_run(BLOCK_SIZE);
            for (const fn of outBufFns) {
                const ptr = mod[fn]() >> 2;
                const buf = mod.HEAPF32.subarray(ptr, ptr + BLOCK_SIZE);
                for (let i = 0; i < BLOCK_SIZE; i++) {
                    const abs = Math.abs(buf[i]);
                    if (abs > peak) peak = abs;
                    sumSquares += buf[i] * buf[i];
                    sampleCount++;
                }
            }
        }

        const metrics = { peak, rms: Math.sqrt(sumSquares / sampleCount) };
        if (isAudibleRender(metrics)) {
            console.log(`✓  ${audibleRenderSummary(metrics)}`);
            passed++;
        } else {
            console.log(`✗  INAUDIBLE (${audibleRenderSummary(metrics)})`);
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
                0.35 * Math.sin(2 * Math.PI * fundamental * t) +
                0.2 * Math.sin(2 * Math.PI * overtone * t);
        }
    }
}
