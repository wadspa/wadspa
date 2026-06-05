import createZynAddSubFXPlugin from './ZynAddSubFX.js';

let mod = null;
const outPtrs = [0, 0];
const SETTERS = {"master_volume":"_shim_set_master_volume","key_shift":"_shim_set_key_shift","part_volume":"_shim_set_part_volume","part_pan":"_shim_set_part_pan","velocity_sense":"_shim_set_velocity_sense","voice_limit":"_shim_set_voice_limit","amp_attack":"_shim_set_amp_attack","amp_decay":"_shim_set_amp_decay","amp_sustain":"_shim_set_amp_sustain","amp_release":"_shim_set_amp_release","filter_cutoff":"_shim_set_filter_cutoff","filter_resonance":"_shim_set_filter_resonance","filter_type":"_shim_set_filter_type","filter_stages":"_shim_set_filter_stages","voice_volume":"_shim_set_voice_volume","voice_detune":"_shim_set_voice_detune"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createZynAddSubFXPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
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

registerProcessor('wadspa-zynaddsubfx', WadspProcessor);
