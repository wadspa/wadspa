import createamsynthPlugin from './amsynth.js';

let mod = null;
const inPtrs  = [];
const outPtrs = [0, 0];
const SETTERS = {"amp_attack":"_shim_set_amp_attack","amp_decay":"_shim_set_amp_decay","amp_sustain":"_shim_set_amp_sustain","amp_release":"_shim_set_amp_release","osc1_waveform":"_shim_set_osc1_waveform","filter_attack":"_shim_set_filter_attack","filter_decay":"_shim_set_filter_decay","filter_sustain":"_shim_set_filter_sustain","filter_release":"_shim_set_filter_release","filter_resonance":"_shim_set_filter_resonance","filter_env_amount":"_shim_set_filter_env_amount","filter_cutoff":"_shim_set_filter_cutoff","osc2_detune":"_shim_set_osc2_detune","osc2_waveform":"_shim_set_osc2_waveform","master_vol":"_shim_set_master_vol","lfo_freq":"_shim_set_lfo_freq","lfo_waveform":"_shim_set_lfo_waveform","osc2_range":"_shim_set_osc2_range","osc_mix":"_shim_set_osc_mix","freq_mod_amount":"_shim_set_freq_mod_amount","filter_mod_amount":"_shim_set_filter_mod_amount","amp_mod_amount":"_shim_set_amp_mod_amount","osc_mix_mode":"_shim_set_osc_mix_mode","osc1_pulsewidth":"_shim_set_osc1_pulsewidth","osc2_pulsewidth":"_shim_set_osc2_pulsewidth","reverb_roomsize":"_shim_set_reverb_roomsize","reverb_damp":"_shim_set_reverb_damp","reverb_wet":"_shim_set_reverb_wet","reverb_width":"_shim_set_reverb_width","distortion_crunch":"_shim_set_distortion_crunch","osc2_sync":"_shim_set_osc2_sync","portamento_time":"_shim_set_portamento_time","keyboard_mode":"_shim_set_keyboard_mode","osc2_pitch":"_shim_set_osc2_pitch","filter_type":"_shim_set_filter_type","filter_slope":"_shim_set_filter_slope","freq_mod_osc":"_shim_set_freq_mod_osc","filter_kbd_track":"_shim_set_filter_kbd_track","filter_vel_sens":"_shim_set_filter_vel_sens","amp_vel_sens":"_shim_set_amp_vel_sens","portamento_mode":"_shim_set_portamento_mode"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createamsynthPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
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

registerProcessor('wadspa-amsynth', WadspProcessor);
