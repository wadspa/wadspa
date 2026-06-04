import createreverbPlugin from './reverb.js';

let mod = null;
const inPtrs  = [0, 0];
const outPtrs = [0, 0];
const SETTERS = {"delay":"_shim_set_delay","xover":"_shim_set_xover","rt_low":"_shim_set_rt_low","rt_mid":"_shim_set_rt_mid","damping":"_shim_set_damping","f1_freq":"_shim_set_f1_freq","f1_gain":"_shim_set_f1_gain","f2_freq":"_shim_set_f2_freq","f2_gain":"_shim_set_f2_gain","out_mix":"_shim_set_out_mix"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createreverbPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_in_l() >> 2;
                    inPtrs[1]  = mod._shim_input_buf_in_r() >> 2;
                    outPtrs[0] = mod._shim_output_buf_out_l() >> 2;
                    outPtrs[1] = mod._shim_output_buf_out_r() >> 2;
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
        const _cL = inputs[0]?.[0]; if (_cL && _cL.length) mod.HEAPF32.set(_cL, inPtrs[0]);
        const _cR = inputs[0]?.[1]; if (_cR && _cR.length) mod.HEAPF32.set(_cR, inPtrs[1]);
        mod._shim_run(128);
        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));
        outputs[1][0].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));
        return true;
    }
}

registerProcessor('wadspa-reverb', WadspProcessor);
