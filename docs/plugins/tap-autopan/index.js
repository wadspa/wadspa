export { default } from './TAP_AutoPanner.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/autopan",
  "label": "TAP_AutoPanner",
  "name": "TAP AutoPanner",
  "exportName": "createTAP_AutoPannerPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "Frequency",
      "name": "Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 20,
      "default": 3
    },
    {
      "index": 1,
      "symbol": "Depth",
      "name": "Depth",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 80
    },
    {
      "index": 2,
      "symbol": "Gain",
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
      "symbol": "InputL",
      "name": "Input L",
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
      "symbol": "InputR",
      "name": "Input R",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 5,
      "symbol": "OutputL",
      "name": "Output L",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 6,
      "symbol": "OutputR",
      "name": "Output R",
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
export const wasmUrl      = new URL('./TAP_AutoPanner.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
