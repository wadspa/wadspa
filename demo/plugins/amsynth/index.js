export { default } from './amsynth.js';
export const meta         = {
  "uri": "http://code.google.com/p/amsynth/amsynth",
  "label": "amsynth",
  "name": "amsynth",
  "exportName": "createamsynthPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "control",
      "name": "Control",
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
      "symbol": "notify",
      "name": "Notify",
      "dir": "output",
      "type": "atom",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 2,
      "symbol": "out_l",
      "name": "Left",
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
      "symbol": "out_r",
      "name": "Right",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 4,
      "symbol": "amp_attack",
      "name": "Amp Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2.5,
      "default": 0
    },
    {
      "index": 5,
      "symbol": "amp_decay",
      "name": "Amp Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2.5,
      "default": 0
    },
    {
      "index": 6,
      "symbol": "amp_sustain",
      "name": "Amp Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 7,
      "symbol": "amp_release",
      "name": "Amp Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2.5,
      "default": 0
    },
    {
      "index": 8,
      "symbol": "osc1_waveform",
      "name": "Osc1 Waveform",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 2,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "sine",
          "value": 0
        },
        {
          "label": "square / pulse",
          "value": 1
        },
        {
          "label": "triangle / saw",
          "value": 2
        },
        {
          "label": "white noise",
          "value": 3
        },
        {
          "label": "noise + sample & hold",
          "value": 4
        }
      ]
    },
    {
      "index": 9,
      "symbol": "filter_attack",
      "name": "Filter Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2.5,
      "default": 0
    },
    {
      "index": 10,
      "symbol": "filter_decay",
      "name": "Filter Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2.5,
      "default": 0
    },
    {
      "index": 11,
      "symbol": "filter_sustain",
      "name": "Filter Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 12,
      "symbol": "filter_release",
      "name": "Filter Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2.5,
      "default": 0
    },
    {
      "index": 13,
      "symbol": "filter_resonance",
      "name": "Filter Resonance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 0.97,
      "default": 0
    },
    {
      "index": 14,
      "symbol": "filter_env_amount",
      "name": "Filter Env Amount",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -16,
      "max": 16,
      "default": 0
    },
    {
      "index": 15,
      "symbol": "filter_cutoff",
      "name": "Filter Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -0.5,
      "max": 1.5,
      "default": 1.5
    },
    {
      "index": 16,
      "symbol": "osc2_detune",
      "name": "Osc2 Detune",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 17,
      "symbol": "osc2_waveform",
      "name": "Osc2 Waveform",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 2,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "sine",
          "value": 0
        },
        {
          "label": "square / pulse",
          "value": 1
        },
        {
          "label": "triangle / saw",
          "value": 2
        },
        {
          "label": "white noise",
          "value": 3
        },
        {
          "label": "noise + sample & hold",
          "value": 4
        }
      ]
    },
    {
      "index": 18,
      "symbol": "master_vol",
      "name": "Master Vol",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.67
    },
    {
      "index": 19,
      "symbol": "lfo_freq",
      "name": "LFO Freq",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 7.5,
      "default": 0
    },
    {
      "index": 20,
      "symbol": "lfo_waveform",
      "name": "LFO Waveform",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 6,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "sine",
          "value": 0
        },
        {
          "label": "square",
          "value": 1
        },
        {
          "label": "triangle",
          "value": 2
        },
        {
          "label": "white noise",
          "value": 3
        },
        {
          "label": "noise + sample & hold",
          "value": 4
        },
        {
          "label": "sawtooth (up)",
          "value": 5
        },
        {
          "label": "sawtooth (down)",
          "value": 6
        }
      ]
    },
    {
      "index": 21,
      "symbol": "osc2_range",
      "name": "Osc2 Range",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -3,
      "max": 4,
      "default": 0
    },
    {
      "index": 22,
      "symbol": "osc_mix",
      "name": "Osc Mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0,
      "scalePoints": [
        {
          "label": "osc 1",
          "value": -1
        },
        {
          "label": "both",
          "value": 0
        },
        {
          "label": "osc 2",
          "value": 1
        }
      ]
    },
    {
      "index": 23,
      "symbol": "freq_mod_amount",
      "name": "Freq Mod Amount",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1.259921,
      "default": 0
    },
    {
      "index": 24,
      "symbol": "filter_mod_amount",
      "name": "Filter Mod Amount",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": -1
    },
    {
      "index": 25,
      "symbol": "amp_mod_amount",
      "name": "Amp Mod Amount",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": -1
    },
    {
      "index": 26,
      "symbol": "osc_mix_mode",
      "name": "Ring Mod",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 27,
      "symbol": "osc1_pulsewidth",
      "name": "Osc1 Pulsewidth",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 28,
      "symbol": "osc2_pulsewidth",
      "name": "Osc2 Pulsewidth",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 29,
      "symbol": "reverb_roomsize",
      "name": "Reverb Roomsize",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 30,
      "symbol": "reverb_damp",
      "name": "Reverb Damp",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 31,
      "symbol": "reverb_wet",
      "name": "Reverb Wet",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 32,
      "symbol": "reverb_width",
      "name": "Reverb Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 33,
      "symbol": "distortion_crunch",
      "name": "Distortion Crunch",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 0.9,
      "default": 0
    },
    {
      "index": 34,
      "symbol": "osc2_sync",
      "name": "Osc2 Sync",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 35,
      "symbol": "portamento_time",
      "name": "Portamento Time",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 36,
      "symbol": "keyboard_mode",
      "name": "Keyboard Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "poly",
          "value": 0
        },
        {
          "label": "mono",
          "value": 1
        },
        {
          "label": "legato",
          "value": 2
        }
      ]
    },
    {
      "index": 37,
      "symbol": "osc2_pitch",
      "name": "Osc2 Pitch",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -12,
      "max": 12,
      "default": 0,
      "integer": true
    },
    {
      "index": 38,
      "symbol": "filter_type",
      "name": "Filter Type",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "low pass",
          "value": 0
        },
        {
          "label": "high pass",
          "value": 1
        },
        {
          "label": "band pass",
          "value": 2
        }
      ]
    },
    {
      "index": 39,
      "symbol": "filter_slope",
      "name": "Filter Slope",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "12 dB / octave",
          "value": 0
        },
        {
          "label": "24 dB / octave",
          "value": 1
        }
      ]
    },
    {
      "index": 40,
      "symbol": "freq_mod_osc",
      "name": "Freq Mod to Oscillator",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "osc 1+2",
          "value": 0
        },
        {
          "label": "osc 1",
          "value": 1
        },
        {
          "label": "osc 2",
          "value": 2
        }
      ]
    },
    {
      "index": 41,
      "symbol": "filter_kbd_track",
      "name": "Filter Key Track",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 42,
      "symbol": "filter_vel_sens",
      "name": "Filter Velocity Track",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 43,
      "symbol": "amp_vel_sens",
      "name": "Amp Velocity Amount",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 44,
      "symbol": "portamento_mode",
      "name": "Portamento Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "always",
          "value": 0
        },
        {
          "label": "legato",
          "value": 1
        }
      ]
    }
  ]
};
export const wasmUrl      = new URL('./amsynth.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
