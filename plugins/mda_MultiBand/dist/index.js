export { default } from './MDA_MultiBand.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/MultiBand",
  "label": "MDA_MultiBand",
  "name": "MDA MultiBand",
  "exportName": "createMDA_MultiBandPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "listen",
      "name": "Listen",
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
          "label": "Mid",
          "value": 0.33333333
        },
        {
          "label": "High",
          "value": 0.66666666
        },
        {
          "label": "Output",
          "value": 1
        }
      ]
    },
    {
      "index": 1,
      "symbol": "l_m",
      "name": "L <> M",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 87,
      "max": 1020,
      "default": 110.7,
      "logarithmic": true
    },
    {
      "index": 2,
      "symbol": "m_h",
      "name": "M <> H",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 111,
      "max": 19606,
      "default": 17153.79,
      "logarithmic": true
    },
    {
      "index": 3,
      "symbol": "l_comp",
      "name": "L Comp",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 30,
      "default": 15
    },
    {
      "index": 4,
      "symbol": "m_comp",
      "name": "M Comp",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 30,
      "default": 0
    },
    {
      "index": 5,
      "symbol": "h_comp",
      "name": "H Comp",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 30,
      "default": 18
    },
    {
      "index": 6,
      "symbol": "l_out",
      "name": "L Out",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 20,
      "default": -2
    },
    {
      "index": 7,
      "symbol": "m_out",
      "name": "M Out",
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
      "symbol": "h_out",
      "name": "H Out",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 20,
      "default": 0
    },
    {
      "index": 9,
      "symbol": "attack",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 7,
      "max": 1755,
      "default": 387.64
    },
    {
      "index": 10,
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 1571,
      "default": 946.344
    },
    {
      "index": 11,
      "symbol": "stereo",
      "name": "Stereo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 200,
      "default": 110
    },
    {
      "index": 12,
      "symbol": "process",
      "name": "Process",
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
      "index": 13,
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
      "index": 14,
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
      "index": 15,
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
      "index": 16,
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
export const wasmUrl      = new URL('./MDA_MultiBand.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
