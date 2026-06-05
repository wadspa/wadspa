export { default } from './MDA_Degrade.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Degrade",
  "label": "MDA_Degrade",
  "name": "MDA Degrade",
  "exportName": "createMDA_DegradePlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "headroom",
      "name": "Headroom",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -30,
      "max": 0,
      "default": -6
    },
    {
      "index": 1,
      "symbol": "quant",
      "name": "Quant",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 4,
      "max": 16,
      "default": 10,
      "integer": true
    },
    {
      "index": 2,
      "symbol": "rate",
      "name": "Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 4800,
      "max": 48000,
      "default": 48000,
      "integer": true,
      "logarithmic": true
    },
    {
      "index": 3,
      "symbol": "integrator_sr",
      "name": "Integrator",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Integrator Off",
          "value": 0
        },
        {
          "label": "Integrator On",
          "value": 1
        }
      ]
    },
    {
      "index": 4,
      "symbol": "post_filt",
      "name": "Post Filter",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 200,
      "max": 20000,
      "default": 15000,
      "integer": true,
      "logarithmic": true
    },
    {
      "index": 5,
      "symbol": "non_lin",
      "name": "Non-Lin",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.16
    },
    {
      "index": 6,
      "symbol": "even_odd",
      "name": "EvenOdd",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Even",
          "value": 0
        },
        {
          "label": "Odd",
          "value": 1
        }
      ]
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
export const wasmUrl      = new URL('./MDA_Degrade.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
