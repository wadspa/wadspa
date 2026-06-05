export { default } from './MDA_Detune.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Detune",
  "label": "MDA_Detune",
  "name": "MDA Detune",
  "exportName": "createMDA_DetunePlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "detune",
      "name": "Detune",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 300,
      "default": 2.4
    },
    {
      "index": 1,
      "symbol": "mix",
      "name": "Mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 99,
      "default": 50
    },
    {
      "index": 2,
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
      "index": 3,
      "symbol": "latency",
      "name": "Latency",
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
          "label": "5.3 ms",
          "value": 0
        },
        {
          "label": "10.6 ms",
          "value": 0.25
        },
        {
          "label": "21.3 ms",
          "value": 0.5
        },
        {
          "label": "42.6 ms",
          "value": 0.75
        },
        {
          "label": "85.3 ms",
          "value": 1
        }
      ]
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
export const wasmUrl      = new URL('./MDA_Detune.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
