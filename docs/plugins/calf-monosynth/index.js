export { default } from './Calf_Monosynth.js';
export const meta         = {
  "uri": "http://calf.sourceforge.net/plugins/Monosynth",
  "label": "Calf_Monosynth",
  "name": "Calf Monosynth",
  "exportName": "createCalf_MonosynthPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "midi_in",
      "name": "MIDI In",
      "dir": "input",
      "type": "midi",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 1,
      "symbol": "out_l",
      "name": "Out L",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 2,
      "symbol": "out_r",
      "name": "Out R",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 3,
      "symbol": "o1_wave",
      "name": "Osc1 Wave",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 15,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Sawtooth",
          "value": 0
        },
        {
          "label": "Square",
          "value": 1
        },
        {
          "label": "Pulse",
          "value": 2
        },
        {
          "label": "Sine",
          "value": 3
        },
        {
          "label": "Triangle",
          "value": 4
        },
        {
          "label": "Varistep",
          "value": 5
        },
        {
          "label": "Skewed Saw",
          "value": 6
        },
        {
          "label": "Skewed Square",
          "value": 7
        },
        {
          "label": "Smooth Brass",
          "value": 8
        },
        {
          "label": "Bass",
          "value": 9
        },
        {
          "label": "Dark FM",
          "value": 10
        },
        {
          "label": "Multiwave",
          "value": 11
        },
        {
          "label": "Bell FM",
          "value": 12
        },
        {
          "label": "Dark Pad",
          "value": 13
        },
        {
          "label": "DCO Saw",
          "value": 14
        },
        {
          "label": "DCO Maze",
          "value": 15
        }
      ]
    },
    {
      "index": 4,
      "symbol": "o2_wave",
      "name": "Osc2 Wave",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 15,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Sawtooth",
          "value": 0
        },
        {
          "label": "Square",
          "value": 1
        },
        {
          "label": "Pulse",
          "value": 2
        },
        {
          "label": "Sine",
          "value": 3
        },
        {
          "label": "Triangle",
          "value": 4
        },
        {
          "label": "Varistep",
          "value": 5
        },
        {
          "label": "Skewed Saw",
          "value": 6
        },
        {
          "label": "Skewed Square",
          "value": 7
        },
        {
          "label": "Smooth Brass",
          "value": 8
        },
        {
          "label": "Bass",
          "value": 9
        },
        {
          "label": "Dark FM",
          "value": 10
        },
        {
          "label": "Multiwave",
          "value": 11
        },
        {
          "label": "Bell FM",
          "value": 12
        },
        {
          "label": "Dark Pad",
          "value": 13
        },
        {
          "label": "DCO Saw",
          "value": 14
        },
        {
          "label": "DCO Maze",
          "value": 15
        }
      ]
    },
    {
      "index": 5,
      "symbol": "o1_pw",
      "name": "Osc1 PW",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 6,
      "symbol": "o2_pw",
      "name": "Osc2 PW",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 7,
      "symbol": "o12_detune",
      "name": "O1<>2 Detune",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 10
    },
    {
      "index": 8,
      "symbol": "o2_xpose",
      "name": "Osc2 Transpose",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -24,
      "max": 24,
      "default": 12,
      "integer": true
    },
    {
      "index": 9,
      "symbol": "phase_mode",
      "name": "Phase Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 5,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "0:0",
          "value": 0
        },
        {
          "label": "0:180",
          "value": 1
        },
        {
          "label": "0:90",
          "value": 2
        },
        {
          "label": "90:90",
          "value": 3
        },
        {
          "label": "90:270",
          "value": 4
        },
        {
          "label": "Random",
          "value": 5
        }
      ]
    },
    {
      "index": 10,
      "symbol": "o12_mix",
      "name": "O1<>2 Mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 11,
      "symbol": "filter",
      "name": "Filter Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 7,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "12dB/oct Lowpass",
          "value": 0
        },
        {
          "label": "24dB/oct Lowpass",
          "value": 1
        },
        {
          "label": "2x12dB/oct Lowpass",
          "value": 2
        },
        {
          "label": "12dB/oct Highpass",
          "value": 3
        },
        {
          "label": "Lowpass+Notch",
          "value": 4
        },
        {
          "label": "Highpass+Notch",
          "value": 5
        },
        {
          "label": "6dB/oct Bandpass",
          "value": 6
        },
        {
          "label": "2x6dB/oct Bandpass",
          "value": 7
        }
      ]
    },
    {
      "index": 12,
      "symbol": "cutoff",
      "name": "Cutoff Hz",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 20,
      "max": 16000,
      "default": 1200,
      "logarithmic": true
    },
    {
      "index": 13,
      "symbol": "res",
      "name": "Resonance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.7,
      "max": 8,
      "default": 2.2
    },
    {
      "index": 14,
      "symbol": "filter_sep",
      "name": "Filter Separation",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -2400,
      "max": 2400,
      "default": 0
    },
    {
      "index": 15,
      "symbol": "env2cutoff",
      "name": "EG1->Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -4800,
      "max": 4800,
      "default": 1200
    },
    {
      "index": 16,
      "symbol": "env2res",
      "name": "EG1->Res",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 17,
      "symbol": "env2amp",
      "name": "EG1->Amp",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 18,
      "symbol": "adsr_a",
      "name": "EG1 Attack ms",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 2000,
      "default": 8,
      "logarithmic": true
    },
    {
      "index": 19,
      "symbol": "adsr_d",
      "name": "EG1 Decay ms",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 10,
      "max": 2000,
      "default": 350,
      "logarithmic": true
    },
    {
      "index": 20,
      "symbol": "adsr_s",
      "name": "EG1 Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 21,
      "symbol": "adsr_r",
      "name": "EG1 Release ms",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 10,
      "max": 2000,
      "default": 120,
      "logarithmic": true
    },
    {
      "index": 22,
      "symbol": "key_follow",
      "name": "Key Follow",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 0.35
    },
    {
      "index": 23,
      "symbol": "portamento",
      "name": "Portamento ms",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 1000,
      "default": 15,
      "logarithmic": true
    },
    {
      "index": 24,
      "symbol": "vel2filter",
      "name": "Vel->Filter",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 25,
      "symbol": "vel2amp",
      "name": "Vel->Amp",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.25
    },
    {
      "index": 26,
      "symbol": "master",
      "name": "Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.7
    },
    {
      "index": 27,
      "symbol": "pbend_range",
      "name": "PBend Range",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2400,
      "default": 200
    },
    {
      "index": 28,
      "symbol": "lfo_rate",
      "name": "LFO1 Rate Hz",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.05,
      "max": 20,
      "default": 5,
      "logarithmic": true
    },
    {
      "index": 29,
      "symbol": "lfo_delay",
      "name": "LFO1 Delay sec",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 0.2
    },
    {
      "index": 30,
      "symbol": "lfo2filter",
      "name": "LFO1->Filter",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -2400,
      "max": 2400,
      "default": 0
    },
    {
      "index": 31,
      "symbol": "lfo2pitch",
      "name": "LFO1->Pitch",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1200,
      "default": 100
    },
    {
      "index": 32,
      "symbol": "lfo2pw",
      "name": "LFO1->PW",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.15
    },
    {
      "index": 33,
      "symbol": "mwhl2lfo",
      "name": "ModWheel->LFO1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 34,
      "symbol": "adsr2_cutoff",
      "name": "EG2->Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -4800,
      "max": 4800,
      "default": 0
    },
    {
      "index": 35,
      "symbol": "adsr2_res",
      "name": "EG2->Res",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 36,
      "symbol": "adsr2_amp",
      "name": "EG2->Amp",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true
    },
    {
      "index": 37,
      "symbol": "adsr2_a",
      "name": "EG2 Attack ms",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 2000,
      "default": 5,
      "logarithmic": true
    },
    {
      "index": 38,
      "symbol": "adsr2_d",
      "name": "EG2 Decay ms",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 10,
      "max": 2000,
      "default": 180,
      "logarithmic": true
    },
    {
      "index": 39,
      "symbol": "adsr2_s",
      "name": "EG2 Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.55
    },
    {
      "index": 40,
      "symbol": "adsr2_r",
      "name": "EG2 Release ms",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 10,
      "max": 2000,
      "default": 80,
      "logarithmic": true
    },
    {
      "index": 41,
      "symbol": "o1_stretch",
      "name": "Osc1 Stretch",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 16,
      "default": 1,
      "logarithmic": true
    },
    {
      "index": 42,
      "symbol": "o1_window",
      "name": "Osc1 Window",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 43,
      "symbol": "o2_unison",
      "name": "Osc2 Unison",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 44,
      "symbol": "o2_unisonfrq",
      "name": "Osc2 Unison Detune Hz",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.05,
      "max": 20,
      "default": 2,
      "logarithmic": true
    },
    {
      "index": 45,
      "symbol": "o1_xpose",
      "name": "Osc1 Transpose",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -24,
      "max": 24,
      "default": 0,
      "integer": true
    }
  ]
};
export const wasmUrl      = new URL('./Calf_Monosynth.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
