import createtripleParaPlugin from './triplePara.js';

let mod = null;
const inPtrs  = [0];
const outPtrs = [0];
const SETTERS = {"0":"_shim_set_low_shelving_gain_db","1":"_shim_set_low_shelving_frequency_hz","2":"_shim_set_low_shelving_slope","3":"_shim_set_band_1_gain_db","4":"_shim_set_band_1_frequency_hz","5":"_shim_set_band_1_bandwidth_octaves","6":"_shim_set_band_2_gain_db","7":"_shim_set_band_2_frequency_hz","8":"_shim_set_band_2_bandwidth_octaves","9":"_shim_set_band_3_gain_db","10":"_shim_set_band_3_frequency_hz","11":"_shim_set_band_3_bandwidth_octaves","12":"_shim_set_high_shelving_gain_db","13":"_shim_set_high_shelving_frequency_hz","14":"_shim_set_high_shelving_slope"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createtripleParaPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_input() >> 2;
                    outPtrs[0] = mod._shim_output_buf_output() >> 2;
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
        const _c0 = inputs[0]?.[0]; if (_c0 && _c0.length) mod.HEAPF32.set(_c0, inPtrs[0]);
        mod._shim_run(128);
        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));
        return true;
    }
}

registerProcessor('wadspa-triplePara', WadspProcessor);
