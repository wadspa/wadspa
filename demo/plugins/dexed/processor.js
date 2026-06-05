import createDexedPlugin from './Dexed.js';

let mod = null;
const inPtrs  = [];
const outPtrs = [0, 0];
const SETTERS = {"algorithm":"_shim_set_algorithm","feedback":"_shim_set_feedback","transpose":"_shim_set_transpose","lfo_rate":"_shim_set_lfo_rate","lfo_delay":"_shim_set_lfo_delay","lfo_pitch_depth":"_shim_set_lfo_pitch_depth","output_gain":"_shim_set_output_gain","op1_level":"_shim_set_op1_level","op1_coarse":"_shim_set_op1_coarse","op1_fine":"_shim_set_op1_fine","op1_detune":"_shim_set_op1_detune","op2_level":"_shim_set_op2_level","op2_coarse":"_shim_set_op2_coarse","op2_fine":"_shim_set_op2_fine","op2_detune":"_shim_set_op2_detune","op3_level":"_shim_set_op3_level","op3_coarse":"_shim_set_op3_coarse","op3_fine":"_shim_set_op3_fine","op3_detune":"_shim_set_op3_detune","op4_level":"_shim_set_op4_level","op4_coarse":"_shim_set_op4_coarse","op4_fine":"_shim_set_op4_fine","op4_detune":"_shim_set_op4_detune","op5_level":"_shim_set_op5_level","op5_coarse":"_shim_set_op5_coarse","op5_fine":"_shim_set_op5_fine","op5_detune":"_shim_set_op5_detune","op6_level":"_shim_set_op6_level","op6_coarse":"_shim_set_op6_coarse","op6_fine":"_shim_set_op6_fine","op6_detune":"_shim_set_op6_detune"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createDexedPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);

                    outPtrs[0] = mod._shim_output_buf_out_l() >> 2;
                    outPtrs[1] = mod._shim_output_buf_out_r() >> 2;
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

        mod._shim_run(128);
        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));
        outputs[1][0].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));
        return true;
    }
}

registerProcessor('wadspa-Dexed', WadspProcessor);
