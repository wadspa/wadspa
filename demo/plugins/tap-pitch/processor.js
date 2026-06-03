import createTAP_Pitch_ShifterPlugin from './TAP_Pitch_Shifter.js';

let mod = null;
const inPtrs  = [0];
const outPtrs = [0];
const SETTERS = {"Semitone":"_shim_set_Semitone","Rate":"_shim_set_Rate","Drylevel":"_shim_set_Drylevel","Wetlevel":"_shim_set_Wetlevel","Latency":"_shim_set_Latency"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createTAP_Pitch_ShifterPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_Input() >> 2;
                    outPtrs[0] = mod._shim_output_buf_Output() >> 2;
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
        const _c0 = inputs[0]?.[0]; if (_c0 && _c0.length) mod.HEAPF32.set(_c0, inPtrs[0]);
        mod._shim_run(128);
        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));
        return true;
    }
}

registerProcessor('wadspa-TAP_Pitch_Shifter', WadspProcessor);
