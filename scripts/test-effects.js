#!/usr/bin/env node
/**
 * Node WASM audio smoke test for all effects in docs/plugins/catalog.json.
 *
 * For each effect:
 *   1. Instantiate the WASM module directly (no AudioWorklet needed)
 *   2. Fill all audio input buffers with a 440 Hz sine tone
 *   3. Run 64 blocks of 128 samples (~186 ms)
 *   4. Assert peak amplitude > 1e-6 (non-silent)
 *
 * Usage:
 *   node scripts/test-effects.js [--only <id>]
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname }             from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT         = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_PLUGINS = join(ROOT, 'docs', 'plugins');
const SAMPLE_RATE  = 44100;
const BLOCK_SIZE   = 128;
const BLOCKS       = 64;   // ~186 ms

const args   = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

// Effects that cannot produce non-silent output in a headless test
// without special state (e.g. noise profile). Listed by id.
const KNOWN_SKIPS = new Set([
    'noise-repellent',  // requires a trained noise profile before reducing anything
]);

// Per-plugin setup called after _shim_init() to override extreme defaults
// that would produce silence at the test tone level.
const PLUGIN_SETUP = {
    // Default bit-depth=1 and sample-rate=0.001 (maximum decimation → silence).
    // The port has a LADSPA SampleRate hint: the raw value is a fraction of the
    // sample rate, but the plugin code uses it as literal Hz (fs/sample_rate).
    // Pass 44100 (= 1.0 * SAMPLE_RATE) for full-rate (no decimation).
    decimator:    mod => { mod._shim_set_bit_depth(16); mod._shim_set_sample_rate_hz(SAMPLE_RATE); },
    // Default wet=0 and residue=0 → both output paths are muted.
    hard_limiter: mod => { mod._shim_set_wet_level(1.0); },
    // Default dry=-90 dB and tape-speed=0 → no audio passes through.
    tape_delay:   mod => { mod._shim_set_dry_level_db(0); mod._shim_set_tape_speed_inches_sec_1_normal(1.0); },
};

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

        const { default: factory } = await import(indexUrl);
        const mod = await factory({ wasmBinary });

        mod._shim_init(SAMPLE_RATE);
        PLUGIN_SETUP[eff.id]?.(mod);

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
