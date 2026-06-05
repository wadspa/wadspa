export { default } from './MDA_RePsycho.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/RePsycho",
  "label": "MDA_RePsycho",
  "name": "MDA RePsycho!",
  "exportName": "createMDA_RePsychoPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "tune",
      "name": "Tune",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -24,
      "max": 0,
      "default": 0,
      "integer": true
    },
    {
      "index": 1,
      "symbol": "fine",
      "name": "Fine",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -100,
      "max": 0,
      "default": 0
    },
    {
      "index": 2,
      "symbol": "decay",
      "name": "Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -50,
      "max": 50,
      "default": 0
    },
    {
      "index": 3,
      "symbol": "thresh",
      "name": "Thresh",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -30,
      "max": 0,
      "default": -12
    },
    {
      "index": 4,
      "symbol": "hold",
      "name": "Hold",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 10,
      "max": 260,
      "default": 122.5
    },
    {
      "index": 5,
      "symbol": "mix",
      "name": "Mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 100
    },
    {
      "index": 6,
      "symbol": "quality",
      "name": "Quality",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Low",
          "value": 0
        },
        {
          "label": "High",
          "value": 1
        }
      ]
    },
    {
      "index": 7,
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
      "index": 8,
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
      "index": 9,
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
      "index": 10,
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
export const wasmUrl      = new URL('./MDA_RePsycho.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
