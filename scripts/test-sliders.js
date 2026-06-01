#!/usr/bin/env node
/**
 * Slider silence test — for every control port of every effect, verify
 * that setting it to min, default, and max still produces non-silent output.
 *
 * Each position is tested with all OTHER controls at their catalog defaults.
 * A failure means "this slider position makes the plugin completely silent",
 * which usually indicates a bad default range or an unreachable extreme value.
 *
 * Usage:
 *   node scripts/test-sliders.js [--only <id>]
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname }             from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT         = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_PLUGINS = join(ROOT, 'docs', 'plugins');
const SAMPLE_RATE  = 44100;
const BLOCK_SIZE   = 128;
const BLOCKS       = 64;   // ~186 ms
const SILENCE      = 1e-6;

const args   = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const KNOWN_SKIPS = new Set([
    'noise-repellent',
]);

// "<id>/<portKey>" → set of positions ('min'|'default'|'max') allowed to be silent.
// Ports that are intentionally silent at an extreme are listed here.
const SILENT_OK = {
    // wet/mix at 0 with dry also at 0 → silence expected
    'hard_limiter/1':           new Set(['min']),   // Wet level = 0 (no wet, no dry)
    'mda_TalkBox/wet':          new Set(['min']),   // wet=0 and dry default=0
    // dry/wet at -90 dB (minimum dB level = silence)
    'tape_delay/1':             new Set(['min']),   // Dry level = -90 dB
    'tap-pinknoise/signal':     new Set(['min']),   // Signal Level = -90 dB
    'tap-pitch/Wetlevel':       new Set(['min']),   // Wet Level = -90 dB (dry also default -90)
    'tap-sigmoid/Pregain':      new Set(['min']),   // Pregain = -90 dB → input muted
    'tap-sigmoid/Postgain':     new Set(['min']),   // Postgain = -90 dB → output muted
    // gate/threshold above the test signal level → gate stays closed
    'gate/3':                   new Set(['max']),   // Threshold +20 dB > -6 dBFS signal
    'mda_Dynamics/gate_thr':    new Set(['max']),   // Gate Thr = 0 dBFS > signal
    'mda_RePsycho/thresh':      new Set(['max']),   // Thresh = 0 dBFS > signal
    'ZamGate/thr':              new Set(['max']),   // Threshold = 0 dBFS > signal
    'ZamGateX2/thr':            new Set(['max']),
    // gate mode "shut" permanently closes the gate
    'ZamGate/mode':             new Set(['max']),
    'ZamGateX2/mode':           new Set(['max']),
    // 100% wet delay with delay time > test duration (~186 ms) → no wet signal arrives yet
    'mda_Delay/fx_mix':         new Set(['max']),
    'mda_DubDelay/fx_mix':      new Set(['max']),
    // miscellaneous parameter extremes that produce expected silence
    'mda_Dither/zoom':          new Set(['min']),   // Zoom = -80 dB output scale
    'mda_RezFilter/max_freq':   new Set(['min']),   // Max Freq = 0% → filter at 0 Hz
    'mda_Splitter/envelope':    new Set(['max']),   // Envelope 1000 ms > test duration
    'mda_TestTone/mode':        new Set(['max']),   // mode 1 requires specific sweep config
    'mda_Vocoder/envelope':     new Set(['min']),   // 14 ms too short; vocoder needs carrier
    // filter degenerate cases
    'fomp-mvclpf24/freq':       new Set(['min']),   // LPF at 0 Hz blocks everything
    'svf/3':                    new Set(['min']),   // SVF at 0 Hz cuts everything
    // freeze with no recorded buffer → silence
    'ZamGrains/freeze':         new Set(['max']),
    // notch at its own center frequency — attenuating the test tone is correct
    'notch_iir/0':              new Set(['default']),
};

const catalog = JSON.parse(readFileSync(join(DOCS_PLUGINS, 'catalog.json'), 'utf8'));

let passed = 0, failed = 0, skipped = 0;

for (const eff of catalog) {
    if (onlyId && eff.id !== onlyId) continue;
    if (KNOWN_SKIPS.has(eff.id)) { skipped++; continue; }

    const audioOut = eff.ports.filter(p => p.type === 'audio' && p.dir === 'output');
    if (audioOut.length === 0) { skipped++; continue; }

    const ctrlPorts = eff.ports.filter(p =>
        p.type === 'control' && p.dir === 'input' &&
        p.min !== null && p.min !== undefined &&
        p.max !== null && p.max !== undefined &&
        p.min !== p.max
    );
    if (ctrlPorts.length === 0) { skipped++; continue; }

    const pluginDir = join(DOCS_PLUGINS, eff.id);
    const wasmFile  = readdirSync(pluginDir).find(f => f.endsWith('.wasm'));
    if (!wasmFile) { console.log(`  ${eff.id} ✗  no .wasm`); failed++; continue; }

    const wasmBinary   = readFileSync(join(pluginDir, wasmFile));
    const processorSrc = readFileSync(join(pluginDir, 'processor.js'), 'utf8');
    const SETTERS      = JSON.parse(
        (processorSrc.match(/const SETTERS\s*=\s*(\{[^\n]+\})/) ?? [,'{}'])[1]
    );
    const indexUrl = pathToFileURL(join(pluginDir, 'index.js')).href;

    const issues = [];

    try {
        const { default: factory } = await import(indexUrl);

        async function runWith(overrides) {
            const mod = await factory({ wasmBinary });
            mod._shim_init(SAMPLE_RATE);
            // Apply catalog defaults
            for (const p of eff.ports) {
                if (p.type !== 'control' || p.dir !== 'input') continue;
                const v = resolveDefault(p.default, p.min, p.max);
                if (v === null) continue;
                const fn = p.symbol ? SETTERS[p.symbol] : SETTERS[String(p.index)];
                if (fn && typeof mod[fn] === 'function') mod[fn](v);
            }
            // Then the per-test override
            for (const [fn, val] of Object.entries(overrides)) {
                if (typeof mod[fn] === 'function') mod[fn](val);
            }
            const inBufs  = Object.keys(mod).filter(k => k.startsWith('_shim_input_buf_'));
            const outBufs = Object.keys(mod).filter(k => k.startsWith('_shim_output_buf_'));
            let peak = 0;
            for (let b = 0; b < BLOCKS; b++) {
                fillInputs(mod, inBufs, b);
                mod._shim_run(BLOCK_SIZE);
                for (const fn of outBufs) {
                    const ptr = mod[fn]() >> 2;
                    for (let i = 0; i < BLOCK_SIZE; i++) {
                        const a = Math.abs(mod.HEAPF32[ptr + i]);
                        if (a > peak) peak = a;
                    }
                }
            }
            return peak;
        }

        for (const p of ctrlPorts) {
            const portKey  = String(p.symbol ?? p.index);
            const silentOk = SILENT_OK[`${eff.id}/${portKey}`] ?? new Set();
            const fn       = p.symbol ? SETTERS[p.symbol] : SETTERS[String(p.index)];
            if (!fn) continue;

            const def = resolveDefault(p.default, p.min, p.max) ?? (p.min + p.max) / 2;
            const positions = [
                ['min',     p.min],
                ['default', def],
                ['max',     p.max],
            ];

            for (const [label, val] of positions) {
                if (silentOk.has(label)) continue;
                const peak = await runWith({ [fn]: val });
                if (peak <= SILENCE) {
                    issues.push(`  ✗ "${p.name}" at ${label} (${fmtVal(val)}) → SILENT`);
                }
            }
        }

        if (issues.length === 0) {
            process.stdout.write(`  ${eff.id} ✓\n`);
            passed++;
        } else {
            console.log(`  ${eff.id}:`);
            for (const msg of issues) console.log(msg);
            failed++;
        }
    } catch (e) {
        console.log(`  ${eff.id} ✗  ERROR: ${e.message}`);
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

function fillInputs(mod, fns, blockIndex) {
    const base = blockIndex * BLOCK_SIZE;
    for (let i = 0; i < fns.length; i++) {
        const ptr  = mod[fns[i]]() >> 2;
        const freq = i % 2 === 0 ? 440 : 554.37;
        for (let s = 0; s < BLOCK_SIZE; s++)
            mod.HEAPF32[ptr + s] = 0.5 * Math.sin(2 * Math.PI * freq * ((base + s) / SAMPLE_RATE));
    }
}

function fmtVal(v) {
    return typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(4)) : v;
}
