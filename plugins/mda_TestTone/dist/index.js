export { default } from './MDA_TestTone.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/TestTone",
  "label": "MDA_TestTone",
  "name": "MDA TestTone",
  "exportName": "createMDA_TestTonePlugin",
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
          "label": "MIDI #",
          "value": 0
        },
        {
          "label": "Impulse",
          "value": 0.14
        },
        {
          "label": "White",
          "value": 0.28
        },
        {
          "label": "Pink",
          "value": 0.42
        },
        {
          "label": "Sine",
          "value": 0.57
        },
        {
          "label": "Log Sweep",
          "value": 0.71
        },
        {
          "label": "Log Step",
          "value": 0.85
        },
        {
          "label": "Lin Sweep",
          "value": 1
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
      "max": 1,
      "default": 0.71
    },
    {
      "index": 2,
      "symbol": "channel",
      "name": "Channel",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 3,
      "symbol": "f1",
      "name": "F1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.57
    },
    {
      "index": 4,
      "symbol": "f2",
      "name": "F2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 5,
      "symbol": "sweep",
      "name": "Sweep",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.3
    },
    {
      "index": 6,
      "symbol": "thru",
      "name": "Thru",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 7,
      "symbol": "zero_db",
      "name": "Zero dB",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
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
export const wasmUrl      = new URL('./MDA_TestTone.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
