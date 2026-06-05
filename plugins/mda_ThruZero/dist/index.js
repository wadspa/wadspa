export { default } from './MDA_ThruZero.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/ThruZero",
  "label": "MDA_ThruZero",
  "name": "MDA ThruZero",
  "exportName": "createMDA_ThruZeroPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "rate",
      "name": "Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.01,
      "max": 10,
      "default": 0.08,
      "logarithmic": true,
      "scalePoints": [
        {
          "label": "-",
          "value": 0.01
        }
      ]
    },
    {
      "index": 1,
      "symbol": "depth",
      "name": "Depth",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 42,
      "default": 20
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
      "default": 47
    },
    {
      "index": 3,
      "symbol": "feedback",
      "name": "Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -100,
      "max": 100,
      "default": -40
    },
    {
      "index": 4,
      "symbol": "depth_mod",
      "name": "Depth Mod",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 100
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
export const wasmUrl      = new URL('./MDA_ThruZero.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
