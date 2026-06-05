import createCalf_MonosynthPlugin from './Calf_Monosynth.js';

let mod = null;
const inPtrs  = [];
const outPtrs = [0, 0];
const SETTERS = {"o1_wave":"_shim_set_o1_wave","o2_wave":"_shim_set_o2_wave","o1_pw":"_shim_set_o1_pw","o2_pw":"_shim_set_o2_pw","o12_detune":"_shim_set_o12_detune","o2_xpose":"_shim_set_o2_xpose","phase_mode":"_shim_set_phase_mode","o12_mix":"_shim_set_o12_mix","filter":"_shim_set_filter","cutoff":"_shim_set_cutoff","res":"_shim_set_res","filter_sep":"_shim_set_filter_sep","env2cutoff":"_shim_set_env2cutoff","env2res":"_shim_set_env2res","env2amp":"_shim_set_env2amp","adsr_a":"_shim_set_adsr_a","adsr_d":"_shim_set_adsr_d","adsr_s":"_shim_set_adsr_s","adsr_r":"_shim_set_adsr_r","key_follow":"_shim_set_key_follow","portamento":"_shim_set_portamento","vel2filter":"_shim_set_vel2filter","vel2amp":"_shim_set_vel2amp","master":"_shim_set_master","pbend_range":"_shim_set_pbend_range","lfo_rate":"_shim_set_lfo_rate","lfo_delay":"_shim_set_lfo_delay","lfo2filter":"_shim_set_lfo2filter","lfo2pitch":"_shim_set_lfo2pitch","lfo2pw":"_shim_set_lfo2pw","mwhl2lfo":"_shim_set_mwhl2lfo","adsr2_cutoff":"_shim_set_adsr2_cutoff","adsr2_res":"_shim_set_adsr2_res","adsr2_amp":"_shim_set_adsr2_amp","adsr2_a":"_shim_set_adsr2_a","adsr2_d":"_shim_set_adsr2_d","adsr2_s":"_shim_set_adsr2_s","adsr2_r":"_shim_set_adsr2_r","o1_stretch":"_shim_set_o1_stretch","o1_window":"_shim_set_o1_window","o2_unison":"_shim_set_o2_unison","o2_unisonfrq":"_shim_set_o2_unisonfrq","o1_xpose":"_shim_set_o1_xpose"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createCalf_MonosynthPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
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

registerProcessor('wadspa-Calf_Monosynth', WadspProcessor);
