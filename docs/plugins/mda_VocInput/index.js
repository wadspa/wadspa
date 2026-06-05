export { default } from './MDA_VocInput.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/VocInput",
  "label": "MDA_VocInput",
  "name": "MDA VocInput",
  "exportName": "createMDA_VocInputPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "tracking",
      "name": "Tracking",
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
          "label": "Constant pitch",
          "value": 0
        },
        {
          "label": "Track input pitch",
          "value": 0.5
        },
        {
          "label": "Track quantized input pitch",
          "value": 1
        }
      ]
    },
    {
      "index": 1,
      "symbol": "pitch",
      "name": "Pitch",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 2,
      "symbol": "breath",
      "name": "Breath",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 3,
      "symbol": "s_thresh",
      "name": "S Thresh",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 4,
      "symbol": "max_freq",
      "name": "Max Freq",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.35
    },
    {
      "index": 5,
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
      "index": 6,
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
      "index": 7,
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
      "index": 8,
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
export const wasmUrl      = new URL('./MDA_VocInput.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
