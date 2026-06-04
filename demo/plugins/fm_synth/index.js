export { default } from './FM_Synth.js';
export const meta         = {
  "uri": "https://wadspa.org/plugins/fm_synth",
  "label": "FM_Synth",
  "name": "FM Synth",
  "exportName": "createFM_SynthPlugin",
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
      "symbol": "mod_ratio",
      "name": "Mod Ratio",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.5,
      "max": 8,
      "default": 2
    },
    {
      "index": 4,
      "symbol": "mod_index",
      "name": "Mod Index",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 3
    },
    {
      "index": 5,
      "symbol": "mod_decay",
      "name": "Mod Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.01,
      "max": 4,
      "default": 0.5
    },
    {
      "index": 6,
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
      "index": 7,
      "symbol": "decay",
      "name": "Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 4,
      "default": 0.3
    },
    {
      "index": 8,
      "symbol": "sustain",
      "name": "Sustain",
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
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 8,
      "default": 0.5
    },
    {
      "index": 10,
      "symbol": "gain",
      "name": "Gain",
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
export const wasmUrl      = new URL('./FM_Synth.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
