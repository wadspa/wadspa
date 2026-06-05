#!/usr/bin/env node
/**
 * Build script for the ZynAddSubFX browser instrument.
 *
 * The source tree mixes C and C++ files, so this script compiles each source
 * file to an object with the correct Emscripten driver before linking the final
 * module. The wrapper hosts ZynAddSubFX's real Master/Part/ADnote engine and
 * uses compatibility stubs for native XML/bank/NIO facilities that are not
 * part of the browser audio path.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'plugins', 'zynaddsubfx');
const GEN = join(DIR, 'generated');
const DIST = join(DIR, 'dist');
const SRC = join(ROOT, 'zynaddsubfx');
const ZSRC = join(SRC, 'src');
const RTOSC = join(SRC, 'rtosc');
const BUILD = join('/private/tmp', 'wadspa-zynaddsubfx-build');

const controls = JSON.parse(readFileSync(join(DIR, 'controls.json'), 'utf8'));

for (const required of [
    join(DIR, 'zynaddsubfx_plugin.cpp'),
    join(GEN, 'zyn_compat.cpp'),
    join(GEN, 'zyn-version.h'),
    join(GEN, 'zyn-config.h'),
    join(GEN, 'mxml.h'),
    join(ZSRC, 'Misc', 'Master.cpp'),
    join(RTOSC, 'src', 'rtosc.c'),
]) {
    if (!existsSync(required)) {
        console.error(`Missing ${required} - run scripts/setup-zynaddsubfx.js and fetch the zynaddsubfx source first`);
        process.exit(1);
    }
}

rmSync(DIST, { recursive: true, force: true });
rmSync(BUILD, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
mkdirSync(BUILD, { recursive: true });

const emcc = findTool('EMCC', 'emcc');
const emxx = findTool('EMXX', 'em++');
const outJs = join(DIST, 'ZynAddSubFX.js');
const exportName = 'createZynAddSubFXPlugin';

const sourceFiles = [
    join(DIR, 'zynaddsubfx_plugin.cpp'),
    join(GEN, 'zyn_compat.cpp'),
    join(ZSRC, 'version.cpp'),
    join(ZSRC, 'globals.cpp'),
    join(SRC, 'tlsf', 'tlsf.c'),
    join(ZSRC, 'Containers', 'ScratchString.cpp'),
    join(ZSRC, 'Containers', 'NotePool.cpp'),
    join(ZSRC, 'Containers', 'MultiPseudoStack.cpp'),
    ...listed('DSP', ['AnalogFilter.cpp', 'CombFilter.cpp', 'FFTwrapper.cpp', 'Filter.cpp', 'FormantFilter.cpp', 'MoogFilter.cpp', 'Reverter.cpp', 'SVFilter.cpp', 'Unison.cpp', 'Value_Smoothing_Filter.cpp']),
    ...listed('Effects', ['Alienwah.cpp', 'Chorus.cpp', 'Distortion.cpp', 'CombFilterBank.cpp', 'DynamicFilter.cpp', 'Echo.cpp', 'Effect.cpp', 'EffectLFO.cpp', 'EffectMgr.cpp', 'EQ.cpp', 'Phaser.cpp', 'Reverb.cpp', 'Sympathetic.cpp', 'Reverse.cpp']),
    ...listed('Misc', ['Bank.cpp', 'BankDb.cpp', 'Config.cpp', 'Master.cpp', 'Microtonal.cpp', 'Part.cpp', 'Util.cpp', 'Recorder.cpp', 'WavFile.cpp', 'WaveShapeSmps.cpp', 'Allocator.cpp', 'CallbackRepeater.cpp', 'Schema.cpp', 'MemLocker.cpp']),
    ...listed('Params', ['ADnoteParameters.cpp', 'Controller.cpp', 'EnvelopeParams.cpp', 'FilterParams.cpp', 'LFOParams.cpp', 'PADnoteParameters.cpp', 'Presets.cpp', 'PresetsArray.cpp', 'PresetsStore.cpp', 'SUBnoteParameters.cpp']),
    ...listed('Synth', ['SynthNote.cpp', 'ADnote.cpp', 'Envelope.cpp', 'LFO.cpp', 'ModFilter.cpp', 'OscilGen.cpp', 'PADnote.cpp', 'Portamento.cpp', 'Resonance.cpp', 'SUBnote.cpp', 'WatchPoint.cpp']),
    join(RTOSC, 'src', 'rtosc.c'),
    join(RTOSC, 'src', 'dispatch.c'),
    join(RTOSC, 'src', 'rtosc-time.c'),
    join(ROOT, 'toolchain', 'kissfft', 'fftw3_kissfft.c'),
    join(ROOT, 'toolchain', 'kissfft', 'kiss_fft.c'),
    join(ROOT, 'toolchain', 'kissfft', 'kiss_fftr.c'),
    ...['arg-ext.c', 'arg-val.c', 'arg-val-cmp.c', 'arg-val-itr.c', 'arg-val-math.c', 'automations.cpp', 'default-value.cpp', 'midimapper.cpp', 'miditable.cpp', 'ports.cpp', 'ports-runtime.cpp', 'pretty-format.c', 'savefile.cpp', 'subtree-serialize.cpp', 'thread-link.cpp', 'undo-history.cpp', 'util.c'].map(file => join(RTOSC, 'src', 'cpp', file)),
];

for (const file of sourceFiles) {
    if (!existsSync(file)) {
        console.error(`Missing source: ${file}`);
        process.exit(1);
    }
}

const includeFlags = [
    GEN,
    ZSRC,
    join(RTOSC, 'include'),
    join(RTOSC, 'src'),
    join(ROOT, 'toolchain', 'kissfft'),
].map(path => `-I"${path}"`);

const defineFlags = [
    '-DHAVE_CPP_STD_COMPLEX=1',
    '-DHAVE_BG_SYNTH_THREAD=0',
    '-DNO_UI=1',
    '-DDISABLE_GUI=1',
    '-DNDEBUG=1',
];

const procEnv = { ...process.env };
delete procEnv.VIRTUAL_ENV;
delete procEnv.VIRTUAL_ENV_PROMPT;
if (procEnv.PATH) {
    procEnv.PATH = procEnv.PATH.split(':').filter(path => !path.includes('/.venv/')).join(':');
}

console.log('-> Compiling ZynAddSubFX audio core to objects...');
const objects = [];
for (const [index, file] of sourceFiles.entries()) {
    const object = join(BUILD, `${String(index).padStart(3, '0')}-${file.split('/').pop()}.o`);
    objects.push(object);
    const isC = file.endsWith('.c');
    const compiler = isC ? emcc : emxx;
    const cmd = [
        `"${compiler}"`,
        '-c',
        `"${file}"`,
        '-O2',
        isC ? '-std=gnu99' : '-std=gnu++20',
        '-ffunction-sections',
        '-fdata-sections',
        ...includeFlags,
        ...defineFlags,
        '-o',
        `"${object}"`,
    ].join(' ');
    try {
        execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: procEnv });
    } catch (error) {
        console.error(`compile failed for ${file}:\n${error.stderr || error.message}`);
        process.exit(1);
    }
}

const exportedFns = [
    '_shim_init',
    '_shim_run',
    '_shim_output_buf_out_l',
    '_shim_output_buf_out_r',
    '_shim_midi_clear',
    '_shim_midi_note_on',
    '_shim_midi_note_off',
    '_shim_midi_cc',
    '_shim_midi_pitch_bend',
    '_shim_midi_program_change',
    ...controls.flatMap(port => [`_shim_set_${port.symbol}`, `_shim_get_${port.symbol}`]),
];

const linkCmd = [
    `"${emxx}"`,
    ...objects.map(file => `"${file}"`),
    '-O2',
    '-Wl,--gc-sections',
    '-s WASM=1',
    '-s MODULARIZE=1',
    `-s EXPORT_NAME='${exportName}'`,
    '-s EXPORT_ES6=1',
    `-s ENVIRONMENT='node,worker'`,
    `-s EXPORTED_FUNCTIONS='${JSON.stringify(exportedFns)}'`,
    `-s EXPORTED_RUNTIME_METHODS='["HEAPF32"]'`,
    '-s ALLOW_MEMORY_GROWTH=1',
    '-s INITIAL_MEMORY=33554432',
    '-lm',
    `-o "${outJs}"`,
].join(' ');

console.log('-> Linking ZynAddSubFX WASM...');
try {
    execSync(linkCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: procEnv });
} catch (error) {
    console.error(`em++ link failed:\n${error.stderr || error.message}`);
    process.exit(1);
}

const wasmFile = readdirSync(DIST).find(file => file.endsWith('.wasm'));
const jsSize = Math.round(readFileSync(outJs).length / 1024);
const wasmSize = wasmFile ? Math.round(readFileSync(join(DIST, wasmFile)).length / 1024) : '?';
console.log(`  ZynAddSubFX.js   ${jsSize}KB`);
console.log(`  ZynAddSubFX.wasm ${wasmSize}KB`);

writeFileSync(join(DIST, 'processor.js'), processorSource(exportName));
writeFileSync(join(DIST, 'index.js'), indexSource(exportName));
writeFileSync(join(DIST, 'package.json'), JSON.stringify({
    name: '@wadspa/zynaddsubfx',
    version: '0.1.0',
    type: 'module',
    main: './index.js',
    exports: { '.': './index.js' },
}, null, 2));

console.log(`-> Package written to ${DIST}`);

function listed(dir, names) {
    return names.map(name => join(ZSRC, dir, name));
}

function findTool(envName, fallback) {
    const candidates = [
        process.env[envName],
        join(process.env.HOME ?? '', 'emsdk', 'upstream', 'emscripten', fallback),
        fallback,
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (candidate.includes('/') && existsSync(candidate)) return candidate;
        if (!candidate.includes('/')) {
            try {
                execSync(`which ${candidate}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
                return candidate;
            } catch {
                // keep looking
            }
        }
    }
    throw new Error(`${fallback} not found. Run: source ~/emsdk/emsdk_env.sh`);
}

function processorSource(factoryName) {
    const setters = Object.fromEntries(controls.map(port => [port.symbol, `_shim_set_${port.symbol}`]));
    return `import ${factoryName} from './ZynAddSubFX.js';

let mod = null;
const outPtrs = [0, 0];
const SETTERS = ${JSON.stringify(setters)};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await ${factoryName}({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    outPtrs[0] = mod._shim_output_buf_out_l() >> 2;
                    outPtrs[1] = mod._shim_output_buf_out_r() >> 2;
                    this.port.postMessage({ type: 'ready' });
                } catch (error) {
                    this.port.postMessage({ type: 'error', message: error.message });
                }
            } else if (data.type === 'midi') {
                if (!mod) return;
                const { status, data1, data2 } = data;
                const type = status & 0xF0;
                const ch = status & 0x0F;
                if (type === 0x90 && data2 > 0) mod._shim_midi_note_on(ch, data1, data2);
                else if (type === 0x80 || (type === 0x90 && data2 === 0)) mod._shim_midi_note_off(ch, data1);
                else if (type === 0xB0) mod._shim_midi_cc(ch, data1, data2);
                else if (type === 0xE0) mod._shim_midi_pitch_bend(ch, ((data2 << 7) | data1) - 8192);
                else if (type === 0xC0) mod._shim_midi_program_change(ch, data1);
            } else if (data.type === 'set') {
                if (mod) {
                    const fn = SETTERS[data.symbol];
                    if (fn && typeof mod[fn] === 'function') mod[fn](data.value);
                }
            }
        };
    }

    process(_inputs, outputs) {
        if (!mod) return true;
        mod._shim_run(128);
        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));
        outputs[1][0].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));
        return true;
    }
}

registerProcessor('wadspa-zynaddsubfx', WadspProcessor);
`;
}

function indexSource(factoryName) {
    const meta = {
        uri: 'https://zynaddsubfx.sourceforge.io/',
        label: 'zynaddsubfx',
        name: 'ZynAddSubFX',
        exportName: factoryName,
        ports: [
            { index: 0, symbol: 'midi_in', name: 'MIDI In', dir: 'input', type: 'midi' },
            { index: 1, symbol: 'out_l', name: 'Audio Out L', dir: 'output', type: 'audio' },
            { index: 2, symbol: 'out_r', name: 'Audio Out R', dir: 'output', type: 'audio' },
            ...controls.map((port, offset) => ({
                index: 3 + offset,
                symbol: port.symbol,
                name: port.name,
                dir: 'input',
                type: 'control',
                min: port.min,
                max: port.max,
                default: port.def,
                ...(port.unit ? { unit: port.unit } : {}),
                ...(port.integer ? { integer: true } : {}),
                ...(port.toggled ? { toggled: true } : {}),
                ...(port.scalePoints ? {
                    enumeration: true,
                    scalePoints: port.scalePoints.map(([label, value]) => ({ label, value })),
                } : {}),
            })),
        ],
    };

    return `export { default } from './ZynAddSubFX.js';
export const meta = ${JSON.stringify(meta, null, 2)};
export const wasmUrl = new URL('./ZynAddSubFX.wasm', import.meta.url).href;
export const processorUrl = new URL('./processor.js', import.meta.url).href;
`;
}
