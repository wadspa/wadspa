import createWolf_ShaperPlugin from './Wolf_Shaper.js';

let mod = null;
const inPtrs  = [0, 0];
const outPtrs = [0, 0];
const SETTERS = {"pregain":"_shim_set_pregain","wet":"_shim_set_wet","postgain":"_shim_set_postgain","removedc":"_shim_set_removedc","oversample":"_shim_set_oversample","bipolarmode":"_shim_set_bipolarmode","warptype":"_shim_set_warptype","warpamount":"_shim_set_warpamount","vwarptype":"_shim_set_vwarptype","vwarpamount":"_shim_set_vwarpamount"};

function encodeCString(value) {
    const text = String(value);
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
        let code = text.charCodeAt(i);
        if (code < 0x80) {
            bytes.push(code);
        } else if (code < 0x800) {
            bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
        } else if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) {
            const lo = text.charCodeAt(i + 1);
            if (lo >= 0xDC00 && lo <= 0xDFFF) {
                code = 0x10000 + ((code - 0xD800) << 10) + (lo - 0xDC00);
                bytes.push(
                    0xF0 | (code >> 18),
                    0x80 | ((code >> 12) & 0x3F),
                    0x80 | ((code >> 6) & 0x3F),
                    0x80 | (code & 0x3F)
                );
                i++;
            } else {
                bytes.push(0xEF, 0xBF, 0xBD);
            }
        } else {
            bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
        }
    }
    bytes.push(0);
    return new Uint8Array(bytes);
}


class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createWolf_ShaperPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
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
            } else if (data.type === 'setState') {
                try {
                    if (!mod || typeof mod._shim_set_plugin_state !== 'function') {
                        throw new Error('plugin does not support state writes');
                    }
                    const kb = encodeCString(data.key), vb = encodeCString(data.value);
                    const kp = mod._malloc(kb.length), vp = mod._malloc(vb.length);
                    const heapU8 = mod.HEAPU8 ?? new Uint8Array(mod.HEAPF32.buffer);
                    heapU8.set(kb, kp); heapU8.set(vb, vp);
                    mod._shim_set_plugin_state(kp, vp);
                    mod._free(kp); mod._free(vp);
                    if (data.id !== undefined) this.port.postMessage({ type: 'stateSet', id: data.id, key: data.key });
                } catch (e) {
                    if (data.id !== undefined) this.port.postMessage({ type: 'stateError', id: data.id, key: data.key, message: e?.message ?? String(e) });
                }
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

registerProcessor('wadspa-Wolf_Shaper', WadspProcessor);
