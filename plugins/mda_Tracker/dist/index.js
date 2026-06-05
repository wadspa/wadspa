export { default } from './MDA_Tracker.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Tracker",
  "label": "MDA_Tracker",
  "name": "MDA Tracker",
  "exportName": "createMDA_TrackerPlugin",
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
      "default": 0,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Sine oscillator",
          "value": 0
        },
        {
          "label": "Square oscillator",
          "value": 0.25
        },
        {
          "label": "Sawtooth oscillator",
          "value": 0.5
        },
        {
          "label": "Ring modulator",
          "value": 0.75
        },
        {
          "label": "Peaking EQ",
          "value": 1
        }
      ]
    },
    {
      "index": 1,
      "symbol": "dynamics",
      "name": "Dynamics",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 100
    },
    {
      "index": 2,
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
      "index": 3,
      "symbol": "glide",
      "name": "Glide",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 97
    },
    {
      "index": 4,
      "symbol": "transpose",
      "name": "Transpose",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -36,
      "max": 36,
      "default": 0
    },
    {
      "index": 5,
      "symbol": "maximum",
      "name": "Maximum",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 39,
      "max": 7350,
      "default": 6500,
      "logarithmic": true
    },
    {
      "index": 6,
      "symbol": "trigger",
      "name": "Trigger",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 0,
      "default": -30
    },
    {
      "index": 7,
      "symbol": "output",
      "name": "Output",
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
      "index": 9,
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
      "index": 10,
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
      "index": 11,
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
export const wasmUrl      = new URL('./MDA_Tracker.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
