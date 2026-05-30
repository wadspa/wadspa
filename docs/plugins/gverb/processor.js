import creategverbPlugin from './gverb.js';

let mod = null;
const inPtrs  = [0];
const outPtrs = [0, 0];
const SETTERS = {"0":"_shim_set_roomsize_m","1":"_shim_set_reverb_time_s","2":"_shim_set_damping","3":"_shim_set_input_bandwidth","4":"_shim_set_dry_signal_level_db","5":"_shim_set_early_reflection_level_db","6":"_shim_set_tail_level_db"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await creategverbPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_input() >> 2;
                    outPtrs[0] = mod._shim_output_buf_left_output() >> 2;
                    outPtrs[1] = mod._shim_output_buf_right_output() >> 2;
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
        outputs[1][0].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));
        return true;
    }
}

registerProcessor('wadspa-gverb', WadspProcessor);
