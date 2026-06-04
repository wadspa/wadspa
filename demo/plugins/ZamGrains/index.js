export { default } from './ZamGrains.js';
export const meta         = {
  "uri": "urn:zamaudio:ZamGrains",
  "label": "ZamGrains",
  "name": "ZamGrains",
  "exportName": "createZamGrainsPlugin",
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
      "index": 2,
      "symbol": "gain",
      "name": "Output Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 0,
      "default": 0
    },
    {
      "index": 3,
      "symbol": "grains",
      "name": "Grains",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 100,
      "default": 1,
      "integer": true
    },
    {
      "index": 4,
      "symbol": "gs",
      "name": "Grain Speed",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.10000000149,
      "max": 20,
      "default": 1,
      "logarithmic": true
    },
    {
      "index": 5,
      "symbol": "ps",
      "name": "Play Speed",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.10000000149,
      "max": 20,
      "default": 1,
      "logarithmic": true
    },
    {
      "index": 6,
      "symbol": "time",
      "name": "Loop time",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 5,
      "max": 1000,
      "default": 160
    },
    {
      "index": 7,
      "symbol": "freeze",
      "name": "Freeze",
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
      "symbol": "grpos",
      "name": "Grain Position",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": null
    },
    {
      "index": 9,
      "symbol": "playpos",
      "name": "Playback Position",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": null
    },
    {
      "index": 10,
      "symbol": "finalpos",
      "name": "Final Position",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./ZamGrains.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
