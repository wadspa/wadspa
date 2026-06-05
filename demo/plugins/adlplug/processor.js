import createADLplugPlugin from './ADLplug.js';

let mod = null;
const outPtrs = [0, 0];
const SETTERS = {"mastervol":"_shim_set_mastervol","bank":"_shim_set_bank","program":"_shim_set_program","emulator":"_shim_set_emulator","chip_count":"_shim_set_chip_count","four_op_channels":"_shim_set_four_op_channels","deep_vibrato":"_shim_set_deep_vibrato","deep_tremolo":"_shim_set_deep_tremolo","soft_pan":"_shim_set_soft_pan","full_range_brightness":"_shim_set_full_range_brightness","scale_modulators":"_shim_set_scale_modulators","volume_model":"_shim_set_volume_model","tone":"_shim_set_tone","drive":"_shim_set_drive","stereo_width":"_shim_set_stereo_width"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createADLplugPlugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
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

registerProcessor('wadspa-adlplug', WadspProcessor);
