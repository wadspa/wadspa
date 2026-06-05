export { default } from './Geonkick.js';
export const meta         = {
  "uri": "https://wadspa.org/plugins/geonkick",
  "label": "Geonkick",
  "name": "Geonkick",
  "exportName": "createGeonkickPlugin",
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
      "symbol": "frequency",
      "name": "Bass Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 30,
      "max": 220,
      "default": 55,
      "logarithmic": true
    },
    {
      "index": 4,
      "symbol": "decay",
      "name": "Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.08,
      "max": 1.5,
      "default": 0.52,
      "logarithmic": true
    },
    {
      "index": 5,
      "symbol": "pitch_drop",
      "name": "Pitch Drop",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 48,
      "default": 18
    },
    {
      "index": 6,
      "symbol": "noise",
      "name": "Noise Amount",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 0.85,
      "default": 0.06
    },
    {
      "index": 7,
      "symbol": "click",
      "name": "Click Amount",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.35
    },
    {
      "index": 8,
      "symbol": "tone",
      "name": "Tone Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 120,
      "max": 8000,
      "default": 3600,
      "logarithmic": true
    },
    {
      "index": 9,
      "symbol": "resonance",
      "name": "Resonance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.5,
      "max": 4,
      "default": 0.8
    },
    {
      "index": 10,
      "symbol": "drive",
      "name": "Drive",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 6,
      "default": 1
    },
    {
      "index": 11,
      "symbol": "gain",
      "name": "Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.08,
      "max": 0.9,
      "default": 0.58
    }
  ]
};
export const wasmUrl      = new URL('./Geonkick.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
