import createsetBfree_DSP_Tonewheel_OrganPlugin from './setBfree_DSP_Tonewheel_Organ.js';

let mod = null;
const inPtrs  = [];
const outPtrs = [0, 0];
const SETTERS = {"upper_drawbar_16":"_shim_set_upper_drawbar_16","upper_drawbar_513":"_shim_set_upper_drawbar_513","upper_drawbar_8":"_shim_set_upper_drawbar_8","upper_drawbar_4":"_shim_set_upper_drawbar_4","upper_drawbar_223":"_shim_set_upper_drawbar_223","upper_drawbar_2":"_shim_set_upper_drawbar_2","upper_drawbar_135":"_shim_set_upper_drawbar_135","upper_drawbar_113":"_shim_set_upper_drawbar_113","upper_drawbar_1":"_shim_set_upper_drawbar_1","swell":"_shim_set_swell","reverb_mix":"_shim_set_reverb_mix","overdrive_enable":"_shim_set_overdrive_enable","overdrive_drive":"_shim_set_overdrive_drive","overdrive_output":"_shim_set_overdrive_output","overdrive_tone":"_shim_set_overdrive_tone"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createsetBfree_DSP_Tonewheel_OrganPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);

                    outPtrs[0] = mod._shim_output_buf_outL() >> 2;
                    outPtrs[1] = mod._shim_output_buf_outR() >> 2;
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
            } else if (data.type === 'setState') {
                if (!mod || typeof mod._shim_set_plugin_state !== 'function') return;
                const enc = new TextEncoder();
                const kb = enc.encode(data.key + '\0'), vb = enc.encode(data.value + '\0');
                const kp = mod._malloc(kb.length), vp = mod._malloc(vb.length);
                mod.HEAPU8.set(kb, kp); mod.HEAPU8.set(vb, vp);
                mod._shim_set_plugin_state(kp, vp);
                mod._free(kp); mod._free(vp);
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

registerProcessor('wadspa-setBfree_DSP_Tonewheel_Organ', WadspProcessor);
