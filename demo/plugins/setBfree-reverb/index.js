export { default } from './setBfree_Organ_Reverb.js';
export const meta         = {
  "uri": "http://gareus.org/oss/lv2/b_reverb",
  "label": "setBfree_Organ_Reverb",
  "name": "setBfree Organ Reverb",
  "exportName": "createsetBfree_Organ_ReverbPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "in",
      "name": "In",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 1,
      "symbol": "out",
      "name": "Out",
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
      "symbol": "mix",
      "name": "Dry/Wet",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.3
    },
    {
      "index": 3,
      "symbol": "gain_in",
      "name": "Input Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.04
    }
  ]
};
export const wasmUrl      = new URL('./setBfree_Organ_Reverb.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
