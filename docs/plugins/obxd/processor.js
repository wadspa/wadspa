import createObxdPlugin from './Obxd.js';

let mod = null;
const inPtrs  = [];
const outPtrs = [0, 0];
const SETTERS = {"volume":"_shim_set_volume","voice_count":"_shim_set_voice_count","tune":"_shim_set_tune","octave":"_shim_set_octave","unison":"_shim_set_unison","voice_detune":"_shim_set_voice_detune","osc2_detune":"_shim_set_osc2_detune","osc1_mix":"_shim_set_osc1_mix","osc2_mix":"_shim_set_osc2_mix","noise_mix":"_shim_set_noise_mix","osc1_saw":"_shim_set_osc1_saw","osc1_pulse":"_shim_set_osc1_pulse","osc2_saw":"_shim_set_osc2_saw","osc2_pulse":"_shim_set_osc2_pulse","pulse_width":"_shim_set_pulse_width","cutoff":"_shim_set_cutoff","resonance":"_shim_set_resonance","filter_env_amount":"_shim_set_filter_env_amount","filter_mode":"_shim_set_filter_mode","bandpass_blend":"_shim_set_bandpass_blend","four_pole":"_shim_set_four_pole","amp_attack":"_shim_set_amp_attack","amp_decay":"_shim_set_amp_decay","amp_sustain":"_shim_set_amp_sustain","amp_release":"_shim_set_amp_release","filter_attack":"_shim_set_filter_attack","filter_decay":"_shim_set_filter_decay","filter_sustain":"_shim_set_filter_sustain","filter_release":"_shim_set_filter_release","lfo_frequency":"_shim_set_lfo_frequency","lfo_pitch_amount":"_shim_set_lfo_pitch_amount","lfo_sine":"_shim_set_lfo_sine","lfo_square":"_shim_set_lfo_square","lfo_sample_hold":"_shim_set_lfo_sample_hold","lfo_osc1":"_shim_set_lfo_osc1","lfo_osc2":"_shim_set_lfo_osc2","lfo_filter":"_shim_set_lfo_filter","xmod":"_shim_set_xmod","osc2_hard_sync":"_shim_set_osc2_hard_sync"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createObxdPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
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

registerProcessor('wadspa-Obxd', WadspProcessor);
