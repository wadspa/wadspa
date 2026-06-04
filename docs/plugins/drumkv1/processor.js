import createdrumkv1Plugin from './drumkv1.js';

let mod = null;
const inPtrs  = [0, 0];
const outPtrs = [0, 0];
const SETTERS = {"GEN1_SAMPLE":"_shim_set_GEN1_SAMPLE","DEF1_PITCHBEND":"_shim_set_DEF1_PITCHBEND","DEF1_MODWHEEL":"_shim_set_DEF1_MODWHEEL","DEF1_PRESSURE":"_shim_set_DEF1_PRESSURE","DEF1_VELOCITY":"_shim_set_DEF1_VELOCITY","DEF1_CHANNEL":"_shim_set_DEF1_CHANNEL","DEF1_NOTEOFF":"_shim_set_DEF1_NOTEOFF","CHO1_WET":"_shim_set_CHO1_WET","CHO1_DELAY":"_shim_set_CHO1_DELAY","CHO1_FEEDB":"_shim_set_CHO1_FEEDB","CHO1_RATE":"_shim_set_CHO1_RATE","CHO1_MOD":"_shim_set_CHO1_MOD","FLA1_WET":"_shim_set_FLA1_WET","FLA1_DELAY":"_shim_set_FLA1_DELAY","FLA1_FEEDB":"_shim_set_FLA1_FEEDB","FLA1_DAFT":"_shim_set_FLA1_DAFT","PHA1_WET":"_shim_set_PHA1_WET","PHA1_RATE":"_shim_set_PHA1_RATE","PHA1_FEEDB":"_shim_set_PHA1_FEEDB","PHA1_DEPTH":"_shim_set_PHA1_DEPTH","PHA1_DAFT":"_shim_set_PHA1_DAFT","DEL1_WET":"_shim_set_DEL1_WET","DEL1_DELAY":"_shim_set_DEL1_DELAY","DEL1_FEEDB":"_shim_set_DEL1_FEEDB","DEL1_BPM":"_shim_set_DEL1_BPM","REV1_WET":"_shim_set_REV1_WET","REV1_ROOM":"_shim_set_REV1_ROOM","REV1_DAMP":"_shim_set_REV1_DAMP","REV1_FEEDB":"_shim_set_REV1_FEEDB","REV1_WIDTH":"_shim_set_REV1_WIDTH","DYN1_COMPRESS":"_shim_set_DYN1_COMPRESS","DYN1_LIMITER":"_shim_set_DYN1_LIMITER"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createdrumkv1Plugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    inPtrs[0]  = mod._shim_input_buf_in_L() >> 2;
                    inPtrs[1]  = mod._shim_input_buf_in_R() >> 2;
                    outPtrs[0] = mod._shim_output_buf_Out_L() >> 2;
                    outPtrs[1] = mod._shim_output_buf_Out_R() >> 2;
                    this.port.postMessage({ type: 'ready' });
                } catch (e) {
                    this.port.postMessage({ type: 'error', message: e.message });
                }
            } else if (data.type === 'midi') {
                if (!mod) return;
                const { status, data1, data2 } = data;
                const type = status & 0xF0;
                const ch   = status & 0x0F;
                if      (type === 0x90 && data2 > 0) mod._shim_midi_note_on(ch, data1, data2);
                else if (type === 0x80 || (type === 0x90 && data2 === 0)) mod._shim_midi_note_off(ch, data1);
                else if (type === 0xA0 && mod._shim_midi_poly_pressure) mod._shim_midi_poly_pressure(ch, data1, data2);
                else if (type === 0xB0) mod._shim_midi_cc(ch, data1, data2);
                else if (type === 0xD0 && mod._shim_midi_channel_pressure) mod._shim_midi_channel_pressure(ch, data1);
                else if (type === 0xE0) mod._shim_midi_pitch_bend(ch, ((data2 << 7) | data1) - 8192);
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

registerProcessor('wadspa-drumkv1', WadspProcessor);
