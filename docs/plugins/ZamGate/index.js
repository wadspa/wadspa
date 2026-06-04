export { default } from './ZamGate.js';
export const meta         = {
  "uri": "urn:zamaudio:ZamGate",
  "label": "ZamGate",
  "name": "ZamGate",
  "exportName": "createZamGatePlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "lv2_audio_in_1",
      "name": "Audio Input 1",
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
      "symbol": "lv2_sidechain_in",
      "name": "Sidechain Input",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 2,
      "symbol": "lv2_audio_out_1",
      "name": "Audio Output 1",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 3,
      "symbol": "att",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.10000000149,
      "max": 500,
      "default": 50
    },
    {
      "index": 4,
      "symbol": "rel",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.10000000149,
      "max": 500,
      "default": 100
    },
    {
      "index": 5,
      "symbol": "thr",
      "name": "Threshold",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 0,
      "default": -60
    },
    {
      "index": 6,
      "symbol": "mak",
      "name": "Makeup",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -30,
      "max": 30,
      "default": 0
    },
    {
      "index": 7,
      "symbol": "sidechain",
      "name": "Sidechain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 8,
      "symbol": "close",
      "name": "Max gate close",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -50,
      "max": 0,
      "default": -50
    },
    {
      "index": 9,
      "symbol": "mode",
      "name": "Mode open/shut",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 10,
      "symbol": "outlevel",
      "name": "Output Level",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -45,
      "max": 20,
      "default": null
    },
    {
      "index": 11,
      "symbol": "gainr",
      "name": "Gain Reduction",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 40,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./ZamGate.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
