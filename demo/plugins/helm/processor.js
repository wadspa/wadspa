import createHelmPlugin from './Helm.js';

let mod = null;
const outPtrs = [0, 0];
const SETTERS = {"volume":"_shim_set_volume","polyphony":"_shim_set_polyphony","legato":"_shim_set_legato","pitch_bend_range":"_shim_set_pitch_bend_range","amp_attack":"_shim_set_amp_attack","amp_decay":"_shim_set_amp_decay","amp_sustain":"_shim_set_amp_sustain","amp_release":"_shim_set_amp_release","osc_1_waveform":"_shim_set_osc_1_waveform","osc_1_transpose":"_shim_set_osc_1_transpose","osc_1_tune":"_shim_set_osc_1_tune","osc_1_unison_detune":"_shim_set_osc_1_unison_detune","osc_1_unison_voices":"_shim_set_osc_1_unison_voices","osc_1_volume":"_shim_set_osc_1_volume","osc_2_waveform":"_shim_set_osc_2_waveform","osc_2_transpose":"_shim_set_osc_2_transpose","osc_2_tune":"_shim_set_osc_2_tune","osc_2_unison_detune":"_shim_set_osc_2_unison_detune","osc_2_unison_voices":"_shim_set_osc_2_unison_voices","osc_2_volume":"_shim_set_osc_2_volume","cross_modulation":"_shim_set_cross_modulation","osc_feedback_amount":"_shim_set_osc_feedback_amount","osc_feedback_transpose":"_shim_set_osc_feedback_transpose","osc_feedback_tune":"_shim_set_osc_feedback_tune","noise_volume":"_shim_set_noise_volume","sub_volume":"_shim_set_sub_volume","sub_octave":"_shim_set_sub_octave","sub_waveform":"_shim_set_sub_waveform","sub_shuffle":"_shim_set_sub_shuffle","filter_on":"_shim_set_filter_on","cutoff":"_shim_set_cutoff","resonance":"_shim_set_resonance","filter_drive":"_shim_set_filter_drive","filter_blend":"_shim_set_filter_blend","filter_style":"_shim_set_filter_style","fil_env_depth":"_shim_set_fil_env_depth","fil_attack":"_shim_set_fil_attack","fil_decay":"_shim_set_fil_decay","fil_sustain":"_shim_set_fil_sustain","fil_release":"_shim_set_fil_release","distortion_on":"_shim_set_distortion_on","distortion_type":"_shim_set_distortion_type","distortion_drive":"_shim_set_distortion_drive","distortion_mix":"_shim_set_distortion_mix","delay_on":"_shim_set_delay_on","delay_dry_wet":"_shim_set_delay_dry_wet","delay_feedback":"_shim_set_delay_feedback","delay_frequency":"_shim_set_delay_frequency","reverb_on":"_shim_set_reverb_on","reverb_dry_wet":"_shim_set_reverb_dry_wet","reverb_feedback":"_shim_set_reverb_feedback","reverb_damping":"_shim_set_reverb_damping"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createHelmPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    outPtrs[0] = mod._shim_output_buf_out_l() >> 2;
                    outPtrs[1] = mod._shim_output_buf_out_r() >> 2;
                    this.port.postMessage({ type: 'ready' });
                } catch (error) {
                    this.port.postMessage({ type: 'error', message: error.message });
                }
            } else if (data.type === 'midi') {
                if (!mod) return;
                const { status, data1, data2 } = data;
                const type = status & 0xF0;
                const ch = status & 0x0F;
                if (type === 0x90 && data2 > 0) mod._shim_midi_note_on(ch, data1, data2);
                else if (type === 0x80 || (type === 0x90 && data2 === 0)) mod._shim_midi_note_off(ch, data1);
                else if (type === 0xB0) mod._shim_midi_cc(ch, data1, data2);
                else if (type === 0xE0) mod._shim_midi_pitch_bend(ch, ((data2 << 7) | data1) - 8192);
                else if (type === 0xC0) mod._shim_midi_program_change(ch, data1);
            } else if (data.type === 'set') {
                if (mod) {
                    const fn = SETTERS[data.symbol];
                    if (fn && typeof mod[fn] === 'function') mod[fn](data.value);
                }
            }
        };
    }

    process(_inputs, outputs) {
        if (!mod) return true;
        mod._shim_run(128);
        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));
        outputs[1][0].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));
        return true;
    }
}

registerProcessor('wadspa-helm', WadspProcessor);
