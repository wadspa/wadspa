export { default } from './MDA_TalkBox.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/TalkBox",
  "label": "MDA_TalkBox",
  "name": "MDA TalkBox",
  "exportName": "createMDA_TalkBoxPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "wet",
      "name": "Wet",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 200,
      "default": 100
    },
    {
      "index": 1,
      "symbol": "dry",
      "name": "Dry",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 200,
      "default": 0
    },
    {
      "index": 2,
      "symbol": "carrier",
      "name": "Carrier",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Right",
          "value": 0
        },
        {
          "label": "Left",
          "value": 1
        }
      ]
    },
    {
      "index": 3,
      "symbol": "quality",
      "name": "Quality",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 5,
      "max": 100,
      "default": 100
    },
    {
      "index": 4,
      "symbol": "left_in",
      "name": "Left In",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 5,
      "symbol": "right_in",
      "name": "Right In",
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
      "symbol": "left_out",
      "name": "Left Out",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 7,
      "symbol": "right_out",
      "name": "Right Out",
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
export const wasmUrl      = new URL('./MDA_TalkBox.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
