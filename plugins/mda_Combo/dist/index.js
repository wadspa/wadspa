export { default } from './MDA_Combo.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Combo",
  "label": "MDA_Combo",
  "name": "MDA Combo",
  "exportName": "createMDA_ComboPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "model",
      "name": "Model",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 6,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "D.I. (flat frequency response)",
          "value": 0
        },
        {
          "label": "Tradtional speaker simulator",
          "value": 1
        },
        {
          "label": "Small radio speaker",
          "value": 2
        },
        {
          "label": "Small combo (close mic)",
          "value": 3
        },
        {
          "label": "Small combo (far mic)",
          "value": 4
        },
        {
          "label": "Large stack (front mic)",
          "value": 5
        },
        {
          "label": "Large stack (side mic, scooped mids)",
          "value": 6
        }
      ]
    },
    {
      "index": 1,
      "symbol": "drive",
      "name": "Drive",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -100,
      "max": 100,
      "default": 50
    },
    {
      "index": 2,
      "symbol": "bias",
      "name": "Bias",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -100,
      "max": 100,
      "default": 0
    },
    {
      "index": 3,
      "symbol": "output",
      "name": "Output",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 20,
      "default": 14
    },
    {
      "index": 4,
      "symbol": "stereo",
      "name": "Stereo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 5,
      "symbol": "hpf_freq",
      "name": "HPF Freq",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 50,
      "default": 1
    },
    {
      "index": 6,
      "symbol": "hpf_reso",
      "name": "HPF Reso",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 50
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
export const wasmUrl      = new URL('./MDA_Combo.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
