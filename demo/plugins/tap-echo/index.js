export { default } from './TAP_Stereo_Echo.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/echo",
  "label": "TAP_Stereo_Echo",
  "name": "TAP Stereo Echo",
  "exportName": "createTAP_Stereo_EchoPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "ldelay",
      "name": "L Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2000,
      "default": 300
    },
    {
      "index": 1,
      "symbol": "lfeedback",
      "name": "Left Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 50
    },
    {
      "index": 2,
      "symbol": "rhaasdelay",
      "name": "Right Haas Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2000,
      "default": 300
    },
    {
      "index": 3,
      "symbol": "rhaasfeedback",
      "name": "Right Haas Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 50
    },
    {
      "index": 4,
      "symbol": "lecholevel",
      "name": "Left Echo Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -70,
      "max": 10,
      "default": -4
    },
    {
      "index": 5,
      "symbol": "recholevel",
      "name": "Right Echo Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -70,
      "max": 10,
      "default": -4
    },
    {
      "index": 6,
      "symbol": "dryLevel",
      "name": "Dry Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -70,
      "max": 10,
      "default": -4
    },
    {
      "index": 7,
      "symbol": "crossmode",
      "name": "Cross Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "toggled": true
    },
    {
      "index": 8,
      "symbol": "haaseffect",
      "name": "Haas Effect",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 9,
      "symbol": "swapoutputs",
      "name": "Swap Outputs",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 10,
      "symbol": "inputleft",
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
      "symbol": "outputleft",
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
      "index": 12,
      "symbol": "inputright",
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
      "index": 13,
      "symbol": "outputright",
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
export const wasmUrl      = new URL('./TAP_Stereo_Echo.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
