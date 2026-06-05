#!/usr/bin/env node
/**
 * Control influence test for every packaged wadspa plugin.
 *
 * For each control input port:
 *   1. Resolve the exact SETTERS entry used by the generated AudioWorklet.
 *   2. Verify the mapped WASM setter/getter exists and round-trips values.
 *   3. Render deterministic audio at default controls.
 *   4. Render again with only that control changed.
 *   5. Fail if every candidate value produces effectively unchanged audio.
 *   6. In --ui-defaults mode, sweep continuous browser sliders across their
 *      full travel and fail if any sampled section is acoustically dead.
 *
 * This catches sliders/arguments that are present in metadata but not wired into
 * the Web Audio processor or WASM shim.
 *
 * Usage:
 *   node scripts/test-sliders.js [--only <id>] [--verbose] [--ui-defaults] [--effects-only]
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
    defaultPortValuesForUi,
    exclusiveToggleGroupForPort,
    portUiRange,
    portValueFromSlider,
    sliderRangeForPort,
    usesMenuControl,
    visibleControlPorts,
} from '../docs/control-utils.js';
import { readLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const DOCS_PLUGINS = join(DOCS, 'plugins');
const SOUNDFONTS = join(DOCS, 'soundfonts');

const SAMPLE_RATE = 44100;
const BLOCK_SIZE = 128;
const WARMUP_BLOCKS = 8;
const RENDER_BLOCKS = 512; // ~1.49 s: enough for envelopes, gates, and most delay/reverb tails.
const MIDI_NOTE_OFF_BLOCK = 320;
const MIDI_PROBE_NOTES = [48, 55, 60, 64, 67, 72];
const POLYPHONY_PROBE_NOTES = [36, 40, 43, 47, 50, 52, 55, 59, 62, 64, 67, 71, 74, 76, 79, 83];
const SILENCE = 1e-7;
const ABS_RMS_DIFF = 1e-7;
const REL_RMS_DIFF = 1e-5;
const NOISE_MULTIPLIER = 6;
const DEFAULT_PROFILE = { key: 'default' };
const DYNAMICS_PROFILE = { key: 'dynamics', audio: 'dynamics', renderBlocks: 1024 };
const FAST_DYNAMICS_PROFILE = { key: 'fast-dynamics', audio: 'fast-dynamics', renderBlocks: 1024 };
const ENVELOPE_PROFILE = { key: 'envelope', renderBlocks: 2048, midiNoteOffBlock: 512 };
const SOFT_ENVELOPE_PROFILE = { key: 'soft-envelope', renderBlocks: 2048, midiNoteOffBlock: 512, midiVelocity: 72 };
const LONG_SUSTAIN_PROFILE = { key: 'long-sustain', renderBlocks: 4096, midiNoteOffBlock: 8192 };
const VL1_RHYTHM_PROFILE = {
    key: 'vl1-rhythm',
    renderBlocks: 2048,
    midiNoteOffBlock: 8192,
    initialCc: [
        [0, 0x50, 4],
        [0, 0x51, 127],
    ],
};
const LFO_PROFILE = { key: 'lfo', renderBlocks: 2048 };
const SWEEP_PROFILE = { key: 'sweep', renderBlocks: 12288 };
const BEATBOX_PROFILE = { key: 'beatbox', audio: 'beatbox-sequence', renderBlocks: 1024 };
const BEATBOX_FAST_RATE_PROFILE = { key: 'beatbox-fast-rate', audio: 'beatbox-fast-rate', renderBlocks: 1024 };
const BEATBOX_THRESHOLD_PROFILE = { key: 'beatbox-threshold', audio: 'beatbox-threshold', renderBlocks: 1024 };
const POLYPHONY_PROFILE = {
    key: 'polyphony',
    midiNotes: POLYPHONY_PROBE_NOTES,
    midiIntervalBlocks: 3,
    midiNoteOffBlock: 180,
};
const WOLF_SHAPER_TEST_GRAPH = '0x0p+0,0x1.99999ap-4,0x0p+0,0;0x1p-1,0x1.4cccccp-1,0x0p+0,0;0x1p+0,0x1p-2,0x0p+0,0;';
const REQUIRED_SLIDER_SWEEP_SEGMENTS = 4;

const args = process.argv.slice(2);
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const verbose = args.includes('--verbose');
const uiDefaultsMode = args.includes('--ui-defaults');
const effectsOnly = args.includes('--effects-only');

const lv2Registry = new Map(readLv2Registry(ROOT).map(entry => [entry.id, entry]));
const docsCatalog = readJsonIfExists(join(DOCS_PLUGINS, 'catalog.json'), []);
const docsInstruments = readJsonIfExists(join(DOCS, 'instruments.json'), []);
const docsEntries = new Map([...docsCatalog, ...docsInstruments].map(entry => [entry.id, entry]));

const KNOWN_SKIPS = new Map([
    ['noise-repellent', 'requires a trained noise profile'],
    ['drumkv1', 'requires external drum samples'],
    ['samplv1', 'requires an external sample'],
]);

// Some controls are runtime routing/state controls or meters exposed as input
// ports. They can be set and read back, but a single deterministic note/tone
// render is not a meaningful proof of audible influence.
const UNCHANGED_OK = new Map([
    ['ZamDelay/sync', 'host tempo sync has no effect without host transport/BPM state'],
    ['ZamDelay/lpf', 'delay low-pass is only audible on delayed repeats in this probe'],
    ['ZamDelay/divider', 'tempo divider is only active when sync is enabled'],
    ['ZamDelay/div', 'tempo divisor is only active with host transport/BPM state'],
    ['fil4/peakreset', 'peak-hold reset is analyzer/UI state, not audio processing'],
    ['tap-pitch/Latency', 'latency is a reported output/state value, not an audio control'],
    ['tsf/gain', 'covered by SF2 render when a soundfont is installed'],
    ['ZamGEQ31/band29', 'top 20.8 kHz band is disabled by the plugin at a 44.1 kHz test sample rate'],
]);

let passedPlugins = 0;
let failedPlugins = 0;
let skippedPlugins = 0;
let testedControls = 0;
let failedControls = 0;
let allowedUnchanged = 0;

for (const id of discoverPluginIds()) {
    if (onlyId && id !== onlyId) continue;

    const pluginDir = join(DOCS_PLUGINS, id);
    const registryEntry = lv2Registry.get(id) ?? {};
    const docsEntry = docsEntries.get(id) ?? {};

    if (KNOWN_SKIPS.has(id) || registryEntry.noTest) {
        skippedPlugins++;
        if (verbose) console.log(`  ${id} - skipped (${KNOWN_SKIPS.get(id) ?? 'marked noTest'})`);
        continue;
    }

    process.stdout.write(`  ${id} ... `);

    try {
        const meta = readMeta(pluginDir);
        const audioOut = meta.ports.filter(p => p.type === 'audio' && p.dir === 'output');
        const allCtrlPorts = meta.ports.filter(p => p.type === 'control' && p.dir === 'input');
        const testSurfacePorts = uiDefaultsMode ? visibleControlPorts(meta.ports) : allCtrlPorts;
        const ctrlPorts = testSurfacePorts.filter(isTestableControl);

        if (audioOut.length === 0) {
            console.log('skipped (no audio outputs)');
            skippedPlugins++;
            continue;
        }

        if (ctrlPorts.length === 0) {
            console.log('skipped (no ranged controls)');
            skippedPlugins++;
            continue;
        }

        const processorSrc = readFileSync(join(pluginDir, 'processor.js'), 'utf8');
        const setters = parseSetters(processorSrc);
        const wasmFile = readdirSync(pluginDir).find(file => file.endsWith('.wasm'));
        if (!wasmFile) throw new Error('no .wasm file in plugin directory');

        const wasmBinary = readFileSync(join(pluginDir, wasmFile));
        const indexUrl = pathToFileURL(join(pluginDir, 'index.js')).href;
        const { default: factory } = await import(`${indexUrl}?test=${Date.now()}-${Math.random()}`);

        const options = {
            id,
            meta,
            setters,
            portsByKey: new Map(meta.ports
                .filter(port => port.type === 'control' && port.dir === 'input')
                .map(port => [setterKey(port), port])),
            factory,
            wasmBinary,
            sf2: meta.sf2 || docsEntry.sf2,
        };

        if (options.sf2 && !findTestSF2()) {
            console.log('skipped (no SF2 in docs/soundfonts)');
            skippedPlugins++;
            continue;
        }

        let baseSupport = uiDefaultsMode ? browserDefaultOverridesFor(allCtrlPorts) : new Map();
        let baseline = await renderWith(options, baseSupport);
        let repeat = await renderWith(options, baseSupport);
        ensureFiniteRender(`${id} default controls`, baseline);
        ensureFiniteRender(`${id} default controls repeat`, repeat);
        if (!uiDefaultsMode && baseline.peak <= SILENCE) {
            baseSupport = baselineSupportOverridesFor(allCtrlPorts);
            baseline = await renderWith(options, baseSupport);
            repeat = await renderWith(options, baseSupport);
            ensureFiniteRender(`${id} activated controls`, baseline);
            ensureFiniteRender(`${id} activated controls repeat`, repeat);
            if (baseline.peak <= SILENCE) {
                const note = baseSupport.size > 0 ? ` after ${baseSupport.size} activation overrides` : '';
                throw new Error(`silent at default controls${note} (peak ${fmtMetric(baseline.peak)})`);
            }
        }

        const noise = compareAudio(baseline.audio, repeat.audio);
        const referenceCache = new Map([[
            overrideKey(baseSupport),
            { reference: baseline, referenceRepeat: repeat, noise },
        ]]);
        const issues = [];
        const allowed = [];

        for (const port of ctrlPorts) {
            testedControls++;
            const key = setterKey(port);
            const setter = setters[key];
            const getter = setter?.replace('_shim_set_', '_shim_get_');
            const portLabel = `${port.name} [${key}]`;

            if (!setter) {
                issues.push(`${portLabel}: missing SETTERS entry`);
                continue;
            }

            const roundtripIssue = await verifyRoundtrip(options, port, setter, getter);
            if (roundtripIssue) {
                issues.push(`${portLabel}: ${roundtripIssue}`);
                continue;
            }

            const currentValue = baseSupport.has(key) ? baseSupport.get(key) : undefined;
            const requireSweepCoverage = uiDefaultsMode && requiresSliderSweepCoverage(port, options);
            const candidates = requireSweepCoverage
                ? sliderSweepCandidateValues(port)
                : candidateValues(port, currentValue);
            const diffs = [];
            let changed = false;
            let rangeCovered = true;
            let rangeIssue = null;
            const renderedCandidates = [];
            const support = uiDefaultsMode
                ? mergeOverrides(baseSupport, uiContextSupportOverridesFor(port, allCtrlPorts, options))
                : mergeOverrides(baseSupport, supportOverridesFor(port, allCtrlPorts, options));
            const profile = renderProfileFor(options, port);
            const cacheKey = `${profile.key}:${overrideKey(support)}`;
            let cached = referenceCache.get(cacheKey);
            if (!cached) {
                const reference = await renderWith(options, support, profile);
                const referenceRepeat = await renderWith(options, support, profile);
                ensureFiniteRender(`${id} ${portLabel} reference`, reference);
                ensureFiniteRender(`${id} ${portLabel} reference repeat`, referenceRepeat);
                cached = {
                    reference,
                    referenceRepeat,
                    noise: compareAudio(reference.audio, referenceRepeat.audio),
                };
                referenceCache.set(cacheKey, cached);
            }

            for (const candidate of candidates) {
                const overrides = candidateOverridesFor(port, candidate.value, support, allCtrlPorts);
                const rendered = await renderWith(options, overrides, profile);
                if (rendered.nonFinite > 0) {
                    diffs.push(`${candidate.label} nonfinite=${rendered.nonFinite}`);
                    issues.push(`${portLabel}: ${candidate.label} produced ${rendered.nonFinite} non-finite samples`);
                    changed = true;
                    break;
                }
                if (uiDefaultsMode && isUnexpectedDropout(options, port, cached.reference, rendered)) {
                    diffs.push(`${candidate.label} peak=${fmtMetric(rendered.peak)}`);
                    issues.push(`${portLabel}: ${candidate.label} caused output dropout (reference peak=${fmtMetric(cached.reference.peak)}, rendered peak=${fmtMetric(rendered.peak)})`);
                    changed = true;
                    break;
                }
                const diff = compareAudio(cached.reference.audio, rendered.audio);
                diffs.push(`${candidate.label} rms=${fmtMetric(diff.rms)} rel=${fmtMetric(diff.relative)}`);
                renderedCandidates.push({ candidate, rendered });
                if (audioChanged(diff, cached.noise)) {
                    changed = true;
                    if (!requireSweepCoverage) break;
                }
            }

            if (requireSweepCoverage && renderedCandidates.length === candidates.length) {
                const coverage = sliderSweepCoverage(port, renderedCandidates, cached.noise);
                changed = coverage.changed;
                rangeCovered = coverage.ok;
                rangeIssue = coverage.issue;
                if (verbose && coverage.summary) diffs.push(coverage.summary);
            }

            if (!changed || !rangeCovered) {
                const allowedReason = UNCHANGED_OK.get(`${id}/${key}`);
                if (allowedReason) {
                    allowed.push(`${portLabel}: ${allowedReason}`);
                    allowedUnchanged++;
                } else {
                    const message = !changed
                        ? `no audible change (${diffs.join(', ')})`
                        : `${rangeIssue} (${diffs.join(', ')})`;
                    issues.push(`${portLabel}: ${message}`);
                }
            }
        }

        if (issues.length > 0) {
            failedControls += issues.length;
            failedPlugins++;
            console.log(`FAILED (${issues.length} control issues)`);
            for (const issue of issues) console.log(`    - ${issue}`);
            if (verbose && allowed.length > 0) {
                for (const item of allowed) console.log(`    allowed: ${item}`);
            }
        } else {
            passedPlugins++;
            const allowedText = allowed.length > 0 ? `, ${allowed.length} allowed unchanged` : '';
            console.log(`ok (${ctrlPorts.length} controls${allowedText})`);
            if (verbose && allowed.length > 0) {
                for (const item of allowed) console.log(`    allowed: ${item}`);
            }
        }
    } catch (error) {
        failedPlugins++;
        console.log(`ERROR: ${error.message}`);
    }
}

console.log(`\n${'-'.repeat(60)}`);
console.log(`plugins: ${passedPlugins} passed, ${failedPlugins} failed, ${skippedPlugins} skipped`);
console.log(`controls: ${testedControls} tested, ${failedControls} failed, ${allowedUnchanged} allowed unchanged`);
if (failedPlugins > 0) process.exit(1);

function discoverPluginIds() {
    const effectIds = new Set(docsCatalog.map(entry => entry.id));
    return readdirSync(DOCS_PLUGINS, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(id => existsSync(join(DOCS_PLUGINS, id, 'index.js')))
        .filter(id => !effectsOnly || effectIds.has(id))
        .sort((a, b) => a.localeCompare(b));
}

function readJsonIfExists(path, fallback) {
    if (!existsSync(path)) return fallback;
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

function isTestableControl(port) {
    return port.type === 'control'
        && port.dir === 'input'
        && Number.isFinite(port.min)
        && Number.isFinite(port.max)
        && port.min !== port.max;
}

function setterKey(port) {
    return port.symbol ? String(port.symbol) : String(port.index);
}

async function verifyRoundtrip(options, port, setter, getter) {
    const candidate = candidateValues(port)[0]?.value;
    if (!Number.isFinite(candidate)) return null;

    const mod = await instantiate(options);
    if (typeof mod[setter] !== 'function') return `mapped setter ${setter} is not exported`;
    if (typeof mod[getter] !== 'function') return null;

    mod[setter](scaleValueForPort(port, candidate));
    const got = mod[getter]();
    const expected = scaleValueForPort(port, candidate);
    const tolerance = Math.max(1e-5, Math.abs(expected) * 1e-5);
    if (Math.abs(got - expected) > tolerance) {
        return `${setter}/${getter} roundtrip ${fmtVal(expected)} -> ${fmtVal(got)}`;
    }

    return null;
}

async function renderWith(options, overrides, profile = DEFAULT_PROFILE) {
    const mod = await instantiate(options);
    applyDefaults(mod, options.meta.ports, options.setters);
    applyTestState(mod, options);

    for (const [key, value] of overrides) {
        const fn = options.setters[key];
        const port = options.portsByKey.get(key);
        if (typeof mod[fn] === 'function') mod[fn](scaleValueForPort(port, value));
    }
    const inBufFns = Object.keys(mod).filter(k => k.startsWith('_shim_input_buf_')).sort();
    const outBufFns = Object.keys(mod).filter(k => k.startsWith('_shim_output_buf_')).sort();
    const hasMidi = typeof mod._shim_midi_note_on === 'function';
    const renderBlocks = profile.renderBlocks ?? RENDER_BLOCKS;
    const midiNoteOffBlock = profile.midiNoteOffBlock ?? MIDI_NOTE_OFF_BLOCK;
    const audio = new Float32Array(outBufFns.length * BLOCK_SIZE * renderBlocks);

    for (let b = 0; b < WARMUP_BLOCKS; b++) {
        if (!hasMidi) fillAudioInputs(mod, inBufFns, -WARMUP_BLOCKS + b);
        mod._shim_run(BLOCK_SIZE);
    }

    if (hasMidi) sendInitialMidiProbe(mod, profile);

    let peak = 0;
    let nonFinite = 0;
    let write = 0;
    for (let block = 0; block < renderBlocks; block++) {
        if (hasMidi && block === midiNoteOffBlock) {
            for (const note of midiProbeNotes(profile)) mod._shim_midi_note_off(0, note);
        }
        if (hasMidi) sendMidiProbeBlock(mod, block, profile);
        if (!hasMidi) fillAudioInputs(mod, inBufFns, block, profile);
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
            }
        }
    }

    return { audio, peak, nonFinite };
}

async function instantiate(options) {
    const mod = await options.factory({ wasmBinary: options.wasmBinary, print() {}, printErr() {} });
    mod._shim_init(SAMPLE_RATE);

    if (options.sf2 && typeof mod._shim_load_sf2 === 'function') {
        loadSF2IntoWasm(mod, findTestSF2());
    }

    return mod;
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

function applyTestState(mod, options) {
    if (!/wolf[_-]?shaper/i.test(`${options.id} ${options.meta.name ?? ''}`)) return;
    if (typeof mod._shim_set_plugin_state !== 'function') return;
    setPluginState(mod, 'graph', WOLF_SHAPER_TEST_GRAPH);
}

function setPluginState(mod, key, value) {
    if (typeof mod._malloc !== 'function' || typeof mod._free !== 'function' || !mod.HEAPF32?.buffer) return;
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
    new Uint8Array(mod.HEAPF32.buffer).set(bytes, ptr);
    return ptr;
}

function candidateValues(port, currentValue = undefined) {
    const uiRange = portUiRange(port, SAMPLE_RATE);
    const slider = sliderRangeForPort(port, uiRange);
    const min = Number(slider.min);
    const max = Number(slider.max);
    const current = Number.isFinite(currentValue) ? Number(currentValue) : Number(uiRange.value);
    const mid = min + (max - min) * 0.5;
    const quarter = min + (max - min) * 0.25;
    const threeQuarter = min + (max - min) * 0.75;
    const raw = [
        ['min', min],
        ['max', max],
        ['mid', mid],
        ['low', quarter],
        ['high', threeQuarter],
    ];
    if (/zero[_\s-]*db|0\s*dB/i.test(controlText(port)) && Number.isFinite(min) && Number.isFinite(max)) {
        raw.splice(2, 0, ['trim', min + (max - min) * 0.9]);
    }

    const seen = new Set();
    const candidates = [];
    for (const [label, sliderValue] of raw) {
        const value = portValueFromSlider(port, sliderValue, uiRange);
        if (!Number.isFinite(value)) continue;
        if (Number.isFinite(current) && Math.abs(value - current) <= Math.max(1e-7, Math.abs(current) * 1e-7)) {
            continue;
        }
        const rounded = quantizeCandidate(port, value);
        const key = rounded.toPrecision(9);
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push({ label, value: rounded });
    }

    return candidates.slice(0, 3);
}

function sliderSweepCandidateValues(port) {
    const uiRange = portUiRange(port, SAMPLE_RATE);
    const slider = sliderRangeForPort(port, uiRange);
    const min = Number(slider.min);
    const max = Number(slider.max);
    const raw = [
        ['0%', min],
        ['25%', min + (max - min) * 0.25],
        ['50%', min + (max - min) * 0.5],
        ['75%', min + (max - min) * 0.75],
        ['100%', max],
    ];

    const seen = new Set();
    const candidates = [];
    for (const [label, sliderValue] of raw) {
        const value = portValueFromSlider(port, sliderValue, uiRange);
        if (!Number.isFinite(value)) continue;
        const rounded = quantizeCandidate(port, value);
        const key = rounded.toPrecision(9);
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push({ label, value: rounded });
    }

    return candidates;
}

function requiresSliderSweepCoverage(port, options) {
    if (!uiDefaultsMode) return false;
    if (port.toggled || port.integer || port.enumeration || usesMenuControl(port) || isEnumLike(port)) return false;
    const text = controlText(port);
    const context = `${options.id} ${options.meta.name ?? ''} ${text}`;
    if (/mda[_-]?BeatBox/i.test(context)) {
        return !/record/i.test(text);
    }
    if (/channel|program|preset|mode|select|output select|bypass|sync|latency|meter|reset|peakreset|threshold|thresh|(?:^|[_\s-])thr(?:$|[_\s-])|trigger|limiter|\blink\b|zero[_\s-]*db|0\s*dB|maximum|minimum|\bmax\b|\bmin\b/i.test(context)) {
        return false;
    }
    if (/gate/i.test(context) && /\bhold\b/i.test(text)) return false;
    if (/polyphony|voices|sections/i.test(text)) return false;
    return true;
}

function isUnexpectedDropout(options, port, reference, rendered) {
    const context = `${options.id} ${options.meta.name ?? ''}`;
    const key = setterKey(port);
    if (!/mda[_-]?BeatBox/i.test(context) || !/^(kik_trig|snr_trig)$/.test(key)) {
        return false;
    }
    if (reference.peak <= 1e-5) return false;
    return rendered.peak < Math.max(1e-6, reference.peak * 0.05);
}

function sliderSweepCoverage(port, renderedCandidates, noise) {
    if (renderedCandidates.length < REQUIRED_SLIDER_SWEEP_SEGMENTS + 1) {
        return {
            ok: false,
            changed: false,
            issue: `range sweep had ${renderedCandidates.length} distinct slider values; expected ${REQUIRED_SLIDER_SWEEP_SEGMENTS + 1} values for ${REQUIRED_SLIDER_SWEEP_SEGMENTS} audio-change levels`,
        };
    }

    const segmentSummaries = [];
    const activeSegments = [];
    for (let i = 0; i < renderedCandidates.length - 1; i++) {
        const left = renderedCandidates[i];
        const right = renderedCandidates[i + 1];
        const diff = compareAudio(left.rendered.audio, right.rendered.audio);
        const active = sliderSegmentChanged(diff, noise);
        activeSegments.push(active);
        segmentSummaries.push(`${left.candidate.label}-${right.candidate.label} rms=${fmtMetric(diff.rms)} rel=${fmtMetric(diff.relative)}`);
    }

    const endToEnd = compareAudio(
        renderedCandidates[0].rendered.audio,
        renderedCandidates[renderedCandidates.length - 1].rendered.audio,
    );
    const endToEndChanged = audioChanged(endToEnd, noise);
    const changed = endToEndChanged || activeSegments.some(Boolean);
    const coveredPoints = renderedCandidates.map((_, index) =>
        (index > 0 && activeSegments[index - 1]) || (index < activeSegments.length && activeSegments[index]));
    const uncovered = coveredPoints
        .map((covered, index) => covered ? null : renderedCandidates[index].candidate.label)
        .filter(Boolean);
    const uncoveredInterior = coveredPoints
        .map((covered, index) => ({ covered, index }))
        .filter(item => item.index > 0 && item.index < coveredPoints.length - 1 && !item.covered)
        .map(item => renderedCandidates[item.index].candidate.label);
    const activeCount = activeSegments.filter(Boolean).length;
    const ok = activeCount >= REQUIRED_SLIDER_SWEEP_SEGMENTS && uncovered.length === 0;

    return {
        ok,
        changed,
        issue: `range sweep needs ${REQUIRED_SLIDER_SWEEP_SEGMENTS} audio-change levels; uncovered ${uncovered.join(', ') || 'none'}, interior ${uncoveredInterior.join(', ') || 'none'}, active segments ${activeCount}/${activeSegments.length}, end-to-end rms=${fmtMetric(endToEnd.rms)} rel=${fmtMetric(endToEnd.relative)}`,
        summary: `sweep ${segmentSummaries.join(', ')}`,
    };
}

function sliderSegmentChanged(diff, noise) {
    const rmsFloor = Math.max(ABS_RMS_DIFF * 0.5, noise.rms * NOISE_MULTIPLIER);
    const relFloor = Math.max(REL_RMS_DIFF * 0.5, noise.relative * NOISE_MULTIPLIER);
    return diff.rms > rmsFloor && diff.relative > relFloor && diff.max > SILENCE;
}

function browserDefaultOverridesFor(allCtrlPorts) {
    const support = new Map();
    const defaults = defaultPortValuesForUi(allCtrlPorts, SAMPLE_RATE, { activateEffectToggles: true });
    for (const port of allCtrlPorts) {
        const value = defaults.get(port);
        if (Number.isFinite(value)) support.set(setterKey(port), value);
    }
    return support;
}

function candidateOverridesFor(port, value, support, allCtrlPorts) {
    const overrides = new Map(support);
    if (uiDefaultsMode && value >= 0.5) {
        for (const peer of exclusiveToggleGroupForPort(port, allCtrlPorts)) {
            if (setterKey(peer) !== setterKey(port)) overrides.set(setterKey(peer), 0);
        }
    }
    overrides.set(setterKey(port), value);
    return overrides;
}

function supportOverridesFor(port, allCtrlPorts, options) {
    const text = controlText(port);
    const support = new Map();
    const interesting = /attack|att\b|decay|dec\b|sustain|sus\b|release|rel\b|hold|knee|ratio|threshold|limit|compress|gate|slew|sidechain|makeup|mak\d*|rms|peak|residue|frequency|freq|rate|bpm|xover|crossover|cutoff|resonance|reso|bandwidth|\bbw\b|\bq\b|filter|shelf|shelv|slope|section|sec\d|toggle|sync|gain|boost|cut|level|volume|distort|character|smooth|integrator|dith|hurst|fractal|noise|delay|time|tap|distance|speed|slowdown|feedback|damp|tone|room|reverb|echo|chorus|flanger|phaser|sweep|width|phase|shape|warp|wave|osc|dco|gen\d|lfo|mod|depth|amount|wet|mix|voice|detune|polyphony|portamento|glide|pitchbend|pressure|velocity/i.test(text);
    if (!interesting) return support;

    const set = (other, value) => {
        if (!other || setterKey(other) === setterKey(port) || !Number.isFinite(value)) return;
        support.set(setterKey(other), value);
    };

    const sameGroup = other => shareControlGroup(port, other);
    const allText = allCtrlPorts.map(controlText).join(' ');
    const currentIsDynamics = isDynamicsControl(text, allCtrlPorts, options);
    const currentIsEq = isEqOrFilterControl(text);
    const currentIsEnvelope = isEnvelopeControl(text);
    const currentIsLfo = isLfoControl(`${options.id} ${options.meta.name ?? ''} ${text}`)
        || (/\brate\b/i.test(text)
            && /mod|depth|vibrato|tremolo|chorus|flanger|phaser|rotary/i.test(`${options.id} ${options.meta.name ?? ''} ${allText}`));
    const currentIsTimeFx = isTimeFxControl(text) && !currentIsEnvelope && !currentIsLfo;
    const currentIsLfoDestination = currentIsLfo
        && /pitch|cutoff|reso|resonance|volume|panning|balance|ringmod|ring mod|amount|depth/i.test(text)
        && !/rate|freq|bpm|shape|width|sync|sweep|attack|att\b|decay|dec\b|sustain|sus\b|release|rel\b/i.test(text);
    const currentIsDistortion = isDistortionControl(text);
    const currentIsOscillator = isOscillatorControl(text) && !/lfo/i.test(text);
    const currentIsPitchControl = /sample|detune|tuning|fine|pitch|octave|range/i.test(text);
    const currentModFamily = modulationFamily(text);

    for (const other of allCtrlPorts) {
        const otherText = controlText(other);
        if (setterKey(other) === setterKey(port)) continue;
        if (/output select/i.test(otherText) && /key filter|lf key|hf key/i.test(text)) {
            set(other, lowValue(other));
            continue;
        }
        if (/control\s*mode|controlmode/i.test(otherText)) {
            set(other, onValue(other));
            continue;
        }
        if (/bypass|dry|program|preset|latency|meter|peakreset|reset/i.test(otherText)) continue;

        const sibling = sameGroup(other);
        const globalActivator = /enable|enabled|active|\bon\b|wet|depth|amount|send|modulation|compressorEnable|^filter\s+filter$/i.test(otherText);
        const allowGlobalActivator = currentIsDynamics
            || currentIsEq
            || currentIsTimeFx
            || currentIsEnvelope
            || (currentIsLfo && !currentIsLfoDestination)
            || currentIsDistortion
            || /sync|mod/i.test(text);

        if (/de[-_ ]?ess/i.test(`${options.id} ${options.meta.name ?? ''}`) && /threshold/i.test(otherText)) {
            set(other, minValue(other));
            continue;
        }
        if (/mda[_-]?Splitter/i.test(`${options.id} ${options.meta.name ?? ''}`)
            && /\blevel\b/i.test(text)
            && /level[_\s-]*sw/i.test(otherText)) {
            set(other, lowValue(other));
            continue;
        }
        if (/mda[_-]?SubSynth/i.test(`${options.id} ${options.meta.name ?? ''}`)
            && /release|rel\b/i.test(text)
            && /type/i.test(otherText)) {
            set(other, onValue(other));
            continue;
        }
        if (/mda[_-]?Degrade/i.test(`${options.id} ${options.meta.name ?? ''}`)
            && /integrator/i.test(text)
            && /\brate\b/i.test(otherText)) {
            set(other, minValue(other));
            continue;
        }
        if (/mda[_-]?Dither/i.test(`${options.id} ${options.meta.name ?? ''}`)
            && /dith.*amp|amp.*dith/i.test(text)
            && /\bdither\b/i.test(otherText)) {
            set(other, onValue(other));
            continue;
        }
        if (/mda[_-]?TestTone/i.test(`${options.id} ${options.meta.name ?? ''}`)
            && /sweep/i.test(text)
            && /mode/i.test(otherText)) {
            set(other, 1);
            continue;
        }
        if (/mda[_-]?TestTone/i.test(`${options.id} ${options.meta.name ?? ''}`)
            && /sweep/i.test(text)
            && /\bf1\b/i.test(otherText)) {
            set(other, 0.05);
            continue;
        }
        if (/mda[_-]?TestTone/i.test(`${options.id} ${options.meta.name ?? ''}`)
            && /sweep/i.test(text)
            && /\bf2\b/i.test(otherText)) {
            set(other, 0.8);
            continue;
        }
        if (/mda[_-]?VocInput/i.test(`${options.id} ${options.meta.name ?? ''}`)
            && /max.*freq|freq.*max/i.test(text)
            && /tracking/i.test(otherText)) {
            set(other, onValue(other));
            continue;
        }
        if (/fomp[_-]?reverbs|reverb/i.test(`${options.id} ${options.meta.name ?? ''}`)
            && /xover|crossover/i.test(text)) {
            if (/rt[_\s-]*low|low/i.test(otherText)) set(other, highValue(other));
            if (/rt[_\s-]*mid|mid/i.test(otherText)) set(other, lowValue(other));
            continue;
        }
        if (/tap[_-]?pinknoise|pink.*noise/i.test(`${options.id} ${options.meta.name ?? ''}`)
            && /hurst|fractal/i.test(text)
            && /\bnoise\b/i.test(otherText)) {
            set(other, audibleHighValue(other));
            continue;
        }
        if (/wolf[_-]?shaper/i.test(`${options.id} ${options.meta.name ?? ''}`)) {
            const currentVerticalWarp = /vwarp|v\s+warp|vertical/i.test(text);
            const otherVerticalWarp = /vwarp|v\s+warp|vertical/i.test(otherText);
            if (/warpamount/i.test(text) && /warptype/i.test(otherText) && currentVerticalWarp === otherVerticalWarp) {
                set(other, highValue(other));
                continue;
            }
            if (/warptype/i.test(text) && /warpamount/i.test(otherText) && currentVerticalWarp === otherVerticalWarp) {
                set(other, highValue(other));
                continue;
            }
        }
        if (/phaser/i.test(`${options.id} ${options.meta.name ?? ''}`) && /out.*mix|mix.*out|wet/i.test(otherText)) {
            set(other, audibleHighValue(other));
            continue;
        }
        if (/ZamDynamicEQ/i.test(`${options.id} ${options.meta.name ?? ''}`)) {
            if (/thr|threshold/i.test(otherText)) {
                set(other, /slew|knee|\bkn\b/i.test(text) ? highValue(other) : dynamicsThresholdValue(other, text));
            }
            if (/slew/i.test(text) && /knee|\bkn\b/i.test(otherText)) set(other, highValue(other));
            if (/rat|ratio/i.test(otherText)) set(other, highValue(other));
            if (/^max\b|max boost/i.test(otherText)) set(other, highValue(other));
            if (/boostcut|boost.*cut/i.test(otherText)) set(other, onValue(other));
            if (/togglepeak|peak/i.test(otherText) && !/toggle|shelf|peak/i.test(text)) set(other, onValue(other));
        }

        if (currentModFamily && modulationFamily(otherText) === currentModFamily) {
            if (/freq|frequency|rate|speed|bpm/i.test(otherText) && !/freq|frequency|rate|speed|bpm/i.test(text)) {
                set(other, modulationRateValue(other));
                continue;
            }
            if (/gain|depth|amount|level|amp|mix|wet|index/i.test(otherText)
                && !/gain|depth|amount|level|amp|mix|wet|index/i.test(text)) {
                set(other, audibleHighValue(other));
                continue;
            }
        }

        if ((interesting && allowGlobalActivator && globalActivator)
            || (sibling && /enable|enabled|active|section|sec\d|shelf|toggle|highpass|lowpass/i.test(otherText))) {
            set(other, onValue(other));
            continue;
        }

        if (currentIsEq || sibling) {
            if (/gain|boost|cut|level|amount|depth/i.test(otherText)) set(other, audibleHighValue(other));
            if (/resonance|reso|\bq\b|bandwidth|\bbw\b/i.test(otherText) && !/frequency|freq|cutoff/i.test(text)) {
                set(other, audibleHighValue(other));
            }
            if (/cutoff|frequency|freq/i.test(otherText) && /envelope|env|reso|resonance/i.test(text)) {
                set(other, lowValue(other));
            }
            if (/cutoff|frequency|freq/i.test(otherText) && /slope|bandwidth|\bbw\b|\bq\b/i.test(text)) {
                set(other, midValue(other));
            }
        }

        if (currentIsDynamics) {
            if (/attack|att\b/i.test(otherText) && /release|rel\b|slew|rms|peak/i.test(text)) set(other, minValue(other));
            if (/release|rel\b/i.test(otherText) && /rms|peak/i.test(text)) set(other, minValue(other));
            if (/threshold|limit|peak limit/i.test(otherText)
                && !(/ZamDynamicEQ/i.test(`${options.id} ${options.meta.name ?? ''}`) && /slew|knee|\bkn\b/i.test(text))) {
                set(other, dynamicsThresholdValue(other, text));
            }
            if (/ratio/i.test(otherText)) set(other, highValue(other));
            if (/function|dynamics.*mode|mode.*dynamics/i.test(otherText)) set(other, dynamicsModeValue(other));
            if (/offset/i.test(otherText)) set(other, audibleHighValue(other));
            if (/\bvol\b|volume|level/i.test(otherText) && !/threshold|sidechain/i.test(otherText)) set(other, audibleHighValue(other));
            if (/makeup|gain|output/i.test(otherText)) set(other, neutralValue(other));
            if (/compress|enable|active/i.test(otherText) || (/gate/i.test(otherText) && !/close|open/i.test(otherText))) {
                set(other, onValue(other));
            }
            if (/range/i.test(otherText) && /gate|hold|decay|key filter|lf key|hf key/i.test(text)) set(other, lowValue(other));
        }

        if (currentIsTimeFx) {
            if (/wet|mix|depth|amount|send|feedback/i.test(otherText)) set(other, audibleHighValue(other));
            if (/delay|time/i.test(otherText)) set(other, shortTimeValue(other));
            if (/voices|number of voices/i.test(otherText)) set(other, highValue(other));
            if (/detune|separation|mod|lfo|rate/i.test(otherText)) set(other, audibleHighValue(other));
            if (/frequency|freq|speed|rate/i.test(otherText) && /tap|delay/i.test(text)) set(other, highValue(other));
            if (sibling && /tap/i.test(text) && /level|gain/i.test(otherText)) set(other, audibleHighValue(other));
            if (sibling && /tap/i.test(text) && /distance|delay|time/i.test(otherText)) set(other, shortTimeValue(other));
        }

        if (currentIsEnvelope && !currentIsDynamics) {
            if (/attack|att\b/i.test(otherText) && /decay|dec\b|sustain|sus\b|release|rel\b|hold/i.test(text)) {
                set(other, minValue(other));
            }
            if (/\bhold\b/i.test(otherText) && /decay|dec\b|release|rel\b/i.test(text)) set(other, minValue(other));
            if (/decay|dec\b/i.test(otherText) && /release|rel\b/i.test(text)) set(other, highValue(other));
            if (/decay|dec\b/i.test(otherText) && /\bhold\b/i.test(text)) set(other, minValue(other));
            if (/sustain|sus\b/i.test(otherText) && /decay|dec\b/i.test(text)) set(other, lowValue(other));
            if (/decay|dec\b/i.test(otherText) && /sustain|sus\b/i.test(text)) set(other, lowValue(other));
            if (/sustain|sus\b/i.test(otherText) && /release|rel\b/i.test(text)) set(other, highValue(other));
            if (/volume|level|gain/i.test(otherText)) set(other, audibleHighValue(other));
            if (/amount|depth|env.*amt|env.*amount|envelope.*amount/i.test(otherText)) set(other, audibleHighValue(other));
            if (/cutoff|frequency|freq/i.test(otherText) && /filter|vcf|dcf|lfo/i.test(text)) set(other, lowValue(other));
        }

        if (currentIsLfo) {
            if (/lfo.*enabled|enabled.*lfo|enable|active/i.test(otherText)) set(other, onValue(other));
            if (!currentIsLfoDestination
                && /pitch|cutoff|reso|volume|panning|balance|ringmod|amount|depth|amp|range|detune|slowdown|voice|separation|mod|feedback/i.test(otherText)) {
                set(other, audibleHighValue(other));
            }
            if (/lfo.*ringmod|ringmod.*lfo/i.test(text) && /ringmod|ring mod/i.test(otherText) && !/lfo/i.test(otherText)) {
                set(other, audibleHighValue(other));
            }
            if (/rate|freq/i.test(otherText) && !/rate|freq/i.test(text)) set(other, midValue(other));
        }

        if (/fm.*gain|gm.*gain|gain.*fm/i.test(text) && /\bfm\b|mod/i.test(otherText)) {
            set(other, modulationValue(other));
        }

        if (/mod.*ratio|ratio.*mod|fm.*ratio|ratio.*fm/i.test(text)) {
            if (/mod.*index|index.*mod|fm.*gain|mod.*gain/i.test(otherText)) set(other, audibleHighValue(other));
            if (/mod.*decay|decay.*mod/i.test(otherText)) set(other, highValue(other));
            if (/gain|volume|level/i.test(otherText)) set(other, audibleHighValue(other));
        }

        if (/freq.*mod|mod.*freq/i.test(text)) {
            if (/lfo.*freq|lfo.*rate|rate|freq/i.test(otherText)) set(other, midValue(other));
            if (/mod.*osc|osc.*mod|freq.*osc/i.test(otherText)) set(other, onValue(other));
        }

        if (currentIsOscillator) {
            if (/balance|mix|level|volume|gain/i.test(otherText)) set(other, midValue(other));
            if (!currentIsPitchControl && /detune|tuning|fine|pitch|octave|range/i.test(otherText)) {
                set(other, /mix|balance/i.test(text) ? midValue(other) : audibleHighValue(other));
            }
            if (/width|pulse|shape|wave/i.test(otherText) && /sync|mix|balance/i.test(text)) set(other, midValue(other));
            if (/ringmod|ring mod/i.test(text) && /sync/i.test(otherText)) set(other, onValue(other));
            if (/ringmod|ring mod/i.test(text) && /detune|tuning|pitch/i.test(otherText)) set(other, midValue(other));
        }

        if (currentIsDistortion) {
            if (!/character/i.test(otherText)
                && /drive|crunch|distort|pregain|pre gain|gain|amount|level|amp|amplitude|wet|mix/i.test(otherText)) {
                set(other, audibleHighValue(other));
            }
        }

        if (/polyphony/i.test(text) && /mono/i.test(otherText)) set(other, lowValue(other));
        if (/portamento|glide/i.test(text) && /polyphony|voices|keyboard|mono|legato|glide|portamento/i.test(otherText)) {
            set(other, /polyphony|voices/i.test(otherText)
                ? lowValue(other)
                : /keyboard|mode/i.test(otherText)
                    ? midValue(other)
                    : onValue(other));
        }
        if (/pitchbend|modwheel|pressure|velocity/i.test(text) && /pitchbend|modwheel|pressure|velocity/i.test(otherText)) {
            set(other, audibleHighValue(other));
        }
    }

    return support;
}

function uiContextSupportOverridesFor(port, allCtrlPorts, options) {
    const text = controlText(port);
    const context = `${options.id} ${options.meta.name ?? ''}`;
    const support = new Map();
    const set = (other, value) => {
        if (!other || setterKey(other) === setterKey(port) || !Number.isFinite(value)) return;
        support.set(setterKey(other), value);
    };

    if (/key filter|lf key|hf key/i.test(text)) {
        const outputSelect = allCtrlPorts.find(other => /output select/i.test(controlText(other)));
        set(outputSelect, lowValue(outputSelect));
    }

    if (/mda[_-]?TestTone/i.test(context) && /sweep/i.test(text)) {
        const mode = allCtrlPorts.find(other => /\bmode\b/i.test(controlText(other)));
        const f1 = allCtrlPorts.find(other => /\bf1\b/i.test(controlText(other)));
        const f2 = allCtrlPorts.find(other => /\bf2\b/i.test(controlText(other)));
        set(mode, 1);
        set(f1, 0.05);
        set(f2, 0.8);
    }

    if (/so-666/i.test(context) && /midi channel|\bchannel\b/i.test(text)) {
        const controlMode = allCtrlPorts.find(other => /control\s*mode|controlmode/i.test(controlText(other)));
        set(controlMode, minValue(controlMode));
    }

    if (isEnvelopeControl(text)) {
        for (const other of allCtrlPorts) {
            const otherText = controlText(other);
            if (/attack|att\b/i.test(otherText) && /decay|dec\b|sustain|sus\b|release|rel\b|hold/i.test(text)) {
                set(other, minValue(other));
            }
            if (/decay|dec\b/i.test(otherText) && /release|rel\b/i.test(text)) {
                set(other, highValue(other));
            } else if (/decay|dec\b/i.test(otherText) && /sustain|sus\b|hold/i.test(text)) {
                set(other, lowValue(other));
            }
            if (/sustain|sus\b/i.test(otherText) && /release|rel\b/i.test(text)) {
                set(other, highValue(other));
            }
            if (/volume|level|gain/i.test(otherText)) {
                set(other, audibleHighValue(other));
            }
        }
    }

    if (/portamento|glide/i.test(text)) {
        for (const other of allCtrlPorts) {
            const otherText = controlText(other);
            if (/polyphony|voices/i.test(otherText)) {
                set(other, lowValue(other));
            } else if (/keyboard|mono|legato|glide|portamento/i.test(otherText)) {
                set(other, /keyboard|mode/i.test(otherText) ? midValue(other) : onValue(other));
            }
        }
    }

    const currentModFamily = modulationFamily(text);
    if (currentModFamily) {
        for (const other of allCtrlPorts) {
            const otherText = controlText(other);
            if (modulationFamily(otherText) !== currentModFamily) continue;
            if (/freq|frequency|rate|speed|bpm/i.test(otherText) && !/freq|frequency|rate|speed|bpm/i.test(text)) {
                set(other, modulationRateValue(other));
            }
            if (/gain|depth|amount|level|amp|mix|wet|index/i.test(otherText)
                && !/gain|depth|amount|level|amp|mix|wet|index/i.test(text)) {
                set(other, audibleHighValue(other));
            }
        }
    }

    return support;
}

function baselineSupportOverridesFor(allCtrlPorts) {
    const support = new Map();
    const set = (port, value) => {
        if (!port || !Number.isFinite(value)) return;
        support.set(setterKey(port), value);
    };

    for (const port of allCtrlPorts) {
        const text = controlText(port);
        const def = resolveDefault(port.default, port.min, port.max);
        if (/bypass|program|preset|latency|meter|peakreset|reset|sync|channel/i.test(text)) continue;

        if (/dry|thru|input|output|master|main|volume|level|gain|makeup|send/i.test(text)
            && isMuteLikeValue(port, def)) {
            set(port, audibleHighValue(port));
        }

        if (/wet|mix/i.test(text) && isMuteLikeValue(port, def)) {
            set(port, midValue(port));
        }

        if (/tap\s*\d+\s*level|feedback|feedb/i.test(text) && isMuteLikeValue(port, def)) {
            set(port, audibleHighValue(port));
        }

        if (/enable|enabled|active|on$/i.test(text)) {
            set(port, onValue(port));
        }
    }

    return support;
}

function mergeOverrides(...maps) {
    const merged = new Map();
    for (const map of maps) {
        for (const [key, value] of map) merged.set(key, value);
    }
    return merged;
}

function ensureFiniteRender(label, rendered) {
    if (rendered.nonFinite > 0) {
        throw new Error(`${label} produced ${rendered.nonFinite} non-finite samples`);
    }
}

function renderProfileFor(options, port) {
    const text = controlText(port);
    const contextText = `${options.id} ${options.meta.name ?? ''} ${text}`;
    if (/mda[_-]?BeatBox/i.test(`${options.id} ${options.meta.name ?? ''}`)) {
        if (/hat.*rate|hat_rate/i.test(text)) return BEATBOX_FAST_RATE_PROFILE;
        if (/threshold|thresh|(?:^|[_\s-])thr(?:$|[_\s-])/i.test(text)) return BEATBOX_THRESHOLD_PROFILE;
        return BEATBOX_PROFILE;
    }
    if (/mda[_-]?TestTone/i.test(`${options.id} ${options.meta.name ?? ''}`) && /sweep/i.test(text)) {
        return SWEEP_PROFILE;
    }
    if (/nekobi|tb-303|acid/i.test(contextText) && /decay/i.test(text)) {
        return SOFT_ENVELOPE_PROFILE;
    }
    if (/vl1|vl-tone/i.test(contextText) && /sustain.*time|sustain[_\s-]*time/i.test(text)) {
        return LONG_SUSTAIN_PROFILE;
    }
    if (/vl1|vl-tone/i.test(contextText) && /tempo/i.test(text)) {
        return VL1_RHYTHM_PROFILE;
    }
    if (options.meta.ports.some(p => p.type === 'midi' && p.dir === 'input') && isEnvelopeControl(text)) {
        return ENVELOPE_PROFILE;
    }
    if (options.meta.ports.some(p => p.type === 'midi' && p.dir === 'input') && /polyphony/i.test(text)) {
        return POLYPHONY_PROFILE;
    }
    if (!options.meta.ports.some(p => p.type === 'midi' && p.dir === 'input')
        && (isDynamicsControl(text, options.meta.ports, options) || /BeatBox|tap-dynamics/i.test(options.id))) {
        if (/tap[_-]?dynamics/i.test(options.id) && /attack|att\b/i.test(text)) {
            return FAST_DYNAMICS_PROFILE;
        }
        return DYNAMICS_PROFILE;
    }
    if (!options.meta.ports.some(p => p.type === 'midi' && p.dir === 'input')
        && /lfo|rate|vibrato|tremolo|chorus|flanger|phaser|rotary|freq.*mod|mod.*freq/i.test(contextText)) {
        return LFO_PROFILE;
    }
    return DEFAULT_PROFILE;
}

function isDynamicsControl(text, allCtrlPorts = [], options = null) {
    const allText = allCtrlPorts.map(controlText).join(' ');
    if (/\bcomp|compress|threshold|knee|limit|gate|slew|sidechain|makeup|rms|peak|residue|dynamics/i.test(text)) {
        return true;
    }
    if (/ratio/i.test(text)) {
        return !/mod|osc|lfo|fm/i.test(text)
            && /threshold|knee|limit|compress|gate|makeup|gain reduction|rms|peak|slew/i.test(allText);
    }

    if (!/attack|att\b|release|rel\b|hold|decay|dec\b/i.test(text)) return false;
    if (options?.meta?.ports?.some(p => p.type === 'midi' && p.dir === 'input')) return false;

    return /threshold/i.test(allText)
        && /ratio|knee|limit|compress|gate|makeup|gain reduction|rms|peak|slew/i.test(allText);
}

function isEqOrFilterControl(text) {
    return /frequency|freq|cutoff|resonance|reso|bandwidth|\bbw\b|\bq\b|filter|shelf|section|sec\d|toggle|gain|boost|cut/i.test(text);
}

function isTimeFxControl(text) {
    return /delay|time|tap|distance|speed|slowdown|feedback|damp|room|reverb|echo|chorus|flanger|phase|phaser|voice|detune|separation|wet|mix|depth/i.test(text);
}

function isEnvelopeControl(text) {
    return /attack|att\b|decay|dec\b|sustain|sus\b|release|rel\b|hold|env|envelope/i.test(text);
}

function isLfoControl(text) {
    return /lfo|mod\s*freq|freq.*mod|modwheel|modulation|pitchbend|pressure|vibrato|tremolo/i.test(text);
}

function isDistortionControl(text) {
    return /distort|drive|clip|shaper|warp|crunch|saturation|fold|crossover|smooth/i.test(text);
}

function isOscillatorControl(text) {
    return /osc|dco|gen\d|wave|pulse|sync|ringmod|ring mod|detune|octave|tuning/i.test(text);
}

function modulationFamily(text) {
    const raw = String(text).toLowerCase();
    const compact = raw.replace(/[^a-z0-9]+/g, '');
    if (/\bam\b|amod|amplitude\s*mod/.test(raw) || compact.includes('amod')) return 'am';
    if (/\bfm\b|fmod|frequency\s*mod/.test(raw) || compact.includes('fmod')) return 'fm';
    if (/\blfo\b/.test(raw) || compact.includes('lfo')) return 'lfo';
    return '';
}

function shareControlGroup(a, b) {
    const aGroups = controlGroups(a);
    if (aGroups.size === 0) return false;
    for (const group of controlGroups(b)) {
        if (aGroups.has(group)) return true;
    }
    return false;
}

function controlGroups(port) {
    const raw = String(`${port.symbol ?? ''} ${port.name ?? ''}`).toLowerCase();
    const groups = new Set();

    for (const match of raw.matchAll(/(?:^|[^a-z0-9])(?:freq(?:uency)?|cutoff|bw|bandwidth|q|gain|level|section|sec|toggle|reso(?:nance)?|sustain|sus|attack|att|decay|dec|release|rel|amount|depth|wet|mix)[_\s-]*(\d+)/g)) {
        groups.add(`band:${match[1]}`);
    }
    for (const match of raw.matchAll(/(?:freq|bw|gain|sec|q|reso|att|dec|sus|rel)(\d+)/g)) {
        groups.add(`band:${match[1]}`);
    }

    if (/\bhp\b|highpass|high pass|hpf/.test(raw)) groups.add('filter:hp');
    if (/\blp\b|lowpass|low pass|lpf/.test(raw)) groups.add('filter:lp');
    if (/\bls\b|lowshelf|low shelf/.test(raw)) groups.add('filter:ls');
    if (/\bhs\b|highshelf|high shelf/.test(raw)) groups.add('filter:hs');
    if (/low[-_\s]?shel/.test(raw)) groups.add('shelf:low');
    if (/high[-_\s]?shel/.test(raw)) groups.add('shelf:high');
    for (const match of raw.matchAll(/tap\s*(\d+)/g)) {
        groups.add(`tap:${match[1]}`);
    }

    const prefix = controlPrefix(port);
    if (prefix) groups.add(`prefix:${prefix}`);

    return groups;
}

function controlPrefix(port) {
    const raw = String(port.symbol ?? port.name ?? '').toLowerCase();
    const match = raw.match(/^([a-z]+\d*|[a-z]+)[_-]/);
    return match ? match[1] : '';
}

function controlText(port) {
    return `${port.symbol ?? ''} ${port.name ?? ''}`;
}

function onValue(port) {
    if (Number.isFinite(port.max) && Number.isFinite(port.min) && port.max !== port.min) return Number(port.max);
    const def = Number(port.default);
    return Number.isFinite(def) && def !== 1 ? 1 : 1;
}

function minValue(port) {
    if (!Number.isFinite(port.min)) return Number(port.default) || 0;
    return quantizeCandidate(port, Number(port.min));
}

function lowValue(port) {
    if (!Number.isFinite(port.min) || !Number.isFinite(port.max)) return Number(port.default) || 0;
    return quantizeCandidate(port, Number(port.min) + (Number(port.max) - Number(port.min)) * 0.10);
}

function shortTimeValue(port) {
    if (!Number.isFinite(port.min) || !Number.isFinite(port.max)) return Number(port.default) || 0;
    const min = Number(port.min);
    const max = Number(port.max);
    const text = controlText(port);
    const span = max - min;
    if (/ms|msec|millisecond/i.test(text) || max > 20) {
        return quantizeCandidate(port, Math.min(max, Math.max(min, 80)));
    }
    return quantizeCandidate(port, min + span * 0.02);
}

function midValue(port) {
    if (!Number.isFinite(port.min) || !Number.isFinite(port.max)) return Number(port.default) || 0;
    return quantizeCandidate(port, Number(port.min) + (Number(port.max) - Number(port.min)) * 0.50);
}

function highValue(port) {
    if (!Number.isFinite(port.min) || !Number.isFinite(port.max)) return Number(port.default) || 1;
    return quantizeCandidate(port, Number(port.min) + (Number(port.max) - Number(port.min)) * 0.90);
}

function neutralValue(port) {
    if (Number.isFinite(port.min) && Number.isFinite(port.max) && Number(port.min) <= 0 && Number(port.max) >= 0) {
        return quantizeCandidate(port, 0);
    }
    return midValue(port);
}

function audibleHighValue(port) {
    if (!Number.isFinite(port.min) || !Number.isFinite(port.max)) return Number(port.default) || 1;
    const min = Number(port.min);
    const max = Number(port.max);
    if (min < 0 && max > 0) return max;
    return highValue(port);
}

function modulationValue(port) {
    if (Number.isFinite(port.min) && Number.isFinite(port.max)) return audibleHighValue(port);
    const text = controlText(port);
    if (/exp/i.test(text)) return 0.5;
    if (/lin/i.test(text)) return 0.25;
    return 1;
}

function modulationRateValue(port) {
    if (!Number.isFinite(port.min) || !Number.isFinite(port.max)) return Number(port.default) || 1;
    const min = Number(port.min);
    const max = Number(port.max);
    const span = max - min;
    if (max > 20) return quantizeCandidate(port, Math.min(max, Math.max(min, 5)));
    if (max > 2) return quantizeCandidate(port, Math.min(max, Math.max(min, 2)));
    return quantizeCandidate(port, min + span * 0.50);
}

function isMuteLikeValue(port, value) {
    if (!Number.isFinite(value)) return false;
    const text = controlText(port);
    if (/dB/i.test(text) && value <= -40) return true;
    if (Number.isFinite(port.min) && value <= Number(port.min) + Math.max(1e-7, Math.abs(Number(port.min)) * 1e-7)) return true;
    return Math.abs(value) <= 1e-7;
}

function dynamicsThresholdValue(port, currentText) {
    if (!Number.isFinite(port.min) || !Number.isFinite(port.max)) return Number(port.default) || 0;
    const min = Number(port.min);
    const max = Number(port.max);
    const frac = /gate|close|open|hold|decay|dec\b|knee|rms|peak|slew/i.test(currentText) ? 0.67 : 0.25;
    return quantizeCandidate(port, min + (max - min) * frac);
}

function dynamicsModeValue(port) {
    if (!Number.isFinite(port.min) || !Number.isFinite(port.max)) return Number(port.default) || 1;
    const min = Number(port.min);
    const max = Number(port.max);
    if (max >= 14 && min <= 13) return quantizeCandidate(port, 13);
    return highValue(port);
}

function overrideKey(overrides) {
    return [...overrides.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join(';');
}

function quantizeCandidate(port, value) {
    if (port.toggled || port.integer || isEnumLike(port)) return Math.round(value);
    return value;
}

function isEnumLike(port) {
    const span = Number(port.max) - Number(port.min);
    return Number.isInteger(port.min)
        && Number.isInteger(port.max)
        && span > 0
        && span <= 8
        && /mode|type|shape|select|model|toggle|invert|sync|bypass|on\/off|switch|active/i.test(port.name);
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

    const parsed = Number.parseFloat(s);
    return Number.isFinite(parsed) ? parsed : null;
}

function scaleValueForPort(port, value) {
    return shouldScaleBySampleRate(port, value) ? value * SAMPLE_RATE : value;
}

function shouldScaleBySampleRate(port, value) {
    if (!port?.sampleRate || !Number.isFinite(value)) return false;
    const min = Number(port.min);
    const max = Number(port.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
    return value >= Math.min(min, max) && value <= Math.max(min, max);
}

function sendInitialMidiProbe(mod, profile = DEFAULT_PROFILE) {
    const notes = midiProbeNotes(profile);
    if (typeof mod._shim_midi_cc === 'function') {
        mod._shim_midi_cc(0, 1, 0);    // modwheel
        mod._shim_midi_cc(0, 7, 112);  // volume
        mod._shim_midi_cc(0, 74, 96);  // brightness/filter cutoff
        for (const [channel, controller, value] of profile.initialCc ?? []) {
            mod._shim_midi_cc(channel, controller, value);
        }
    }
    if (typeof mod._shim_midi_channel_pressure === 'function') mod._shim_midi_channel_pressure(0, 0);
    if (typeof mod._shim_midi_pitch_bend === 'function') mod._shim_midi_pitch_bend(0, 0);
    mod._shim_midi_note_on(0, notes[0], midiVelocity(profile, 110));
}

function sendMidiProbeBlock(mod, block, profile = DEFAULT_PROFILE) {
    const notes = midiProbeNotes(profile);
    const interval = profile.midiIntervalBlocks ?? 12;
    if (block > 0 && block < notes.length * interval && block % interval === 0) {
        const index = block / interval;
        mod._shim_midi_note_on(0, notes[index], midiVelocity(profile, Math.max(56, 118 - index * 3)));
    }

    if (typeof mod._shim_midi_cc === 'function') {
        if (block === 24) mod._shim_midi_cc(0, 1, 127);
        if (block === 48) mod._shim_midi_cc(0, 74, 24);
        if (block === 72) mod._shim_midi_cc(0, 1, 16);
    }

    if (typeof mod._shim_midi_poly_pressure === 'function') {
        if (block === 30) mod._shim_midi_poly_pressure(0, notes[0], 96);
        if (block === 78) mod._shim_midi_poly_pressure(0, notes[0], 12);
    }

    if (typeof mod._shim_midi_channel_pressure === 'function') {
        if (block === 30) mod._shim_midi_channel_pressure(0, 112);
        if (block === 78) mod._shim_midi_channel_pressure(0, 8);
    }

    if (typeof mod._shim_midi_pitch_bend === 'function') {
        if (block === 36) mod._shim_midi_pitch_bend(0, 4096);
        if (block === 60) mod._shim_midi_pitch_bend(0, -4096);
        if (block === 84) mod._shim_midi_pitch_bend(0, 0);
    }
}

function midiProbeNotes(profile = DEFAULT_PROFILE) {
    return profile.midiNotes ?? MIDI_PROBE_NOTES;
}

function midiVelocity(profile, fallback) {
    return Number.isFinite(profile.midiVelocity) ? profile.midiVelocity : fallback;
}

function fillAudioInputs(mod, inBufFns, blockIndex, profile = DEFAULT_PROFILE) {
    const baseSample = blockIndex * BLOCK_SIZE;
    for (let channel = 0; channel < inBufFns.length; channel++) {
        const ptr = mod[inBufFns[channel]]() >> 2;
        const fundamental = channel % 2 === 0 ? 110 : 146.83;
        const mid = channel % 2 === 0 ? 440 : 554.37;
        const high = channel % 2 === 0 ? 1760 : 2217.46;
        const air = channel % 2 === 0 ? 17200 : 15100;
        const top = channel % 2 === 0 ? 20801 : 19000;

        for (let i = 0; i < BLOCK_SIZE; i++) {
            const t = (baseSample + i) / SAMPLE_RATE;
            if (profile.audio === 'dynamics') {
                const period = Math.round(SAMPLE_RATE * 0.50);
                const phase = ((baseSample + i) % period) / period;
                const gate = channel % 2 === 0
                    ? (phase < 0.25 ? 1 : 0.0001)
                    : (phase >= 0.25 && phase < 0.50 ? 1 : 0.0001);
                const amp = channel % 2 === 0 ? 2.0 : 1.15;
                const edge = phase < 0.006 ? 0.45 * (1 - phase / 0.006) : 0;
                mod.HEAPF32[ptr + i] = amp * gate * (
                    0.72 * Math.sin(2 * Math.PI * fundamental * t)
                  + 0.28 * Math.sin(2 * Math.PI * mid * t)
                  + 0.08 * deterministicNoise(baseSample + i + channel * 8191)
                ) + edge;
                continue;
            }
            if (profile.audio === 'fast-dynamics') {
                const period = Math.round(SAMPLE_RATE * 0.08);
                const phase = ((baseSample + i) % period) / period;
                const gate = phase < 0.18 ? 1 : 0.0001;
                const amp = channel % 2 === 0 ? 2.25 : 1.35;
                const edge = phase < 0.018 ? 0.7 * (1 - phase / 0.018) : 0;
                mod.HEAPF32[ptr + i] = amp * gate * (
                    0.74 * Math.sin(2 * Math.PI * fundamental * t)
                  + 0.30 * Math.sin(2 * Math.PI * mid * t)
                  + 0.10 * deterministicNoise(baseSample + i + channel * 8191)
                ) + edge;
                continue;
            }
            if (profile.audio === 'beatbox-sequence') {
                const period = Math.round(SAMPLE_RATE * 0.18);
                const phase = ((baseSample + i) % period) / period;
                const hit = Math.floor((baseSample + i) / period) % 3;
                const freq = hit === 0 ? 110 : hit === 1 ? 660 : 2200;
                const env = phase < 0.28 ? Math.exp(-phase * 12) : 0.00005;
                const edge = phase < 0.012 ? 0.85 * (1 - phase / 0.012) : 0;
                mod.HEAPF32[ptr + i] = env * (
                    0.9 * Math.sin(2 * Math.PI * freq * t)
                  + 0.18 * Math.sin(2 * Math.PI * freq * 2 * t)
                  + 0.04 * Math.sin(2 * Math.PI * freq * 4 * t)
                  + 0.03 * deterministicNoise(baseSample + i + channel * 8191)
                ) + edge;
                continue;
            }
            if (profile.audio === 'beatbox-fast-rate') {
                const period = Math.round(SAMPLE_RATE * 0.055);
                const phase = ((baseSample + i) % period) / period;
                const freq = channel % 2 === 0 ? 5200 : 6100;
                const env = phase < 0.34 ? Math.exp(-phase * 13) : 0.00004;
                const edge = phase < 0.015 ? 0.9 * (1 - phase / 0.015) : 0;
                mod.HEAPF32[ptr + i] = env * (
                    0.8 * Math.sin(2 * Math.PI * freq * t)
                  + 0.1 * Math.sin(2 * Math.PI * freq * 1.7 * t)
                  + 0.07 * deterministicNoise(baseSample + i + channel * 8191)
                ) + edge;
                continue;
            }
            if (profile.audio === 'beatbox-threshold') {
                const period = Math.round(SAMPLE_RATE * 0.12);
                const phase = ((baseSample + i) % period) / period;
                const hit = Math.floor((baseSample + i) / period) % 6;
                const amp = [0.035, 0.07, 0.14, 0.28, 0.56, 1.1][hit];
                const freq = hit % 3 === 0
                    ? (channel % 2 === 0 ? 120 : 150)
                    : hit % 3 === 1
                        ? (channel % 2 === 0 ? 720 : 960)
                        : (channel % 2 === 0 ? 3900 : 5200);
                const env = phase < 0.24 ? Math.exp(-phase * 10) : 0.00003;
                const edge = phase < 0.012 ? amp * 0.42 * (1 - phase / 0.012) : 0;
                mod.HEAPF32[ptr + i] = amp * env * (
                    0.9 * Math.sin(2 * Math.PI * freq * t)
                  + 0.2 * Math.sin(2 * Math.PI * freq * 2 * t)
                  + 0.04 * deterministicNoise(baseSample + i + channel * 8191)
                ) + edge;
                continue;
            }

            const period = Math.round(SAMPLE_RATE * 0.18);
            const phase = ((baseSample + i) % period) / period;
            const gate = phase < 0.45 ? 1 : phase < 0.54 ? (0.54 - phase) / 0.09 : 0.001;
            const trem = 0.72 + 0.28 * Math.sin(2 * Math.PI * 3.7 * Math.max(0, t));
            const impulse = phase < 0.012 ? 0.60 * (1 - phase / 0.012) : 0;
            const noise = 0.035 * deterministicNoise(baseSample + i + channel * 8191);
            mod.HEAPF32[ptr + i] = gate * trem * (
                0.74 * Math.sin(2 * Math.PI * fundamental * t)
              + 0.38 * Math.sin(2 * Math.PI * mid * t)
              + 0.18 * Math.sin(2 * Math.PI * high * t)
              + 0.05 * Math.sin(2 * Math.PI * air * t)
              + 0.03 * Math.sin(2 * Math.PI * top * t)
              + noise
            ) + impulse;
        }
    }
}

function deterministicNoise(n) {
    let x = (n | 0) + 0x6D2B79F5;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return (((x ^ (x >>> 14)) >>> 0) / 2147483648) - 1;
}

function compareAudio(a, b) {
    if (a.length !== b.length) throw new Error(`audio length mismatch (${a.length} != ${b.length})`);
    let sumA = 0;
    let sumB = 0;
    let sumDiff = 0;
    let max = 0;

    for (let i = 0; i < a.length; i++) {
        const av = a[i];
        const bv = b[i];
        const diff = av - bv;
        sumA += av * av;
        sumB += bv * bv;
        sumDiff += diff * diff;
        const abs = Math.abs(diff);
        if (abs > max) max = abs;
    }

    const rmsA = Math.sqrt(sumA / a.length);
    const rmsB = Math.sqrt(sumB / b.length);
    const rms = Math.sqrt(sumDiff / a.length);
    const relative = rms / Math.max(rmsA, rmsB, SILENCE);
    return { rms, relative, max };
}

function audioChanged(diff, noise) {
    const rmsFloor = Math.max(ABS_RMS_DIFF, noise.rms * NOISE_MULTIPLIER);
    const relFloor = Math.max(REL_RMS_DIFF, noise.relative * NOISE_MULTIPLIER);
    return diff.rms > rmsFloor && diff.relative > relFloor && diff.max > SILENCE;
}

function findTestSF2() {
    if (!existsSync(SOUNDFONTS)) return null;
    const file = readdirSync(SOUNDFONTS).find(name => name.endsWith('.sf2'));
    return file ? join(SOUNDFONTS, file) : null;
}

function loadSF2IntoWasm(mod, sf2Path) {
    if (!sf2Path) return;
    const bytes = readFileSync(sf2Path);
    const ptr = mod._malloc(bytes.length);
    mod.HEAPU8.set(bytes, ptr);
    mod._shim_load_sf2(ptr, bytes.length);
    mod._free(ptr);
}

function fmtVal(value) {
    return typeof value === 'number' ? value.toPrecision(6) : String(value);
}

function fmtMetric(value) {
    if (!Number.isFinite(value)) return String(value);
    if (value === 0) return '0';
    if (Math.abs(value) < 0.001 || Math.abs(value) >= 1000) return value.toExponential(2);
    return value.toFixed(5);
}
