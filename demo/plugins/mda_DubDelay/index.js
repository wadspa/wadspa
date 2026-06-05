export { default } from './MDA_DubDelay.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/DubDelay",
  "label": "MDA_DubDelay",
  "name": "MDA DubDelay",
  "exportName": "createMDA_DubDelayPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "delay",
      "name": "Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 7500,
      "default": 460,
      "logarithmic": true
    },
    {
      "index": 1,
      "symbol": "feedback",
      "name": "Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -110,
      "max": 110,
      "default": 55
    },
    {
      "index": 2,
      "symbol": "fb_tone",
      "name": "Fb Tone",
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
      "symbol": "lfo_depth",
      "name": "LFO Depth",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 30
    },
    {
      "index": 4,
      "symbol": "lfo_rate",
      "name": "LFO Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.01,
      "max": 10,
      "default": 0.05
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
      "default": 50
    },
    {
      "index": 6,
      "symbol": "output",
      "name": "Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -12,
      "max": 6,
      "default": 0
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
export const wasmUrl      = new URL('./MDA_DubDelay.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
