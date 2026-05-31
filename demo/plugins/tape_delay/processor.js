import createtapeDelayPlugin from './tapeDelay.js';

let mod = null;
const inPtrs  = [0];
const outPtrs = [0];
const SETTERS = {"0":"_shim_set_tape_speed_inches_sec_1_normal","1":"_shim_set_dry_level_db","2":"_shim_set_tap_1_distance_inches","3":"_shim_set_tap_1_level_db","4":"_shim_set_tap_2_distance_inches","5":"_shim_set_tap_2_level_db","6":"_shim_set_tap_3_distance_inches","7":"_shim_set_tap_3_level_db","8":"_shim_set_tap_4_distance_inches","9":"_shim_set_tap_4_level_db"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createtapeDelayPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
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

registerProcessor('wadspa-tapeDelay', WadspProcessor);
