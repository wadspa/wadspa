import createRepelente_de_ruidoPlugin from './Repelente_de_ruido.js';

let mod = null;
const inPtrs  = [0];
const outPtrs = [0];
const SETTERS = {"noise_learn":"_shim_set_noise_learn","aggressiveness":"_shim_set_aggressiveness","reset_noise_profile":"_shim_set_reset_noise_profile","adaptive_noise":"_shim_set_adaptive_noise","adaptive_method":"_shim_set_adaptive_method","reduction":"_shim_set_reduction","tonal_reduction":"_shim_set_tonal_reduction","suppression":"_shim_set_suppression","smoothing":"_shim_set_smoothing","masking_transparency":"_shim_set_masking_transparency","whitening":"_shim_set_whitening","Residual_listen":"_shim_set_Residual_listen","bypass":"_shim_set_bypass"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createRepelente_de_ruidoPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_input() >> 2;
                    outPtrs[0] = mod._shim_output_buf_output() >> 2;
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

registerProcessor('wadspa-Repelente_de_ruido', WadspProcessor);
