export { default } from './TAP_Vibrato.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/vibrato",
  "label": "TAP_Vibrato",
  "name": "TAP Vibrato",
  "exportName": "createTAP_VibratoPlugin",
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
      "max": 30,
      "default": 0
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
      "max": 20,
      "default": 0
    },
    {
      "index": 2,
      "symbol": "drylevel",
      "name": "Drylevel",
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
      "symbol": "wetlevel",
      "name": "Wetlevel",
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
      "symbol": "latency",
      "name": "Latency",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 6300,
      "default": 6300
    },
    {
      "index": 5,
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
      "index": 6,
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
export const wasmUrl      = new URL('./TAP_Vibrato.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
