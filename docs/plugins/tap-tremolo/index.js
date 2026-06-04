export { default } from './TAP_Tremolo.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/tremolo",
  "label": "TAP_Tremolo",
  "name": "TAP Tremolo",
  "exportName": "createTAP_TremoloPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "frequency",
      "name": "Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 20,
      "default": 5
    },
    {
      "index": 1,
      "symbol": "depth",
      "name": "Depth",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 50
    },
    {
      "index": 2,
      "symbol": "gain",
      "name": "Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -70,
      "max": 20,
      "default": 0
    },
    {
      "index": 3,
      "symbol": "input_0",
      "name": "Input_0",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 4,
      "symbol": "output_0",
      "name": "Output_0",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./TAP_Tremolo.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
