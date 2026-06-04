import create4Band_Parametric_FilterPlugin from './4Band_Parametric_Filter.js';

let mod = null;
const inPtrs  = [0];
const outPtrs = [0];
const SETTERS = {"filter":"_shim_set_filter","gain":"_shim_set_gain","sec_1":"_shim_set_sec_1","freq_1":"_shim_set_freq_1","bw_1":"_shim_set_bw_1","gain_1":"_shim_set_gain_1","sec_2":"_shim_set_sec_2","freq_2":"_shim_set_freq_2","bw_2":"_shim_set_bw_2","gain_2":"_shim_set_gain_2","sec_3":"_shim_set_sec_3","freq_3":"_shim_set_freq_3","bw_3":"_shim_set_bw_3","gain_3":"_shim_set_gain_3","sec_4":"_shim_set_sec_4","freq_4":"_shim_set_freq_4","bw_4":"_shim_set_bw_4","gain_4":"_shim_set_gain_4"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await create4Band_Parametric_FilterPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_in() >> 2;
                    outPtrs[0] = mod._shim_output_buf_out() >> 2;
                    this.port.postMessage({ type: 'ready' });
                } catch (e) {
                    this.port.postMessage({ type: 'error', message: e.message });
                }
            } else if (data.type === 'loadSample') {
                if (!mod) return;
                const pcm = new Float32Array(data.buffer);
                const ptr = mod._malloc(pcm.byteLength);
                mod.HEAPF32.set(pcm, ptr >> 2);
                if (typeof mod._shim_sample_set_pcm === 'function')
                    mod._shim_sample_set_pcm(ptr, pcm.length, data.srate);
                if (typeof mod._shim_load_sample === 'function')
                    mod._shim_load_sample();
                mod._free(ptr);
                this.port.postMessage({ type: 'sampleloaded' });
            } else if (data.type === 'loadPad') {
                if (!mod || typeof mod._shim_load_pad !== 'function') return;
                const pcm = new Float32Array(data.buffer);
                const ptr = mod._malloc(pcm.byteLength);
                mod.HEAPF32.set(pcm, ptr >> 2);
                mod._shim_load_pad(data.note, ptr, pcm.length, data.srate);
                mod._free(ptr);
                this.port.postMessage({ type: 'padloaded', note: data.note });
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

registerProcessor('wadspa-4Band_Parametric_Filter', WadspProcessor);
