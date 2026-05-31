#!/usr/bin/env node
/**
 * Node WASM audio smoke test for LV2 instruments.
 *
 * For each instrument in plugins/instruments.json:
 *   1. Instantiate the WASM module directly (no AudioWorklet needed)
 *   2. Send a MIDI note-on (middle C, velocity 100)
 *   3. Run 20 blocks of 128 samples
 *   4. Assert peak amplitude > 1e-6 (non-silent)
 *
 * Usage:
 *   node scripts/test-instruments.js [--only <id>]
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname }            from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT        = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS     = join(ROOT, 'plugins');
const SAMPLE_RATE = 44100;
const BLOCK_SIZE  = 128;
const BLOCKS      = 20;   // ~58 ms — enough for ADSR attack to produce output

const args   = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const instruments = JSON.parse(readFileSync(join(PLUGINS, 'instruments.json'), 'utf8'));

let passed = 0, failed = 0;

for (const inst of instruments) {
    if (onlyId && inst.id !== onlyId) continue;

    const distDir  = join(PLUGINS, inst.id, 'dist');
    const indexUrl = pathToFileURL(join(distDir, 'index.js')).href;

    process.stdout.write(`  ${inst.id} … `);

    try {
        const wasmFile   = readdirSync(distDir).find(f => f.endsWith('.wasm'));
        if (!wasmFile) throw new Error('no .wasm file in dist/');
        const wasmBinary = readFileSync(join(distDir, wasmFile));

        const { default: factory } = await import(indexUrl);
        const mod = await factory({ wasmBinary });

        mod._shim_init(SAMPLE_RATE);
        mod._shim_midi_note_on(0, 60, 100);

        let peak = 0;
        for (let b = 0; b < BLOCKS; b++) {
            mod._shim_run(BLOCK_SIZE);
            const ptr = mod._shim_output_buf_out_l() >> 2;
            const buf = mod.HEAPF32.subarray(ptr, ptr + BLOCK_SIZE);
            for (let i = 0; i < BLOCK_SIZE; i++) {
                const abs = Math.abs(buf[i]);
                if (abs > peak) peak = abs;
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
console.log(`✓ ${passed} passed   ✗ ${failed} failed`);
if (failed > 0) process.exit(1);
