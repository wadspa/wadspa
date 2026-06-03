#!/usr/bin/env node
/**
 * Build script for the tsf (TinySoundFont) wadspa plugin.
 *
 * Compiles tsf_plugin.c directly with emcc (bypassing the wadspa build-lv2
 * toolchain, which requires an LV2 descriptor), then writes hand-crafted
 * processor.js, index.js, and package.json to dist/.
 *
 * Called by build-instruments.js when it encounters a lv2.json entry with
 * "buildScript": "scripts/build-tsf.js".
 *
 * Usage (standalone):
 *   node scripts/build-tsf.js
 */

import { execSync }                                from 'child_process';
import { existsSync, mkdirSync, writeFileSync,
         readFileSync, readdirSync }               from 'fs';
import { join, dirname }                           from 'path';
import { fileURLToPath }                           from 'url';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR     = join(ROOT, 'plugins', 'tsf');
const DIST    = join(DIR, 'dist');

// ── Locate emcc ──────────────────────────────────────────────────────────────

function findEmcc() {
    const candidates = [
        process.env.EMCC,
        `${process.env.HOME}/emsdk/upstream/emscripten/emcc`,
    ].filter(Boolean);
    for (const p of candidates) {
        if (existsSync(p)) return p;
    }
    try { execSync('which emcc', { encoding: 'utf8' }); return 'emcc'; }
    catch { throw new Error('emcc not found. Run: source ~/emsdk/emsdk_env.sh'); }
}

// ── Validate sources ─────────────────────────────────────────────────────────

const src    = join(DIR, 'tsf_plugin.c');
const header = join(DIR, 'tsf.h');

if (!existsSync(src)) {
    console.error(`✗ Missing: ${src}\n  Run: node scripts/setup-tsf.js first`);
    process.exit(1);
}
if (!existsSync(header)) {
    console.error(`✗ Missing: ${header}\n  Run: node scripts/setup-tsf.js first`);
    process.exit(1);
}

// ── Compile ──────────────────────────────────────────────────────────────────

mkdirSync(DIST, { recursive: true });

const emcc       = findEmcc();
const outJs      = join(DIST, 'tsf.js');
const exportName = 'createTSFPlugin';

const exportedFns = [
    '_shim_init',
    '_shim_run',
    '_shim_output_buf_out_l',
    '_shim_output_buf_out_r',
    '_shim_midi_note_on',
    '_shim_midi_note_off',
    '_shim_midi_cc',
    '_shim_midi_pitch_bend',
    '_shim_midi_program_change',
    '_shim_set_gain',
    '_shim_load_sf2',
    '_malloc',
    '_free',
];

const cmd = [
    `"${emcc}"`,
    `"${src}"`,
    '-O3',
    '-s WASM=1',
    '-s MODULARIZE=1',
    `-s EXPORT_NAME='${exportName}'`,
    '-s EXPORT_ES6=1',
    `-s ENVIRONMENT='node,worker'`,
    `-s EXPORTED_FUNCTIONS='${JSON.stringify(exportedFns)}'`,
    `-s EXPORTED_RUNTIME_METHODS='["HEAPF32","HEAPU8","FS"]'`,
    '-s ALLOW_MEMORY_GROWTH=1',   // SF2 files can be several MB
    `-I"${DIR}"`,
    '-lm',
    `-o "${outJs}"`,
].join(' ');

// Strip any Python venv that might shadow the system Python 3.10+ emcc needs.
const procEnv = { ...process.env };
delete procEnv.VIRTUAL_ENV;
delete procEnv.VIRTUAL_ENV_PROMPT;
if (procEnv.PATH) {
    procEnv.PATH = procEnv.PATH.split(':').filter(p => !p.includes('/.venv/')).join(':');
}

console.log('→ Compiling tsf_plugin.c to WASM…');
try {
    execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: procEnv });
} catch (e) {
    console.error(`✗ emcc failed:\n${e.stderr || e.message}`);
    process.exit(1);
}

const jsSize   = Math.round(readFileSync(outJs).length / 1024);
const wasmFile = readdirSync(DIST).find(f => f.endsWith('.wasm'));
const wasmSize = wasmFile ? Math.round(readFileSync(join(DIST, wasmFile)).length / 1024) : '?';
console.log(`  tsf.js   ${jsSize}KB`);
console.log(`  tsf.wasm ${wasmSize}KB`);

// ── processor.js ─────────────────────────────────────────────────────────────
// Hand-written: extends the standard MIDI handler with a loadSF2 message type.

const processor = `import ${exportName} from './tsf.js';

let mod = null;
const outPtrs = [0, 0];
const SETTERS = { "gain": "_shim_set_gain" };

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await ${exportName}({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    outPtrs[0] = mod._shim_output_buf_out_l() >> 2;
                    outPtrs[1] = mod._shim_output_buf_out_r() >> 2;
                    this.port.postMessage({ type: 'ready' });
                } catch (e) {
                    this.port.postMessage({ type: 'error', message: e.message });
                }
            } else if (data.type === 'loadSF2') {
                if (!mod) return;
                const bytes = new Uint8Array(data.buffer);
                if (bytes.length < 12) {
                    this.port.postMessage({ type: 'error', message: \`SF2 data too small (\${bytes.length} bytes) — may be a stale cache\` });
                    return;
                }
                const ptr = mod._malloc(bytes.length);
                mod.HEAPU8.set(bytes, ptr);
                mod._shim_load_sf2(ptr, bytes.length);
                mod._free(ptr);
                this.port.postMessage({ type: 'sf2loaded' });
            } else if (data.type === 'midi') {
                if (!mod) return;
                const { status, data1, data2 } = data;
                const type = status & 0xF0;
                const ch   = status & 0x0F;
                if      (type === 0x90 && data2 > 0) mod._shim_midi_note_on(ch, data1, data2);
                else if (type === 0x80 || (type === 0x90 && data2 === 0)) mod._shim_midi_note_off(ch, data1);
                else if (type === 0xB0) mod._shim_midi_cc(ch, data1, data2);
                else if (type === 0xE0) mod._shim_midi_pitch_bend(ch, ((data2 << 7) | data1) - 8192);
                else if (type === 0xC0) mod._shim_midi_program_change(ch, data1);
            } else if (data.type === 'set') {
                if (mod) { const fn = SETTERS[data.symbol]; if (fn) mod[fn](data.value); }
            }
        };
    }

    process(inputs, outputs) {
        if (!mod) return true;
        mod._shim_run(128);
        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));
        outputs[1][0].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));
        return true;
    }
}

registerProcessor('wadspa-tsf', WadspProcessor);
`;

writeFileSync(join(DIST, 'processor.js'), processor);

// ── index.js ──────────────────────────────────────────────────────────────────

const meta = {
    uri:        'https://wadspa.org/plugins/tsf',
    label:      'tsf',
    name:       'TinySoundFont',
    exportName,
    sf2:        true,   // signals that loadSF2() must be called before notes play
    ports: [
        { index: 0, symbol: 'midi_in', name: 'MIDI In',     dir: 'input',  type: 'midi' },
        { index: 1, symbol: 'out_l',   name: 'Audio Out L', dir: 'output', type: 'audio' },
        { index: 2, symbol: 'out_r',   name: 'Audio Out R', dir: 'output', type: 'audio' },
        { index: 3, symbol: 'gain',    name: 'Gain',        dir: 'input',  type: 'control',
          min: 0, max: 2, default: 0.5 },
    ],
};

const indexJs = `\
export { default } from './tsf.js';
export const meta         = ${JSON.stringify(meta, null, 2)};
export const wasmUrl      = new URL('./tsf.wasm',    import.meta.url).href;
export const processorUrl = new URL('./processor.js', import.meta.url).href;
`;
writeFileSync(join(DIST, 'index.js'), indexJs);

// ── package.json ──────────────────────────────────────────────────────────────

writeFileSync(join(DIST, 'package.json'), JSON.stringify({
    name:    '@wadspa/tsf',
    version: '0.1.0',
    type:    'module',
    main:    './index.js',
    exports: { '.': './index.js' },
}, null, 2));

console.log(`→ Package written to ${DIST}`);
