#!/usr/bin/env node
/**
 * Node WASM audio smoke test for LV2 plugins.
 *
 * For each LV2 plugin in plugins/lv2.json:
 *   1. Instantiate the WASM module directly (no AudioWorklet needed)
 *   2. Send a MIDI note-on or feed a short audio test tone
 *   3. Run 64 blocks of 128 samples
 *   4. Assert peak amplitude > 1e-6 (non-silent)
 *
 * Usage:
 *   node scripts/test-instruments.js [--only <id>]
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname }            from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { readLv2Registry }          from './lib/lv2-registry.js';

const ROOT        = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS     = join(ROOT, 'plugins');
const SAMPLE_RATE = 44100;
const BLOCK_SIZE  = 128;
const BLOCKS      = 64;   // ~186 ms — enough for ADSR attack and time-windowed effects

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

        const hasMidi = typeof mod._shim_midi_note_on === 'function';
        const audioDriven = !hasMidi && inBufFns.length > 0;
        if (hasMidi) {
            mod._shim_midi_note_on(0, 60, 100);
        }

        let peak = 0;
        for (let b = 0; b < BLOCKS; b++) {
            if (audioDriven) fillAudioInputs(mod, inBufFns, b);
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

        if (peak > 1e-6) {
            console.log(`✓  peak ${peak.toFixed(5)}`);
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
