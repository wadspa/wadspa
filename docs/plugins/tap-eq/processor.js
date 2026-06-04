import createTAP_EqualizerPlugin from './TAP_Equalizer.js';

let mod = null;
const inPtrs  = [0];
const outPtrs = [0];
const SETTERS = {"Band1GainDb":"_shim_set_Band1GainDb","Band2GainDb":"_shim_set_Band2GainDb","Band3GainDb":"_shim_set_Band3GainDb","Band4GainDb":"_shim_set_Band4GainDb","Band5GainDb":"_shim_set_Band5GainDb","Band6GainDb":"_shim_set_Band6GainDb","Band7GainDb":"_shim_set_Band7GainDb","Band8GainDb":"_shim_set_Band8GainDb","Band1FreqHz":"_shim_set_Band1FreqHz","Band2FreqHz":"_shim_set_Band2FreqHz","Band3FreqHz":"_shim_set_Band3FreqHz","Band4FreqHz":"_shim_set_Band4FreqHz","Band5FreqHz":"_shim_set_Band5FreqHz","Band6FreqHz":"_shim_set_Band6FreqHz","Band7FreqHz":"_shim_set_Band7FreqHz","Band8FreqHz":"_shim_set_Band8FreqHz"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createTAP_EqualizerPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_Input() >> 2;
                    outPtrs[0] = mod._shim_output_buf_Output() >> 2;
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

registerProcessor('wadspa-TAP_Equalizer', WadspProcessor);
