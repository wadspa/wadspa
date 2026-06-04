export { default } from './wadspa_synth.js';
export const meta         = {
  "uri": "https://wadspa.org/plugins/wadspa_synth",
  "label": "wadspa_synth",
  "name": "wadspa synth",
  "exportName": "createwadspa_synthPlugin",
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
      "symbol": "cutoff",
      "name": "Filter Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 4,
      "symbol": "attack",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 4,
      "default": 0.01
    },
    {
      "index": 5,
      "symbol": "decay",
      "name": "Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 4,
      "default": 0.1
    },
    {
      "index": 6,
      "symbol": "sustain",
      "name": "Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.7
    },
    {
      "index": 7,
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 8,
      "default": 0.3
    },
    {
      "index": 8,
      "symbol": "gain",
      "name": "Master Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.7
    }
  ]
};
export const wasmUrl      = new URL('./wadspa_synth.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
