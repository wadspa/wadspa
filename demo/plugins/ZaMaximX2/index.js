export { default } from './ZaMaximX2.js';
export const meta         = {
  "uri": "urn:zamaudio:ZaMaximX2",
  "label": "ZaMaximX2",
  "name": "ZaMaximX2",
  "exportName": "createZaMaximX2Plugin",
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
      "symbol": "lv2_audio_in_2",
      "name": "Audio Input 2",
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
      "symbol": "lv2_audio_out_2",
      "name": "Audio Output 2",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 4,
      "symbol": "lv2_latency",
      "name": "Latency",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null,
      "integer": true
    },
    {
      "index": 5,
      "symbol": "rel",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 100,
      "default": 25,
      "logarithmic": true
    },
    {
      "index": 6,
      "symbol": "gain",
      "name": "Input Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 20,
      "default": 0
    },
    {
      "index": 7,
      "symbol": "thresh",
      "name": "Threshold",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -30,
      "max": 0,
      "default": 0
    },
    {
      "index": 8,
      "symbol": "gr",
      "name": "Gain Reduction",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 40,
      "default": null
    },
    {
      "index": 9,
      "symbol": "outlevel",
      "name": "Output Level",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -45,
      "max": 0,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./ZaMaximX2.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
