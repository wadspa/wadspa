export { default } from './MDA_Delay.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Delay",
  "label": "MDA_Delay",
  "name": "MDA Delay",
  "exportName": "createMDA_DelayPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "l_delay",
      "name": "L Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 330,
      "default": 250
    },
    {
      "index": 1,
      "symbol": "rl_delay",
      "name": "R/L Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 1
    },
    {
      "index": 2,
      "symbol": "rl_fixed_ratios",
      "name": "R Delay Fixed Ratios",
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
          "label": "Free",
          "value": 0
        },
        {
          "label": "Fixed",
          "value": 1
        }
      ]
    },
    {
      "index": 3,
      "symbol": "feedback",
      "name": "Feedback",
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
      "symbol": "fb_tone",
      "name": "Fb Tone\\nLo<>Hi",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 5,
      "symbol": "fx_mix",
      "name": "FX Mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 33
    },
    {
      "index": 6,
      "symbol": "output",
      "name": "Output",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -12,
      "max": 6,
      "default": 0,
      "scalePoints": [
        {
          "label": "OFF",
          "value": 0
        }
      ]
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
export const wasmUrl      = new URL('./MDA_Delay.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
