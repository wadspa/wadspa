export { default } from './TAP_Fractal_Doubler.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/doubler",
  "label": "TAP_Fractal_Doubler",
  "name": "TAP Fractal Doubler",
  "exportName": "createTAP_Fractal_DoublerPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "TimeTracking",
      "name": "Time Tracking",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 1,
      "symbol": "PitchTracking",
      "name": "Pitch Tracking",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 2,
      "symbol": "DryLevelDb",
      "name": "Dry Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -90,
      "max": 20,
      "default": 0
    },
    {
      "index": 3,
      "symbol": "DryLeftPosition",
      "name": "Dry Left Position",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 4,
      "symbol": "DryRightPosition",
      "name": "Dry Right Position",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 5,
      "symbol": "WetLevelDb",
      "name": "Wet Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -90,
      "max": 20,
      "default": 0
    },
    {
      "index": 6,
      "symbol": "WetLeftPosition",
      "name": "Wet Left Position",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 7,
      "symbol": "WetRightPosition",
      "name": "Wet Right Position",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 8,
      "symbol": "Input_L",
      "name": "Input_L",
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
      "symbol": "Input_R",
      "name": "Input_R",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 10,
      "symbol": "Output_L",
      "name": "Output_L",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 11,
      "symbol": "Output_R",
      "name": "Output_R",
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
export const wasmUrl      = new URL('./TAP_Fractal_Doubler.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
