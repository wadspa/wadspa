export { default } from './TAP_Tubewarmth.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/tubewarmth",
  "label": "TAP_Tubewarmth",
  "name": "TAP Tubewarmth",
  "exportName": "createTAP_TubewarmthPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "drive",
      "name": "Drive",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.1,
      "max": 10,
      "default": 5
    },
    {
      "index": 1,
      "symbol": "blend",
      "name": "Tape--Tube Blend",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -10,
      "max": 10,
      "default": 10
    },
    {
      "index": 2,
      "symbol": "input",
      "name": "Input",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 3,
      "symbol": "output",
      "name": "Output",
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
export const wasmUrl      = new URL('./TAP_Tubewarmth.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
