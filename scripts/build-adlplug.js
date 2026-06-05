#!/usr/bin/env node
/**
 * Build script for the ADLplug OPL3 instrument.
 *
 * Compiles a small real-time MIDI wrapper with libADLMIDI directly. This avoids
 * the upstream JUCE plugin shell while preserving ADLplug's OPL3 chip, bank,
 * emulator, and global configuration sound path for Web Audio.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'plugins', 'adlplug');
const DIST = join(DIR, 'dist');
const SRC = join(ROOT, 'adlplug');
const LIB = join(SRC, 'thirdparty', 'libADLMIDI');
const LIB_SRC = join(LIB, 'src');

const controls = JSON.parse(readFileSync(join(DIR, 'controls.json'), 'utf8'));

if (!existsSync(join(DIR, 'adlplug_plugin.cpp'))) {
    console.error(`Missing ${join(DIR, 'adlplug_plugin.cpp')} - run setup-adlplug.js first`);
    process.exit(1);
}
if (!existsSync(join(LIB, 'include', 'adlmidi.h'))) {
    console.error(`Missing ${join(LIB, 'include', 'adlmidi.h')} - run setup-adlplug.js first`);
    process.exit(1);
}

mkdirSync(DIST, { recursive: true });

const emxx = findTool('EMXX', 'em++');
const outJs = join(DIST, 'ADLplug.js');
const exportName = 'createADLplugPlugin';

const sourceFiles = [
    join(DIR, 'adlplug_plugin.cpp'),
    join(LIB_SRC, 'adlmidi.cpp'),
    join(LIB_SRC, 'adlmidi_load.cpp'),
    join(LIB_SRC, 'adlmidi_midiplay.cpp'),
    join(LIB_SRC, 'adlmidi_opl3.cpp'),
    join(LIB_SRC, 'adlmidi_private.cpp'),
    join(LIB_SRC, 'wopl', 'wopl_file.c'),
    join(LIB_SRC, 'chips', 'dosbox_opl3.cpp'),
    join(LIB_SRC, 'chips', 'dosbox', 'dbopl.cpp'),
    join(LIB_SRC, 'chips', 'nuked_opl3.cpp'),
    join(LIB_SRC, 'chips', 'nuked', 'nukedopl3.c'),
    join(LIB_SRC, 'chips', 'nuked_opl3_v174.cpp'),
    join(LIB_SRC, 'chips', 'nuked', 'nukedopl3_174.c'),
    join(LIB_SRC, 'chips', 'opal_opl3.cpp'),
    join(LIB_SRC, 'chips', 'java_opl3.cpp'),
    join(LIB_SRC, 'adldata.cpp'),
];

for (const file of sourceFiles) {
    if (!existsSync(file)) {
        console.error(`Missing source: ${file}`);
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

const includeFlags = [
    DIR,
    join(LIB, 'include'),
    LIB_SRC,
    join(LIB_SRC, 'chips'),
    join(LIB_SRC, 'chips', 'dosbox'),
    join(LIB_SRC, 'chips', 'nuked'),
    join(LIB_SRC, 'chips', 'opal'),
].map(path => `-I"${path}"`);

const defines = [
    'ADLMIDI_BUILD',
    'ADLMIDI_DISABLE_CPP_EXTRAS',
    'ADLMIDI_DISABLE_MIDI_SEQUENCER',
    'BWMIDI_DISABLE_MUS_SUPPORT',
    'BWMIDI_DISABLE_XMI_SUPPORT',
];

const cmd = [
    `"${emxx}"`,
    ...sourceFiles.map(file => `"${file}"`),
    '-O3',
    '-std=gnu++17',
    '-s WASM=1',
    '-s MODULARIZE=1',
    `-s EXPORT_NAME='${exportName}'`,
    '-s EXPORT_ES6=1',
    `-s ENVIRONMENT='node,worker'`,
    `-s EXPORTED_FUNCTIONS='${JSON.stringify(exportedFns)}'`,
    `-s EXPORTED_RUNTIME_METHODS='["HEAPF32"]'`,
    '-s ALLOW_MEMORY_GROWTH=1',
    ...includeFlags,
    ...defines.map(name => `-D${name}`),
    '-lm',
    `-o "${outJs}"`,
].join(' ');

const procEnv = { ...process.env };
delete procEnv.VIRTUAL_ENV;
delete procEnv.VIRTUAL_ENV_PROMPT;
if (procEnv.PATH) {
    procEnv.PATH = procEnv.PATH.split(':').filter(path => !path.includes('/.venv/')).join(':');
}

console.log('-> Compiling ADLplug/libADLMIDI to WASM...');
try {
    execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: procEnv });
} catch (error) {
    console.error(`em++ failed:\n${error.stderr || error.message}`);
    process.exit(1);
}

const wasmFile = readdirSync(DIST).find(file => file.endsWith('.wasm'));
const jsSize = Math.round(readFileSync(outJs).length / 1024);
const wasmSize = wasmFile ? Math.round(readFileSync(join(DIST, wasmFile)).length / 1024) : '?';
console.log(`  ADLplug.js   ${jsSize}KB`);
console.log(`  ADLplug.wasm ${wasmSize}KB`);

writeFileSync(join(DIST, 'processor.js'), processorSource(exportName));
writeFileSync(join(DIST, 'index.js'), indexSource(exportName));
writeFileSync(join(DIST, 'package.json'), JSON.stringify({
    name: '@wadspa/adlplug',
    version: '0.1.0',
    type: 'module',
    main: './index.js',
    exports: { '.': './index.js' },
}, null, 2));

console.log(`-> Package written to ${DIST}`);

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
    return `import ${factoryName} from './ADLplug.js';

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

registerProcessor('wadspa-adlplug', WadspProcessor);
`;
}

function indexSource(factoryName) {
    const meta = {
        uri: 'https://github.com/jpcima/ADLplug',
        label: 'adlplug',
        name: 'ADLplug',
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
                ...(port.integer ? { integer: true } : {}),
                ...(port.toggled ? { toggled: true } : {}),
                ...(port.logarithmic ? { logarithmic: true } : {}),
                ...(port.scalePoints ? { enumeration: true, scalePoints: port.scalePoints.map(([label, value]) => ({ label, value })) } : {}),
            })),
        ],
    };

    return `export { default } from './ADLplug.js';
export const meta = ${JSON.stringify(meta, null, 2)};
export const wasmUrl = new URL('./ADLplug.wasm', import.meta.url).href;
export const processorUrl = new URL('./processor.js', import.meta.url).href;
`;
}
