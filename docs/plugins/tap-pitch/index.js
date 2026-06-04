export { default } from './TAP_Pitch_Shifter.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/pitch",
  "label": "TAP_Pitch_Shifter",
  "name": "TAP Pitch Shifter",
  "exportName": "createTAP_Pitch_ShifterPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "Semitone",
      "name": "Semitone Shift",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -12,
      "max": 12,
      "default": 0
    },
    {
      "index": 1,
      "symbol": "Rate",
      "name": "Rate Shift [%]",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -50,
      "max": 100,
      "default": 0
    },
    {
      "index": 2,
      "symbol": "Drylevel",
      "name": "Dry Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -90,
      "max": 20,
      "default": -90
    },
    {
      "index": 3,
      "symbol": "Wetlevel",
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
      "index": 4,
      "symbol": "Latency",
      "name": "latency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 16027,
      "default": 0
    },
    {
      "index": 5,
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
      "index": 6,
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
export const wasmUrl      = new URL('./TAP_Pitch_Shifter.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
