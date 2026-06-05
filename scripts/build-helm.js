#!/usr/bin/env node
/**
 * Build script for the Helm browser instrument.
 *
 * Compiles Helm's real mopo/HelmEngine DSP path into a compact WASM module
 * with wadspa-style MIDI and control exports.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'plugins', 'helm');
const DIST = join(DIR, 'dist');
const SRC = join(ROOT, 'helm');
const MOPO = join(SRC, 'mopo', 'src');
const SYNTH = join(SRC, 'src', 'synthesis');
const COMMON = join(SRC, 'src', 'common');

const controls = JSON.parse(readFileSync(join(DIR, 'controls.json'), 'utf8'));

if (!existsSync(join(DIR, 'helm_plugin.cpp'))) {
    console.error(`Missing ${join(DIR, 'helm_plugin.cpp')} - run setup-helm.js first`);
    process.exit(1);
}
if (!existsSync(join(SYNTH, 'helm_engine.cpp'))) {
    console.error(`Missing ${join(SYNTH, 'helm_engine.cpp')} - run fetch-sources.js --only helm first`);
    process.exit(1);
}

mkdirSync(DIST, { recursive: true });

const emxx = findTool('EMXX', 'em++');
const outJs = join(DIST, 'Helm.js');
const exportName = 'createHelmPlugin';

const sourceFiles = [
    join(DIR, 'helm_plugin.cpp'),
    join(COMMON, 'helm_common.cpp'),
    ...cppFiles(MOPO),
    ...cppFiles(SYNTH),
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
    MOPO,
    SYNTH,
    COMMON,
].map(path => `-I"${path}"`);

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
    '-DNDEBUG=1',
    '-DDEBUG=0',
    '-lm',
    `-o "${outJs}"`,
].join(' ');

const procEnv = { ...process.env };
delete procEnv.VIRTUAL_ENV;
delete procEnv.VIRTUAL_ENV_PROMPT;
if (procEnv.PATH) {
    procEnv.PATH = procEnv.PATH.split(':').filter(path => !path.includes('/.venv/')).join(':');
}

console.log('-> Compiling Helm/mopo DSP to WASM...');
try {
    execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: procEnv });
} catch (error) {
    console.error(`em++ failed:\n${error.stderr || error.message}`);
    process.exit(1);
}

const wasmFile = readdirSync(DIST).find(file => file.endsWith('.wasm'));
const jsSize = Math.round(readFileSync(outJs).length / 1024);
const wasmSize = wasmFile ? Math.round(readFileSync(join(DIST, wasmFile)).length / 1024) : '?';
console.log(`  Helm.js   ${jsSize}KB`);
console.log(`  Helm.wasm ${wasmSize}KB`);

writeFileSync(join(DIST, 'processor.js'), processorSource(exportName));
writeFileSync(join(DIST, 'index.js'), indexSource(exportName));
writeFileSync(join(DIST, 'package.json'), JSON.stringify({
    name: '@wadspa/helm',
    version: '0.1.0',
    type: 'module',
    main: './index.js',
    exports: { '.': './index.js' },
}, null, 2));

console.log(`-> Package written to ${DIST}`);

function cppFiles(dir) {
    return readdirSync(dir)
        .filter(file => file.endsWith('.cpp'))
        .sort()
        .map(file => join(dir, file));
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
    return `import ${factoryName} from './Helm.js';

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

registerProcessor('wadspa-helm', WadspProcessor);
`;
}

function indexSource(factoryName) {
    const meta = {
        uri: 'https://tytel.org/helm/',
        label: 'helm',
        name: 'Helm',
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
                ...(port.scalePoints ? {
                    enumeration: true,
                    scalePoints: port.scalePoints.map(([label, value]) => ({ label, value })),
                } : {}),
            })),
        ],
    };

    return `export { default } from './Helm.js';
export const meta = ${JSON.stringify(meta, null, 2)};
export const wasmUrl = new URL('./Helm.wasm', import.meta.url).href;
export const processorUrl = new URL('./processor.js', import.meta.url).href;
`;
}
