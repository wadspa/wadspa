import createvynilPlugin from './vynil.js';

let mod = null;
const inPtrs  = [0, 0];
const outPtrs = [0, 0];
const SETTERS = {"0":"_shim_set_year","1":"_shim_set_rpm","2":"_shim_set_surface_warping","3":"_shim_set_crackle","4":"_shim_set_wear"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createvynilPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_input_l() >> 2;
                    inPtrs[1]  = mod._shim_input_buf_input_r() >> 2;
                    outPtrs[0] = mod._shim_output_buf_output_l() >> 2;
                    outPtrs[1] = mod._shim_output_buf_output_r() >> 2;
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
        const _cL = inputs[0]?.[0]; if (_cL && _cL.length) mod.HEAPF32.set(_cL, inPtrs[0]);
        const _cR = inputs[0]?.[1]; if (_cR && _cR.length) mod.HEAPF32.set(_cR, inPtrs[1]);
        mod._shim_run(128);
        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));
        outputs[1][0].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));
        return true;
    }
}

registerProcessor('wadspa-vynil', WadspProcessor);
