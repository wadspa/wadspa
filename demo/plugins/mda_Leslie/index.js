export { default } from './MDA_Leslie.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Leslie",
  "label": "MDA_Leslie",
  "name": "MDA Leslie",
  "exportName": "createMDA_LesliePlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "mode",
      "name": "Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Stop",
          "value": 0
        },
        {
          "label": "Slow",
          "value": 0.5
        },
        {
          "label": "Fast",
          "value": 1
        }
      ]
    },
    {
      "index": 1,
      "symbol": "lo_width",
      "name": "Lo Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 50
    },
    {
      "index": 2,
      "symbol": "lo_throb",
      "name": "Lo Throb",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 60
    },
    {
      "index": 3,
      "symbol": "hi_width",
      "name": "Hi Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 70
    },
    {
      "index": 4,
      "symbol": "hi_depth",
      "name": "Hi Depth",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 70
    },
    {
      "index": 5,
      "symbol": "hi_throb",
      "name": "Hi Throb",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 70
    },
    {
      "index": 6,
      "symbol": "x_over",
      "name": "X-Over",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 150,
      "max": 1510,
      "default": 772.8
    },
    {
      "index": 7,
      "symbol": "output",
      "name": "Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 20,
      "default": 0
    },
    {
      "index": 8,
      "symbol": "speed",
      "name": "Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 200,
      "default": 100
    },
    {
      "index": 9,
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
      "index": 10,
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
      "index": 11,
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
      "index": 12,
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
export const wasmUrl      = new URL('./MDA_Leslie.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
