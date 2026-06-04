export { default } from './TAP_Sigmoid_Booster.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/sigmoid",
  "label": "TAP_Sigmoid_Booster",
  "name": "TAP Sigmoid Booster",
  "exportName": "createTAP_Sigmoid_BoosterPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "Pregain",
      "name": "Pregain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -90,
      "max": 20,
      "default": 0
    },
    {
      "index": 1,
      "symbol": "Postgain",
      "name": "Postgain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -90,
      "max": 20,
      "default": 0
    },
    {
      "index": 2,
      "symbol": "Input",
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
      "symbol": "Output",
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
export const wasmUrl      = new URL('./TAP_Sigmoid_Booster.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
