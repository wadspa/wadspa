export { default } from './TAP_ChorusFlanger.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/chorusflanger",
  "label": "TAP_ChorusFlanger",
  "name": "TAP Chorus/Flanger",
  "exportName": "createTAP_ChorusFlangerPlugin",
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
      "max": 5,
      "default": 1.75
    },
    {
      "index": 1,
      "symbol": "LRPhaseShift",
      "name": "L/R Phase Shift",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 180,
      "default": 90
    },
    {
      "index": 2,
      "symbol": "Depth",
      "name": "Depth",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 75
    },
    {
      "index": 3,
      "symbol": "Delay",
      "name": "Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 25
    },
    {
      "index": 4,
      "symbol": "Contour",
      "name": "Contour",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 20,
      "max": 20000,
      "default": 100,
      "logarithmic": true
    },
    {
      "index": 5,
      "symbol": "DryLevel",
      "name": "Dry Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -90,
      "max": 20,
      "default": -3
    },
    {
      "index": 6,
      "symbol": "WetLevel",
      "name": "Wet Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -90,
      "max": 20,
      "default": -3
    },
    {
      "index": 7,
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
      "index": 8,
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
      "index": 9,
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
      "index": 10,
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
export const wasmUrl      = new URL('./TAP_ChorusFlanger.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
