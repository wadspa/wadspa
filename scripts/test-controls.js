#!/usr/bin/env node
/**
 * Control port validation for all wadspa plugins.
 *
 * For each plugin with control input ports:
 *   1. Measure baseline peak at all-default controls.
 *   2. For each control: sweep min → max, verify no crash/silence (unless the
 *      control is a gain/volume that legitimately silences at 0).
 *   3. For each control: check that min and max produce *different* output at
 *      some point (wired-control check). Reports but does not fail on unchanged
 *      controls — some need specific conditions to hear (e.g. chorus depth
 *      requires sustained audio, filter type at neutral settings looks the same).
 *
 * Usage:
 *   node scripts/test-controls.js [--only <id>] [--verbose]
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname }                          from 'path';
import { fileURLToPath, pathToFileURL }           from 'url';
import { readLv2Registry }                        from './lib/lv2-registry.js';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS = join(ROOT, 'plugins');

const args     = process.argv.slice(2);
const onlyId   = args.includes('--only')   ? args[args.indexOf('--only')   + 1] : null;
const verbose  = args.includes('--verbose');

const SR       = 44100;
const BLOCK    = 128;
const WARMUP   = 8;     // silent blocks before note-on
const MEASURE  = 32;    // blocks to measure peak over (~93 ms)

const lv2Plugins = readLv2Registry(ROOT);

// Controls whose name/symbol hints they are volume/gain — silencing at 0 is correct.
const SILENCE_OK_RE = /volume|gain|wet|level|send|mix|amp(?!litude)/i;
// Controls that are enum-like integers — just check they don't crash.
const ENUM_RE = /type|mode|shape|slope|select|model|waveform/i;

let totalPlugins = 0, passedPlugins = 0, failedPlugins = 0, skippedPlugins = 0;
let totalControls = 0, wirelessControls = 0, crashedControls = 0;

function measurePeak(mod, outBufFns, inBufFns, hasMidi, blocks) {
    let peak = 0;
    const audioDriven = !hasMidi && inBufFns.length > 0;
    for (let b = 0; b < blocks; b++) {
        if (audioDriven) {
            for (let ch = 0; ch < inBufFns.length; ch++) {
                const fn = inBufFns[ch];
                const ptr = mod[fn]() >> 2;
                const f = (ch % 2 === 0) ? 110 : 147;
                for (let i = 0; i < BLOCK; i++) {
                    const t = (b * BLOCK + i) / SR;
                    mod.HEAPF32[ptr + i] = 0.35 * Math.sin(2 * Math.PI * f * t)
                                         + 0.20 * Math.sin(2 * Math.PI * f * 4 * t);
                }
            }
        }
        mod._shim_run(BLOCK);
        for (const fn of outBufFns) {
            const ptr = mod[fn]() >> 2;
            const buf = mod.HEAPF32.subarray(ptr, ptr + BLOCK);
            for (let i = 0; i < BLOCK; i++) {
                const a = Math.abs(buf[i]); if (a > peak) peak = a;
            }
        }
    }
    return peak;
}

function setCtrl(mod, setterFn, value) {
    if (setterFn && typeof mod[setterFn] === 'function') mod[setterFn](value);
}

for (const inst of lv2Plugins) {
    if (onlyId && inst.id !== onlyId) continue;
    if (inst.threads || inst.noTest)  { skippedPlugins++; continue; }

    const distDir  = join(PLUGINS, inst.id, 'dist');
    const indexUrl = pathToFileURL(join(distDir, 'index.js')).href;
    if (!existsSync(join(distDir, 'index.js'))) { skippedPlugins++; continue; }

    process.stdout.write(`  ${inst.id} … `);

    try {
        const wasmFile   = readdirSync(distDir).find(f => f.endsWith('.wasm'));
        const wasmBinary = readFileSync(join(distDir, wasmFile));
        const { default: factory } = await import(indexUrl + '?t=' + Date.now());
        const mod = await factory({ wasmBinary });
        mod._shim_init(SR);

        const outBufFns = Object.keys(mod).filter(k => k.startsWith('_shim_output_buf_'));
        const inBufFns  = Object.keys(mod).filter(k => k.startsWith('_shim_input_buf_'));
        if (outBufFns.length === 0) throw new Error('no output buffers');

        // SF2 plugins skip — can't load SF2 in this test
        if (typeof mod._shim_load_sf2 === 'function') {
            console.log('⏭  skipped (SF2 required)'); skippedPlugins++; continue;
        }

        const hasMidi   = typeof mod._shim_midi_note_on === 'function';
        const setters   = Object.keys(mod).filter(k => k.startsWith('_shim_set_'));
        const getters   = Object.keys(mod).filter(k => k.startsWith('_shim_get_'));

        // Map control ports from the meta (parsed from index.js)
        const src = readFileSync(join(distDir, 'index.js'), 'utf8');
        const metaMatch = src.match(/export const meta\s*=\s*(\{[\s\S]*?\});\s*export/);
        let ctrlPorts = [];
        if (metaMatch) {
            try {
                const meta = JSON.parse(metaMatch[1]);
                ctrlPorts = meta.ports.filter(p =>
                    p.type === 'control' && p.dir === 'input' &&
                    p.min !== null && p.max !== null && p.min !== p.max
                );
            } catch {}
        }

        // ── Baseline: warmup + note-on + measure ──
        for (let b = 0; b < WARMUP; b++) mod._shim_run(BLOCK);
        if (hasMidi) mod._shim_midi_note_on(0, 60, 100);
        const baseline = measurePeak(mod, outBufFns, inBufFns, hasMidi, MEASURE);

        if (baseline < 1e-6) {
            console.log(`✗  SILENT at defaults (peak ${baseline})`);
            failedPlugins++; continue;
        }

        if (ctrlPorts.length === 0) {
            console.log(`✓  no control ports  (baseline ${baseline.toFixed(5)})`);
            passedPlugins++; totalPlugins++;
            continue;
        }

        // ── Per-control sweep ──
        const pluginFails = [];
        const pluginWireless = [];
        let ctrlIdx = 0;

        for (const p of ctrlPorts) {
            totalControls++;
            const sym   = p.symbol;
            const setFn = `_shim_set_${sym}`;
            const getFn = `_shim_get_${sym}`;
            if (!setters.includes(setFn)) continue;  // not exported, skip

            const def  = p.default ?? p.min;
            const mn   = p.min;
            const mx   = p.max;
            const mid  = (mn + mx) / 2;
            const isEnum    = ENUM_RE.test(p.name) || (mx - mn <= 5 && Number.isInteger(mx - mn));
            const silenceOk = SILENCE_OK_RE.test(p.name);

            // Test three sample values: min, mid, max
            const testVals = isEnum
                ? [mn, Math.round(mid), mx]               // integer enum: test edges + middle
                : [mn, mid, mx];

            let minPeak = -1, maxPeak = -1;
            let crashed = false;

            for (const val of testVals) {
                try {
                    setCtrl(mod, setFn, val);
                    // Re-trigger note if MIDI (re-press so we have fresh audio)
                    if (hasMidi) { mod._shim_midi_note_on(0, 60, 100); }
                    const pk = measurePeak(mod, outBufFns, inBufFns, hasMidi, MEASURE / 2);
                    if (val <= mid) minPeak = Math.max(minPeak, pk);
                    else             maxPeak = Math.max(maxPeak, pk);

                    // Fail if silence at a non-silence-ok control (not at explicit 0)
                    if (pk < 1e-8 && !silenceOk && val !== 0 && val !== mn) {
                        pluginFails.push(`  ✗ ${p.name} = ${val.toFixed(3)} → SILENT`);
                        crashedControls++; crashed = true;
                    }
                } catch (e) {
                    pluginFails.push(`  ✗ ${p.name} = ${val.toFixed(3)} → CRASH: ${e.message}`);
                    crashedControls++; crashed = true;
                }
            }

            // Restore default
            setCtrl(mod, setFn, def);
            if (hasMidi) mod._shim_midi_note_on(0, 60, 100);

            // Wired check: do min and max produce meaningfully different output?
            if (!crashed && minPeak >= 0 && maxPeak >= 0 && !isEnum) {
                const ratio = maxPeak > 0 ? minPeak / maxPeak : 0;
                const tooSimilar = Math.abs(minPeak - maxPeak) < 1e-4
                                   || (ratio > 0.98 && ratio < 1.02);
                if (tooSimilar && !silenceOk) {
                    pluginWireless.push(`  ⚠ ${p.name}: min≈max (${minPeak.toFixed(5)} / ${maxPeak.toFixed(5)})`);
                    wirelessControls++;
                }
            }

            ctrlIdx++;
            if (verbose) process.stdout.write('.');
        }

        const nCtrl = ctrlIdx;
        totalPlugins++;
        if (pluginFails.length > 0) {
            console.log(`✗  ${nCtrl} controls  (${pluginFails.length} failed)`);
            for (const m of pluginFails) console.log(m);
            failedPlugins++;
        } else {
            const warnStr = pluginWireless.length > 0 ? `  ⚠ ${pluginWireless.length} controls appear unwired` : '';
            console.log(`✓  ${nCtrl} controls tested  baseline=${baseline.toFixed(5)}${warnStr}`);
            if (verbose && pluginWireless.length > 0) {
                for (const m of pluginWireless) console.log(m);
            }
            passedPlugins++;
        }
    } catch (e) {
        console.log(`✗  ERROR: ${e.message}`);
        failedPlugins++;
    }
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`plugins: ✓ ${passedPlugins}  ✗ ${failedPlugins}  ⏭ ${skippedPlugins}`);
console.log(`controls: ${totalControls} tested   ${crashedControls} crashes   ${wirelessControls} appear unwired`);
if (failedPlugins > 0) process.exit(1);
