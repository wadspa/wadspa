export { default } from './TAP_Mono_Dynamics.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/dynamics",
  "label": "TAP_Mono_Dynamics",
  "name": "TAP Mono Dynamics",
  "exportName": "createTAP_Mono_DynamicsPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "attack",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 4,
      "max": 500,
      "default": 128
    },
    {
      "index": 1,
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 4,
      "max": 1000,
      "default": 502
    },
    {
      "index": 2,
      "symbol": "offset",
      "name": "Offset Gain",
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
      "symbol": "makeup",
      "name": "Makeup Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 20,
      "default": 0
    },
    {
      "index": 4,
      "symbol": "envelope",
      "name": "Envelope Volume",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 20,
      "default": 0
    },
    {
      "index": 5,
      "symbol": "adjustment",
      "name": "Gain Adjustment",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 20,
      "default": 0
    },
    {
      "index": 6,
      "symbol": "function",
      "name": "Function",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 14,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "2:1 comp at -6 dB",
          "value": 0
        },
        {
          "label": "2:1 comp at -9 dB",
          "value": 1
        },
        {
          "label": "2:1 comp at -12 dB",
          "value": 2
        },
        {
          "label": "2:1 comp at -18 dB",
          "value": 3
        },
        {
          "label": "2.5:1 comp at -12 dB",
          "value": 4
        },
        {
          "label": "3:1 comp at -12 dB",
          "value": 5
        },
        {
          "label": "3:1 comp at -15 dB",
          "value": 6
        },
        {
          "label": "Compressor/Gate",
          "value": 7
        },
        {
          "label": "Expander",
          "value": 8
        },
        {
          "label": "Hard limiter at -6 dB",
          "value": 9
        },
        {
          "label": "Hard limiter at -12 dB",
          "value": 10
        },
        {
          "label": "Hard gate at -35 dB",
          "value": 11
        },
        {
          "label": "Soft limiter",
          "value": 12
        },
        {
          "label": "Soft knee comp/gate",
          "value": 13
        },
        {
          "label": "Soft gate below -36 dB",
          "value": 14
        }
      ]
    },
    {
      "index": 7,
      "symbol": "input",
      "name": "Input",
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
      "symbol": "output",
      "name": "Output",
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
export const wasmUrl      = new URL('./TAP_Mono_Dynamics.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
