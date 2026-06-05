export { default } from './MDA_Dynamics.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Dynamics",
  "label": "MDA_Dynamics",
  "name": "MDA Dynamics",
  "exportName": "createMDA_DynamicsPlugin",
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
      "symbol": "ratio",
      "name": "Ratio",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -17,
      "max": 0.5,
      "default": -10
    },
    {
      "index": 2,
      "symbol": "output",
      "name": "Output",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 40,
      "default": 4
    },
    {
      "index": 3,
      "symbol": "attack",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 2,
      "max": 1571,
      "default": 283.14,
      "logarithmic": true
    },
    {
      "index": 4,
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 1571,
      "default": 864.6,
      "logarithmic": true
    },
    {
      "index": 5,
      "symbol": "limiter",
      "name": "Limiter",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 10,
      "default": 10,
      "scalePoints": [
        {
          "label": "OFF",
          "value": 10
        }
      ]
    },
    {
      "index": 6,
      "symbol": "gate_thr",
      "name": "Gate Thr",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 0,
      "default": -60,
      "scalePoints": [
        {
          "label": "OFF",
          "value": -60
        }
      ]
    },
    {
      "index": 7,
      "symbol": "gate_att",
      "name": "Gate Att",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 5,
      "max": 15782,
      "default": 5,
      "logarithmic": true
    },
    {
      "index": 8,
      "symbol": "gate_rel",
      "name": "Gate Rel",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 9,
      "max": 17384,
      "default": 173.93,
      "logarithmic": true
    },
    {
      "index": 9,
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
      "index": 10,
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
      "index": 11,
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
      "index": 12,
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
      "index": 13,
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
export const wasmUrl      = new URL('./MDA_Dynamics.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
