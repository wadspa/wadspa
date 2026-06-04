export { default } from './ZamTube.js';
export const meta         = {
  "uri": "urn:zamaudio:ZamTube",
  "label": "ZamTube",
  "name": "ZamTube",
  "exportName": "createZamTubePlugin",
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
      "symbol": "tubedrive",
      "name": "Tube Drive",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.10000000149,
      "max": 11,
      "default": 0.10000000149
    },
    {
      "index": 3,
      "symbol": "bass",
      "name": "Bass",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 5
    },
    {
      "index": 4,
      "symbol": "mids",
      "name": "Mids",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 5
    },
    {
      "index": 5,
      "symbol": "treb",
      "name": "Treble",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 5
    },
    {
      "index": 6,
      "symbol": "tonestack",
      "name": "Tone Stack Model",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 24,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "1959 Bassman 5F6-A",
          "value": 0
        }
      ]
    },
    {
      "index": 7,
      "symbol": "gain",
      "name": "Input level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -30,
      "max": 30,
      "default": 0
    },
    {
      "index": 8,
      "symbol": "insane",
      "name": "Insane Boost",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    }
  ]
};
export const wasmUrl      = new URL('./ZamTube.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
