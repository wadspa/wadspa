export { default } from './MDA_Limiter.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Limiter",
  "label": "MDA_Limiter",
  "name": "MDA Limiter",
  "exportName": "createMDA_LimiterPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "thresh",
      "name": "Thresh",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -40,
      "max": 0,
      "default": -16
    },
    {
      "index": 1,
      "symbol": "output",
      "name": "Output",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 20,
      "default": 4
    },
    {
      "index": 2,
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 1571,
      "default": 758.5
    },
    {
      "index": 3,
      "symbol": "attack",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1563,
      "default": 234.45
    },
    {
      "index": 4,
      "symbol": "knee",
      "name": "Knee",
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
          "label": "Hard",
          "value": 0
        },
        {
          "label": "Soft",
          "value": 1
        }
      ]
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
export const wasmUrl      = new URL('./MDA_Limiter.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
