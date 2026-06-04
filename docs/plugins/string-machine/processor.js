import createString_machinePlugin from './String_machine.js';

let mod = null;
const inPtrs  = [];
const outPtrs = [0, 0];
const SETTERS = {"osc_detune":"_shim_set_osc_detune","osc_hp_cutoff_upper":"_shim_set_osc_hp_cutoff_upper","osc_hp_cutoff_lower":"_shim_set_osc_hp_cutoff_lower","osc_pwm_depth":"_shim_set_osc_pwm_depth","osc_pwm_frequency":"_shim_set_osc_pwm_frequency","osc_enhance_upper":"_shim_set_osc_enhance_upper","osc_enhance_lower":"_shim_set_osc_enhance_lower","flt_lp_cutoff_upper":"_shim_set_flt_lp_cutoff_upper","flt_hp_cutoff_upper":"_shim_set_flt_hp_cutoff_upper","flt_lp_cutoff_lower":"_shim_set_flt_lp_cutoff_lower","flt_hp_cutoff_lower":"_shim_set_flt_hp_cutoff_lower","flt_hs_cutoff_eq":"_shim_set_flt_hs_cutoff_eq","flt_hs_boost_eq":"_shim_set_flt_hs_boost_eq","mix_gain_upper":"_shim_set_mix_gain_upper","mix_gain_lower":"_shim_set_mix_gain_lower","env_attack":"_shim_set_env_attack","env_hold":"_shim_set_env_hold","env_decay":"_shim_set_env_decay","env_sustain":"_shim_set_env_sustain","env_release":"_shim_set_env_release","cho_enabled":"_shim_set_cho_enabled","cho_depth":"_shim_set_cho_depth","cho_rate1":"_shim_set_cho_rate1","cho_depth1":"_shim_set_cho_depth1","cho_rate2":"_shim_set_cho_rate2","cho_depth2":"_shim_set_cho_depth2","cho_model":"_shim_set_cho_model","master_gain":"_shim_set_master_gain","polyphony":"_shim_set_polyphony"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createString_machinePlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    
                    outPtrs[0] = mod._shim_output_buf_lv2_audio_out_1() >> 2;
                    outPtrs[1] = mod._shim_output_buf_lv2_audio_out_2() >> 2;
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

registerProcessor('wadspa-String_machine', WadspProcessor);
