import createMDA_AmbiencePlugin from './MDA_Ambience.js';

let mod = null;
const inPtrs  = [0, 0];
const outPtrs = [0, 0];
const SETTERS = {"size":"_shim_set_size","hf_damp":"_shim_set_hf_damp","mix":"_shim_set_mix","output":"_shim_set_output"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createMDA_AmbiencePlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_left_in() >> 2;
                    inPtrs[1]  = mod._shim_input_buf_right_in() >> 2;
                    outPtrs[0] = mod._shim_output_buf_left_out() >> 2;
                    outPtrs[1] = mod._shim_output_buf_right_out() >> 2;
                    this.port.postMessage({ type: 'ready' });
                } catch (e) {
                    this.port.postMessage({ type: 'error', message: e.message });
                }
            } else if (data.type === 'set') {
                if (mod) { const fn = SETTERS[data.symbol]; if (fn) mod[fn](data.value); }
            }
        };
    }

    process(inputs, outputs) {
        if (!mod) return true;
        const _cL = inputs[0]?.[0]; if (_cL && _cL.length) mod.HEAPF32.set(_cL, inPtrs[0]);
        const _cR = inputs[0]?.[1]; if (_cR && _cR.length) mod.HEAPF32.set(_cR, inPtrs[1]);
        mod._shim_run(128);
        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));
        outputs[1][0].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));
        return true;
    }
}

registerProcessor('wadspa-MDA_Ambience', WadspProcessor);
