export { default } from './MDA_Piano.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Piano",
  "label": "MDA_Piano",
  "name": "MDA Piano",
  "exportName": "createMDA_PianoPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "env_decay",
      "name": "Envelope Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 50
    },
    {
      "index": 1,
      "symbol": "env_release",
      "name": "Envelope Release",
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
      "symbol": "hardness_offset",
      "name": "Hardness Offset",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -50,
      "max": 50,
      "default": 0
    },
    {
      "index": 3,
      "symbol": "vel_to_hardness",
      "name": "Velocity to Hardness",
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
      "symbol": "muffling_filter",
      "name": "Muffling Filter",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 80.3
    },
    {
      "index": 5,
      "symbol": "vel_to_muffling",
      "name": "Velocity to Muffling",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 25.1
    },
    {
      "index": 6,
      "symbol": "vel_sensitivity",
      "name": "Velocity Sensitivity",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 37.6
    },
    {
      "index": 7,
      "symbol": "stereo_width",
      "name": "Stereo Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 200,
      "default": 100
    },
    {
      "index": 8,
      "symbol": "polyphony",
      "name": "Polyphony",
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
          "label": "8 voices",
          "value": 0
        },
        {
          "label": "32 voices",
          "value": 1
        }
      ]
    },
    {
      "index": 9,
      "symbol": "fine_tuning",
      "name": "Fine Tuning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -50,
      "max": 50,
      "default": 0
    },
    {
      "index": 10,
      "symbol": "random_detuning",
      "name": "Random Detuning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 50,
      "default": 12.3
    },
    {
      "index": 11,
      "symbol": "stretch_tuning",
      "name": "Stretch Tuning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -50,
      "max": 50,
      "default": 0
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
    },
    {
      "index": 14,
      "symbol": "event_in",
      "name": "Event In",
      "dir": "input",
      "type": "midi",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./MDA_Piano.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
