import createZamGEQ31Plugin from './ZamGEQ31.js';

let mod = null;
const inPtrs  = [0];
const outPtrs = [0];
const SETTERS = {"master":"_shim_set_master","band1":"_shim_set_band1","band2":"_shim_set_band2","band3":"_shim_set_band3","band4":"_shim_set_band4","band5":"_shim_set_band5","band6":"_shim_set_band6","band7":"_shim_set_band7","band8":"_shim_set_band8","band9":"_shim_set_band9","band10":"_shim_set_band10","band11":"_shim_set_band11","band12":"_shim_set_band12","band13":"_shim_set_band13","band14":"_shim_set_band14","band15":"_shim_set_band15","band16":"_shim_set_band16","band17":"_shim_set_band17","band18":"_shim_set_band18","band19":"_shim_set_band19","band20":"_shim_set_band20","band21":"_shim_set_band21","band22":"_shim_set_band22","band23":"_shim_set_band23","band24":"_shim_set_band24","band25":"_shim_set_band25","band26":"_shim_set_band26","band27":"_shim_set_band27","band28":"_shim_set_band28","band29":"_shim_set_band29"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createZamGEQ31Plugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_lv2_audio_in_1() >> 2;
                    outPtrs[0] = mod._shim_output_buf_lv2_audio_out_1() >> 2;
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

registerProcessor('wadspa-ZamGEQ31', WadspProcessor);
