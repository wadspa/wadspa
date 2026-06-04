import createfil4monoPlugin from './fil4mono.js';

let mod = null;
const inPtrs  = [0, 0];
const outPtrs = [0, 0];
const SETTERS = {"enable":"_shim_set_enable","gain":"_shim_set_gain","peakreset":"_shim_set_peakreset","HighPass":"_shim_set_HighPass","HPfreq":"_shim_set_HPfreq","HPQ":"_shim_set_HPQ","LowPass":"_shim_set_LowPass","LPfreq":"_shim_set_LPfreq","LPQ":"_shim_set_LPQ","LSsec":"_shim_set_LSsec","LSfreq":"_shim_set_LSfreq","LSq":"_shim_set_LSq","LSgain":"_shim_set_LSgain","sec1":"_shim_set_sec1","freq1":"_shim_set_freq1","q1":"_shim_set_q1","gain1":"_shim_set_gain1","sec2":"_shim_set_sec2","freq2":"_shim_set_freq2","q2":"_shim_set_q2","gain2":"_shim_set_gain2","sec3":"_shim_set_sec3","freq3":"_shim_set_freq3","q3":"_shim_set_q3","gain3":"_shim_set_gain3","sec4":"_shim_set_sec4","freq4":"_shim_set_freq4","q4":"_shim_set_q4","gain4":"_shim_set_gain4","HSsec":"_shim_set_HSsec","HSfreq":"_shim_set_HSfreq","HSq":"_shim_set_HSq","HSgain":"_shim_set_HSgain"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createfil4monoPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_inL() >> 2;
                    inPtrs[1]  = mod._shim_input_buf_inR() >> 2;
                    outPtrs[0] = mod._shim_output_buf_out() >> 2;
                    outPtrs[1] = mod._shim_output_buf_outR() >> 2;
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

registerProcessor('wadspa-fil4mono', WadspProcessor);
