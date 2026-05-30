// Generates shim.c from a port descriptor JSON produced by inspect.js

function floatLit(n) {
    const s = String(Number(n));
    return s.includes('.') || s.includes('e') ? s : s + '.0';
}

function defaultValue(port) {
    switch (port.default) {
        case 'min':    return port.min ?? 0;
        case 'max':    return port.max ?? 1;
        case 'low':    return port.min != null ? port.min + (port.max - port.min) * 0.25 : 0.25;
        case 'high':   return port.min != null ? port.min + (port.max - port.min) * 0.75 : 0.75;
        case 'middle': return port.min != null ? (port.min + port.max) / 2 : 0.5;
        case '0':      return 0;
        case '1':      return 1;
        case '100':    return 100;
        case '440':    return 440;
        default:       return port.min ?? 0;
    }
}

function symbolName(portName) {
    return portName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export function generateShim(descriptor) {
    const ports = descriptor.ports;

    const audioIn   = ports.filter(p => p.type === 'audio'   && p.dir === 'input');
    const audioOut  = ports.filter(p => p.type === 'audio'   && p.dir === 'output');
    const ctrlIn    = ports.filter(p => p.type === 'control' && p.dir === 'input');
    const ctrlOut   = ports.filter(p => p.type === 'control' && p.dir === 'output');

    const lines = [];
    lines.push('#include <stdlib.h>');
    lines.push('#include "ladspa.h"');
    lines.push('#include <emscripten.h>');
    lines.push('');
    lines.push('#define BLOCK_SIZE 128');
    lines.push('');
    lines.push('static const LADSPA_Descriptor *g_desc = NULL;');
    lines.push('static LADSPA_Handle g_handle = NULL;');
    lines.push('');

    // Audio buffers
    for (const p of audioIn)  lines.push(`static float g_in_${symbolName(p.name)}[BLOCK_SIZE];`);
    for (const p of audioOut) lines.push(`static float g_out_${symbolName(p.name)}[BLOCK_SIZE];`);

    // Control scalars
    for (const p of ctrlIn)  lines.push(`static float g_ctrl_${symbolName(p.name)} = ${floatLit(defaultValue(p))}f;`);
    for (const p of ctrlOut) lines.push(`static float g_ctrl_${symbolName(p.name)} = 0.0f;`);

    lines.push('');
    lines.push('EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {');
    lines.push('    g_desc   = ladspa_descriptor(0);');
    lines.push('    g_handle = g_desc->instantiate(g_desc, sample_rate);');

    for (const p of ports) {
        const sym = symbolName(p.name);
        if (p.type === 'audio' && p.dir === 'input')   lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_in_${sym});`);
        if (p.type === 'audio' && p.dir === 'output')  lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_out_${sym});`);
        if (p.type === 'control')                       lines.push(`    g_desc->connect_port(g_handle, ${p.index}, &g_ctrl_${sym});`);
    }

    lines.push('    if (g_desc->activate) g_desc->activate(g_handle);');
    lines.push('}');
    lines.push('');

    // Audio buffer accessors (first in/out only for now; toolchain can expose all)
    for (const p of audioIn)  lines.push(`EMSCRIPTEN_KEEPALIVE float *shim_input_buf_${symbolName(p.name)}()  { return g_in_${symbolName(p.name)}; }`);
    for (const p of audioOut) lines.push(`EMSCRIPTEN_KEEPALIVE float *shim_output_buf_${symbolName(p.name)}() { return g_out_${symbolName(p.name)}; }`);

    lines.push('');

    // Control setters/getters (input controls only — output controls like latency are read-only)
    for (const p of ctrlIn) {
        const sym = symbolName(p.name);
        lines.push(`EMSCRIPTEN_KEEPALIVE void  shim_set_${sym}(float v) { g_ctrl_${sym} = v; }`);
        lines.push(`EMSCRIPTEN_KEEPALIVE float shim_get_${sym}()         { return g_ctrl_${sym}; }`);
    }

    lines.push('');
    lines.push('EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {');
    lines.push('    g_desc->run(g_handle, count);');
    lines.push('}');
    lines.push('');

    return lines.join('\n');
}

// Also emit the exported function names for emcc's EXPORTED_FUNCTIONS flag
export function exportedFunctions(descriptor) {
    const ports = descriptor.ports;
    const fns   = ['_shim_init', '_shim_run'];

    for (const p of ports.filter(p => p.type === 'audio' && p.dir === 'input'))
        fns.push(`_shim_input_buf_${symbolName(p.name)}`);
    for (const p of ports.filter(p => p.type === 'audio' && p.dir === 'output'))
        fns.push(`_shim_output_buf_${symbolName(p.name)}`);
    for (const p of ports.filter(p => p.type === 'control' && p.dir === 'input')) {
        const sym = symbolName(p.name);
        fns.push(`_shim_set_${sym}`, `_shim_get_${sym}`);
    }

    return fns;
}

// Generates a per-plugin processor.js with static imports — works in both Chrome and Safari
export function generateProcessor(descriptor, label) {
    const ports   = descriptor.ports;
    const audioIn = ports.filter(p => p.type === 'audio'   && p.dir === 'input');
    const audioOut= ports.filter(p => p.type === 'audio'   && p.dir === 'output');
    const ctrlIn  = ports.filter(p => p.type === 'control' && p.dir === 'input');

    const exportName = 'create' + label.replace(/[^a-zA-Z0-9]/g, '_') + 'Plugin';

    const inBufs  = audioIn.map(p  => `_shim_input_buf_${symbolName(p.name)}`);
    const outBufs = audioOut.map(p => `_shim_output_buf_${symbolName(p.name)}`);
    const setterMap = Object.fromEntries(ctrlIn.map(p => [p.index, `_shim_set_${symbolName(p.name)}`]));

    const isStereo = audioIn.length === 2 && audioOut.length === 2;

    let inputCopies, outputCopies;
    if (isStereo) {
        inputCopies = [
            `        const _cL = inputs[0]?.[0]; if (_cL && _cL.length) mod.HEAPF32.set(_cL, inPtrs[0]);`,
            `        const _cR = inputs[0]?.[1]; if (_cR && _cR.length) mod.HEAPF32.set(_cR, inPtrs[1]);`,
        ].join('\n');
        outputCopies = [
            `        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));`,
            `        outputs[0][1].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));`,
        ].join('\n');
    } else {
        inputCopies = audioIn.map((_, i) =>
            `        const _c${i} = inputs[${i}]?.[0]; if (_c${i} && _c${i}.length) mod.HEAPF32.set(_c${i}, inPtrs[${i}]);`
        ).join('\n');
        outputCopies = audioOut.map((_, i) =>
            `        outputs[${i}][0].set(mod.HEAPF32.subarray(outPtrs[${i}], outPtrs[${i}] + 128));`
        ).join('\n');
    }

    return `import ${exportName} from './${label}.js';

let mod = null;
const inPtrs  = [${inBufs.map(() => '0').join(', ')}];
const outPtrs = [${outBufs.map(() => '0').join(', ')}];
const SETTERS = ${JSON.stringify(setterMap)};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await ${exportName}({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    ${inBufs.map((fn, i)  => `inPtrs[${i}]  = mod.${fn}() >> 2;`).join('\n                    ')}
                    ${outBufs.map((fn, i) => `outPtrs[${i}] = mod.${fn}() >> 2;`).join('\n                    ')}
                    this.port.postMessage({ type: 'ready' });
                } catch (e) {
                    this.port.postMessage({ type: 'error', message: e.message });
                }
            } else if (data.type === 'set') {
                if (mod) { const fn = SETTERS[data.index]; if (fn) mod[fn](data.value); }
            }
        };
    }

    process(inputs, outputs) {
        if (!mod) return true;
${inputCopies}
        mod._shim_run(128);
${outputCopies}
        return true;
    }
}

registerProcessor('wadspa-${label}', WadspProcessor);
`;
}
