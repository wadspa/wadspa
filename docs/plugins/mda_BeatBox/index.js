export { default } from './MDA_BeatBox.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/BeatBox",
  "label": "MDA_BeatBox",
  "name": "MDA BeatBox",
  "exportName": "createMDA_BeatBoxPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "hat_thr",
      "name": "Hat Thr",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -40,
      "max": 0,
      "default": -38
    },
    {
      "index": 1,
      "symbol": "hat_rate",
      "name": "Hat Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 40,
      "max": 240,
      "default": 130,
      "logarithmic": true
    },
    {
      "index": 2,
      "symbol": "hat_mix",
      "name": "Hat Mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -24,
      "max": 12,
      "default": 0
    },
    {
      "index": 3,
      "symbol": "kik_thr",
      "name": "Kik Thr",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -40,
      "max": 0,
      "default": -20
    },
    {
      "index": 4,
      "symbol": "kik_trig",
      "name": "Kik Trig",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 25,
      "max": 12000,
      "default": 110,
      "logarithmic": true
    },
    {
      "index": 5,
      "symbol": "kik_mix",
      "name": "Kik Mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -24,
      "max": 12,
      "default": 0
    },
    {
      "index": 6,
      "symbol": "snr_thr",
      "name": "Snr Thr",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -40,
      "max": 0,
      "default": -20
    },
    {
      "index": 7,
      "symbol": "snr_trig",
      "name": "Snr Trig",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 25,
      "max": 12000,
      "default": 880,
      "logarithmic": true
    },
    {
      "index": 8,
      "symbol": "snr_mix",
      "name": "Snr Mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -24,
      "max": 12,
      "default": 0
    },
    {
      "index": 9,
      "symbol": "dynamics",
      "name": "Dynamics",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 100,
      "default": 50
    },
    {
      "index": 10,
      "symbol": "record",
      "name": "Record",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "None",
          "value": 0
        },
        {
          "label": "Monitor Input",
          "value": 1
        },
        {
          "label": "Record Hat",
          "value": 2
        },
        {
          "label": "Record Kick",
          "value": 3
        },
        {
          "label": "Record Snare",
          "value": 4
        }
      ]
    },
    {
      "index": 11,
      "symbol": "thru_mix",
      "name": "Thru Mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -45,
      "max": 0,
      "default": -45,
      "scalePoints": [
        {
          "label": "OFF",
          "value": -45
        }
      ]
    },
    {
      "index": 12,
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
      "index": 13,
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
      "index": 14,
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
      "index": 15,
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
export const wasmUrl      = new URL('./MDA_BeatBox.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
