export { default } from './ZamDelay.js';
export const meta         = {
  "uri": "urn:zamaudio:ZamDelay",
  "label": "ZamDelay",
  "name": "ZamDelay",
  "exportName": "createZamDelayPlugin",
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
      "symbol": "lv2_events_in",
      "name": "Events Input",
      "dir": "input",
      "type": "atom",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 3,
      "symbol": "inv",
      "name": "Invert",
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
      "index": 4,
      "symbol": "time",
      "name": "Time",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 8000,
      "default": 160
    },
    {
      "index": 5,
      "symbol": "sync",
      "name": "Sync BPM",
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
      "index": 6,
      "symbol": "lpf",
      "name": "LPF",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 20,
      "max": 20000,
      "default": 6000
    },
    {
      "index": 7,
      "symbol": "div",
      "name": "Divisor",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 5,
      "default": 3,
      "integer": true
    },
    {
      "index": 8,
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
      "index": 9,
      "symbol": "drywet",
      "name": "Dry/Wet",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 10,
      "symbol": "feedb",
      "name": "Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 11,
      "symbol": "delaytime",
      "name": "Delaytime",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 8000,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./ZamDelay.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
