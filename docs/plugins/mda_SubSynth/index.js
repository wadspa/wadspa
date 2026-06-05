export { default } from './MDA_SubSynth.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/SubSynth",
  "label": "MDA_SubSynth",
  "name": "MDA SubSynth",
  "exportName": "createMDA_SubSynthPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "type",
      "name": "Type",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 0.75,
      "default": 0.5,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Distort",
          "value": 0
        },
        {
          "label": "Divide",
          "value": 0.25
        },
        {
          "label": "Invert",
          "value": 0.5
        },
        {
          "label": "Key Osc.",
          "value": 0.75
        }
      ]
    },
    {
      "index": 1,
      "symbol": "level",
      "name": "Level",
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
      "symbol": "tune",
      "name": "Tune",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 10,
      "max": 320,
      "default": 198,
      "logarithmic": true
    },
    {
      "index": 3,
      "symbol": "dry_mix",
      "name": "Dry Mix",
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
      "symbol": "thresh",
      "name": "Thresh",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 0,
      "default": -60
    },
    {
      "index": 5,
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 1442,
      "default": 1
    },
    {
      "index": 6,
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
      "index": 7,
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
      "index": 8,
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
      "index": 9,
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
export const wasmUrl      = new URL('./MDA_SubSynth.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
