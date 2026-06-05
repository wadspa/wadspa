export { default } from './Chow_Kick.js';
export const meta         = {
  "uri": "https://github.com/Chowdhury-DSP/ChowKick#instrument",
  "label": "Chow_Kick",
  "name": "Chow Kick",
  "exportName": "createChow_KickPlugin",
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
      "name": "Audio Out L",
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
      "name": "Audio Out R",
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
      "symbol": "pulse_width",
      "name": "Pulse Width [ms]",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.025,
      "max": 2.5,
      "default": 1,
      "logarithmic": true
    },
    {
      "index": 4,
      "symbol": "pulse_amp",
      "name": "Pulse Amp",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 5,
      "symbol": "voices",
      "name": "Voices",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 4,
      "default": 2,
      "integer": true
    },
    {
      "index": 6,
      "symbol": "velocity_sensitivity",
      "name": "Velocity Sensitivity",
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
      "index": 7,
      "symbol": "sustain",
      "name": "Pulse Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 8,
      "symbol": "decay",
      "name": "Pulse Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 9,
      "symbol": "frequency",
      "name": "Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 30,
      "max": 500,
      "default": 100,
      "logarithmic": true
    },
    {
      "index": 10,
      "symbol": "link_pitch",
      "name": "Link Pitch",
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
      "index": 11,
      "symbol": "q",
      "name": "Q",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.1,
      "max": 2,
      "default": 0.5
    },
    {
      "index": 12,
      "symbol": "damping",
      "name": "Damping",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 13,
      "symbol": "tight",
      "name": "Tight",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 14,
      "symbol": "bounce",
      "name": "Bounce",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.15
    },
    {
      "index": 15,
      "symbol": "res_mode",
      "name": "Resonator Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Linear",
          "value": 0
        },
        {
          "label": "Basic",
          "value": 1
        },
        {
          "label": "Bouncy",
          "value": 2
        }
      ]
    },
    {
      "index": 16,
      "symbol": "portamento",
      "name": "Portamento [ms]",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.1,
      "max": 200,
      "default": 50,
      "logarithmic": true
    },
    {
      "index": 17,
      "symbol": "noise_amount",
      "name": "Noise Amount",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.18
    },
    {
      "index": 18,
      "symbol": "noise_decay",
      "name": "Noise Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 19,
      "symbol": "noise_cutoff",
      "name": "Noise Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 20,
      "max": 20000,
      "default": 2000,
      "logarithmic": true
    },
    {
      "index": 20,
      "symbol": "noise_type",
      "name": "Noise Type",
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
          "label": "Uniform",
          "value": 0
        },
        {
          "label": "Driven",
          "value": 1
        },
        {
          "label": "Crackle",
          "value": 2
        }
      ]
    },
    {
      "index": 21,
      "symbol": "tone",
      "name": "Tone",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 300,
      "max": 7000,
      "default": 800,
      "logarithmic": true
    },
    {
      "index": 22,
      "symbol": "level",
      "name": "Level dB",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -30,
      "max": 18,
      "default": 0
    }
  ]
};
export const wasmUrl      = new URL('./Chow_Kick.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
