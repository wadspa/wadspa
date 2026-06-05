export { default } from './TAP_Stereo_Dynamics.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/dynamics-st",
  "label": "TAP_Stereo_Dynamics",
  "name": "TAP Stereo Dynamics",
  "exportName": "createTAP_Stereo_DynamicsPlugin",
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
      "symbol": "releaseM",
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
      "symbol": "lenvelope",
      "name": "Left Envelope Volume",
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
      "symbol": "renvelope",
      "name": "Right Envelope Volume",
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
      "symbol": "lgain",
      "name": "Left Gain Adjustment",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 20,
      "default": 0
    },
    {
      "index": 7,
      "symbol": "rgain",
      "name": "Right Gain Adjustment",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 20,
      "default": 0
    },
    {
      "index": 8,
      "symbol": "stereo",
      "name": "Stereo Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Independent",
          "value": 0
        },
        {
          "label": "Average",
          "value": 1
        },
        {
          "label": "Peak",
          "value": 2
        }
      ]
    },
    {
      "index": 9,
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
      "index": 10,
      "symbol": "inl",
      "name": "Input Left",
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
      "symbol": "inr",
      "name": "Input Right",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 12,
      "symbol": "outl",
      "name": "Output Left",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 13,
      "symbol": "outr",
      "name": "Output Right",
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
export const wasmUrl      = new URL('./TAP_Stereo_Dynamics.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
