import createsynthv1Plugin from './synthv1.js';

let mod = null;
const inPtrs  = [0, 0];
const outPtrs = [0, 0];
const SETTERS = {"DCO1_SHAPE1":"_shim_set_DCO1_SHAPE1","DCO1_WIDTH1":"_shim_set_DCO1_WIDTH1","DCO1_BANDL1":"_shim_set_DCO1_BANDL1","DCO1_SYNC1":"_shim_set_DCO1_SYNC1","DCO1_SHAPE2":"_shim_set_DCO1_SHAPE2","DCO1_WIDTH2":"_shim_set_DCO1_WIDTH2","DCO1_BANDL2":"_shim_set_DCO1_BANDL2","DCO1_SYNC2":"_shim_set_DCO1_SYNC2","DCO1_BALANCE":"_shim_set_DCO1_BALANCE","DCO1_DETUNE":"_shim_set_DCO1_DETUNE","DCO1_PHASE":"_shim_set_DCO1_PHASE","DCO1_RINGMOD":"_shim_set_DCO1_RINGMOD","DCO1_OCTAVE":"_shim_set_DCO1_OCTAVE","DCO1_TUNING":"_shim_set_DCO1_TUNING","DCO1_GLIDE":"_shim_set_DCO1_GLIDE","DCO1_ENVTIME":"_shim_set_DCO1_ENVTIME","DCF1_ENABLED":"_shim_set_DCF1_ENABLED","DCF1_CUTOFF":"_shim_set_DCF1_CUTOFF","DCF1_RESO":"_shim_set_DCF1_RESO","DCF1_TYPE":"_shim_set_DCF1_TYPE","DCF1_SLOPE":"_shim_set_DCF1_SLOPE","DCF1_ENVELOPE":"_shim_set_DCF1_ENVELOPE","DCF1_ATTACK":"_shim_set_DCF1_ATTACK","DCF1_DECAY":"_shim_set_DCF1_DECAY","DCF1_SUSTAIN":"_shim_set_DCF1_SUSTAIN","DCF1_RELEASE":"_shim_set_DCF1_RELEASE","LFO1_ENABLED":"_shim_set_LFO1_ENABLED","LFO1_SHAPE":"_shim_set_LFO1_SHAPE","LFO1_WIDTH":"_shim_set_LFO1_WIDTH","LFO1_BPM":"_shim_set_LFO1_BPM","LFO1_RATE":"_shim_set_LFO1_RATE","LFO1_SYNC":"_shim_set_LFO1_SYNC","LFO1_SWEEP":"_shim_set_LFO1_SWEEP","LFO1_PITCH":"_shim_set_LFO1_PITCH","LFO1_BALANCE":"_shim_set_LFO1_BALANCE","LFO1_RINGMOD":"_shim_set_LFO1_RINGMOD","LFO1_CUTOFF":"_shim_set_LFO1_CUTOFF","LFO1_RESO":"_shim_set_LFO1_RESO","LFO1_PANNING":"_shim_set_LFO1_PANNING","LFO1_VOLUME":"_shim_set_LFO1_VOLUME","LFO1_ATTACK":"_shim_set_LFO1_ATTACK","LFO1_DECAY":"_shim_set_LFO1_DECAY","LFO1_SUSTAIN":"_shim_set_LFO1_SUSTAIN","LFO1_RELEASE":"_shim_set_LFO1_RELEASE","DCA1_VOLUME":"_shim_set_DCA1_VOLUME","DCA1_ATTACK":"_shim_set_DCA1_ATTACK","DCA1_DECAY":"_shim_set_DCA1_DECAY","DCA1_SUSTAIN":"_shim_set_DCA1_SUSTAIN","DCA1_RELEASE":"_shim_set_DCA1_RELEASE","OUT1_WIDTH":"_shim_set_OUT1_WIDTH","OUT1_PANNING":"_shim_set_OUT1_PANNING","OUT1_FXSEND":"_shim_set_OUT1_FXSEND","OUT1_VOLUME":"_shim_set_OUT1_VOLUME","DEF1_PITCHBEND":"_shim_set_DEF1_PITCHBEND","DEF1_MODWHEEL":"_shim_set_DEF1_MODWHEEL","DEF1_PRESSURE":"_shim_set_DEF1_PRESSURE","DEF1_VELOCITY":"_shim_set_DEF1_VELOCITY","DEF1_CHANNEL":"_shim_set_DEF1_CHANNEL","DEF1_MONO":"_shim_set_DEF1_MONO","DCO2_SHAPE1":"_shim_set_DCO2_SHAPE1","DCO2_WIDTH1":"_shim_set_DCO2_WIDTH1","DCO2_BANDL1":"_shim_set_DCO2_BANDL1","DCO2_SYNC1":"_shim_set_DCO2_SYNC1","DCO2_SHAPE2":"_shim_set_DCO2_SHAPE2","DCO2_WIDTH2":"_shim_set_DCO2_WIDTH2","DCO2_BANDL2":"_shim_set_DCO2_BANDL2","DCO2_SYNC2":"_shim_set_DCO2_SYNC2","DCO2_BALANCE":"_shim_set_DCO2_BALANCE","DCO2_DETUNE":"_shim_set_DCO2_DETUNE","DCO2_PHASE":"_shim_set_DCO2_PHASE","DCO2_RINGMOD":"_shim_set_DCO2_RINGMOD","DCO2_OCTAVE":"_shim_set_DCO2_OCTAVE","DCO2_TUNING":"_shim_set_DCO2_TUNING","DCO2_GLIDE":"_shim_set_DCO2_GLIDE","DCO2_ENVTIME":"_shim_set_DCO2_ENVTIME","DCF2_ENABLED":"_shim_set_DCF2_ENABLED","DCF2_CUTOFF":"_shim_set_DCF2_CUTOFF","DCF2_RESO":"_shim_set_DCF2_RESO","DCF2_TYPE":"_shim_set_DCF2_TYPE","DCF2_SLOPE":"_shim_set_DCF2_SLOPE","DCF2_ENVELOPE":"_shim_set_DCF2_ENVELOPE","DCF2_ATTACK":"_shim_set_DCF2_ATTACK","DCF2_DECAY":"_shim_set_DCF2_DECAY","DCF2_SUSTAIN":"_shim_set_DCF2_SUSTAIN","DCF2_RELEASE":"_shim_set_DCF2_RELEASE","LFO2_ENABLED":"_shim_set_LFO2_ENABLED","LFO2_SHAPE":"_shim_set_LFO2_SHAPE","LFO2_WIDTH":"_shim_set_LFO2_WIDTH","LFO2_BPM":"_shim_set_LFO2_BPM","LFO2_RATE":"_shim_set_LFO2_RATE","LFO2_SYNC":"_shim_set_LFO2_SYNC","LFO2_SWEEP":"_shim_set_LFO2_SWEEP","LFO2_PITCH":"_shim_set_LFO2_PITCH","LFO2_BALANCE":"_shim_set_LFO2_BALANCE","LFO2_RINGMOD":"_shim_set_LFO2_RINGMOD","LFO2_CUTOFF":"_shim_set_LFO2_CUTOFF","LFO2_RESO":"_shim_set_LFO2_RESO","LFO2_PANNING":"_shim_set_LFO2_PANNING","LFO2_VOLUME":"_shim_set_LFO2_VOLUME","LFO2_ATTACK":"_shim_set_LFO2_ATTACK","LFO2_DECAY":"_shim_set_LFO2_DECAY","LFO2_SUSTAIN":"_shim_set_LFO2_SUSTAIN","LFO2_RELEASE":"_shim_set_LFO2_RELEASE","DCA2_VOLUME":"_shim_set_DCA2_VOLUME","DCA2_ATTACK":"_shim_set_DCA2_ATTACK","DCA2_DECAY":"_shim_set_DCA2_DECAY","DCA2_SUSTAIN":"_shim_set_DCA2_SUSTAIN","DCA2_RELEASE":"_shim_set_DCA2_RELEASE","OUT2_WIDTH":"_shim_set_OUT2_WIDTH","OUT2_PANNING":"_shim_set_OUT2_PANNING","OUT2_FXSEND":"_shim_set_OUT2_FXSEND","OUT2_VOLUME":"_shim_set_OUT2_VOLUME","DEF2_PITCHBEND":"_shim_set_DEF2_PITCHBEND","DEF2_MODWHEEL":"_shim_set_DEF2_MODWHEEL","DEF2_PRESSURE":"_shim_set_DEF2_PRESSURE","DEF2_VELOCITY":"_shim_set_DEF2_VELOCITY","DEF2_CHANNEL":"_shim_set_DEF2_CHANNEL","DEF2_MONO":"_shim_set_DEF2_MONO","CHO1_WET":"_shim_set_CHO1_WET","CHO1_DELAY":"_shim_set_CHO1_DELAY","CHO1_FEEDB":"_shim_set_CHO1_FEEDB","CHO1_RATE":"_shim_set_CHO1_RATE","CHO1_MOD":"_shim_set_CHO1_MOD","FLA1_WET":"_shim_set_FLA1_WET","FLA1_DELAY":"_shim_set_FLA1_DELAY","FLA1_FEEDB":"_shim_set_FLA1_FEEDB","FLA1_DAFT":"_shim_set_FLA1_DAFT","PHA1_WET":"_shim_set_PHA1_WET","PHA1_RATE":"_shim_set_PHA1_RATE","PHA1_FEEDB":"_shim_set_PHA1_FEEDB","PHA1_DEPTH":"_shim_set_PHA1_DEPTH","PHA1_DAFT":"_shim_set_PHA1_DAFT","DEL1_WET":"_shim_set_DEL1_WET","DEL1_DELAY":"_shim_set_DEL1_DELAY","DEL1_FEEDB":"_shim_set_DEL1_FEEDB","DEL1_BPM":"_shim_set_DEL1_BPM","REV1_WET":"_shim_set_REV1_WET","REV1_ROOM":"_shim_set_REV1_ROOM","REV1_DAMP":"_shim_set_REV1_DAMP","REV1_FEEDB":"_shim_set_REV1_FEEDB","REV1_WIDTH":"_shim_set_REV1_WIDTH","DYN1_COMPRESS":"_shim_set_DYN1_COMPRESS","DYN1_LIMITER":"_shim_set_DYN1_LIMITER","KEY1_LOW":"_shim_set_KEY1_LOW","KEY1_HIGH":"_shim_set_KEY1_HIGH"};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await createsynthv1Plugin({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
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

registerProcessor('wadspa-synthv1', WadspProcessor);
