export { default } from './TAP_Reflector.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/reflector",
  "label": "TAP_Reflector",
  "name": "TAP Reflector",
  "exportName": "createTAP_ReflectorPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "fragment",
      "name": "Fragment Length",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 100,
      "max": 1600,
      "default": 1000
    },
    {
      "index": 1,
      "symbol": "dry",
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
      "index": 2,
      "symbol": "wet",
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
      "index": 3,
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
      "index": 4,
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
export const wasmUrl      = new URL('./TAP_Reflector.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
