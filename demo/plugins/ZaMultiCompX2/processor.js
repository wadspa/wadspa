import createZaMultiCompX2Plugin from './ZaMultiCompX2.js';

let mod = null;
const inPtrs  = [0, 0];
const outPtrs = [0, 0];
const SETTERS = {"att1":"_shim_set_att1","att2":"_shim_set_att2","att3":"_shim_set_att3","rel1":"_shim_set_rel1","rel2":"_shim_set_rel2","rel3":"_shim_set_rel3","kn1":"_shim_set_kn1","kn2":"_shim_set_kn2","kn3":"_shim_set_kn3","rat1":"_shim_set_rat1","rat2":"_shim_set_rat2","rat3":"_shim_set_rat3","thr1":"_shim_set_thr1","thr2":"_shim_set_thr2","thr3":"_shim_set_thr3","mak1":"_shim_set_mak1","mak2":"_shim_set_mak2","mak3":"_shim_set_mak3","xover1":"_shim_set_xover1","xover2":"_shim_set_xover2","toggle1":"_shim_set_toggle1","toggle2":"_shim_set_toggle2","toggle3":"_shim_set_toggle3","listen1":"_shim_set_listen1","listen2":"_shim_set_listen2","listen3":"_shim_set_listen3","stereodet":"_shim_set_stereodet","globalgain":"_shim_set_globalgain"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createZaMultiCompX2Plugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_lv2_audio_in_1() >> 2;
                    inPtrs[1]  = mod._shim_input_buf_lv2_audio_in_2() >> 2;
                    outPtrs[0] = mod._shim_output_buf_lv2_audio_out_1() >> 2;
                    outPtrs[1] = mod._shim_output_buf_lv2_audio_out_2() >> 2;
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

registerProcessor('wadspa-ZaMultiCompX2', WadspProcessor);
