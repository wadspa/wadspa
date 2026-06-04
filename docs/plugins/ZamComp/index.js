export { default } from './ZamComp.js';
export const meta         = {
  "uri": "urn:zamaudio:ZamComp",
  "label": "ZamComp",
  "name": "ZamComp",
  "exportName": "createZamCompPlugin",
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
      "max": 100,
      "default": 10
    },
    {
      "index": 4,
      "symbol": "rel",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 500,
      "default": 80
    },
    {
      "index": 5,
      "symbol": "kn",
      "name": "Knee",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 8,
      "default": 0
    },
    {
      "index": 6,
      "symbol": "rat",
      "name": "Ratio",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 20,
      "default": 4,
      "logarithmic": true
    },
    {
      "index": 7,
      "symbol": "thr",
      "name": "Threshold",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -80,
      "max": 0,
      "default": 0
    },
    {
      "index": 8,
      "symbol": "mak",
      "name": "Makeup",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 30,
      "default": 0
    },
    {
      "index": 9,
      "symbol": "slew",
      "name": "Slew",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 150,
      "default": 1
    },
    {
      "index": 10,
      "symbol": "sidech",
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
      "index": 11,
      "symbol": "gr",
      "name": "Gain Reduction",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 20,
      "default": null
    },
    {
      "index": 12,
      "symbol": "outlevel",
      "name": "Output Level",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -45,
      "max": 20,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./ZamComp.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
