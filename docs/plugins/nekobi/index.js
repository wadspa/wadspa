export { default } from './DISTRHO_Nekobi.js';
export const meta         = {
  "uri": "http://distrho.sf.net/plugins/Nekobi",
  "label": "DISTRHO_Nekobi",
  "name": "DISTRHO Nekobi",
  "exportName": "createDISTRHO_NekobiPlugin",
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
      "symbol": "waveform",
      "name": "Waveform",
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
          "label": "Square",
          "value": 0
        },
        {
          "label": "Triangle",
          "value": 1
        }
      ]
    },
    {
      "index": 4,
      "symbol": "tuning",
      "name": "Tuning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -12,
      "max": 12,
      "default": 0
    },
    {
      "index": 5,
      "symbol": "cutoff",
      "name": "Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 25
    },
    {
      "index": 6,
      "symbol": "resonance",
      "name": "VCF Resonance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 95,
      "default": 25
    },
    {
      "index": 7,
      "symbol": "env_mod",
      "name": "Env Mod",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 50
    },
    {
      "index": 8,
      "symbol": "decay",
      "name": "Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 75
    },
    {
      "index": 9,
      "symbol": "accent",
      "name": "Accent",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 25
    },
    {
      "index": 10,
      "symbol": "volume",
      "name": "Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 75
    }
  ]
};
export const wasmUrl      = new URL('./DISTRHO_Nekobi.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
