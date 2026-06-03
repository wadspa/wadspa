import createZamGateX2Plugin from './ZamGateX2.js';

let mod = null;
const inPtrs  = [0, 0, 0];
const outPtrs = [0, 0];
const SETTERS = {"att":"_shim_set_att","rel":"_shim_set_rel","thr":"_shim_set_thr","mak":"_shim_set_mak","sidechain":"_shim_set_sidechain","close":"_shim_set_close","mode":"_shim_set_mode"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createZamGateX2Plugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_lv2_audio_in_1() >> 2;
                    inPtrs[1]  = mod._shim_input_buf_lv2_audio_in_2() >> 2;
                    inPtrs[2]  = mod._shim_input_buf_lv2_sidechain_in() >> 2;
                    outPtrs[0] = mod._shim_output_buf_lv2_audio_out_1() >> 2;
                    outPtrs[1] = mod._shim_output_buf_lv2_audio_out_2() >> 2;
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
        const _c1 = inputs[0]?.[1]; if (_c1 && _c1.length) mod.HEAPF32.set(_c1, inPtrs[1]);
        mod._shim_run(128);
        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));
        outputs[1][0].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));
        return true;
    }
}

registerProcessor('wadspa-ZamGateX2', WadspProcessor);
