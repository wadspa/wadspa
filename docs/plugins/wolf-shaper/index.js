export { default } from './Wolf_Shaper.js';
export const meta         = {
  "uri": "https://github.com/pdesaulniers/wolf-shaper",
  "label": "Wolf_Shaper",
  "name": "Wolf Shaper",
  "exportName": "createWolf_ShaperPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "lv2_audio_in_1",
      "name": "Audio Input 1",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 1,
      "symbol": "lv2_audio_in_2",
      "name": "Audio Input 2",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 2,
      "symbol": "lv2_audio_out_1",
      "name": "Audio Output 1",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 3,
      "symbol": "lv2_audio_out_2",
      "name": "Audio Output 2",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 4,
      "symbol": "lv2_events_in",
      "name": "Events Input",
      "dir": "input",
      "type": "atom",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 5,
      "symbol": "lv2_events_out",
      "name": "Events Output",
      "dir": "output",
      "type": "atom",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 6,
      "symbol": "pregain",
      "name": "Pre Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 1
    },
    {
      "index": 7,
      "symbol": "wet",
      "name": "Wet",
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
      "symbol": "postgain",
      "name": "Post Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 9,
      "symbol": "removedc",
      "name": "Remove DC Offset",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true
    },
    {
      "index": 10,
      "symbol": "oversample",
      "name": "Oversample",
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
          "label": "2x",
          "value": 1
        },
        {
          "label": "4x",
          "value": 2
        },
        {
          "label": "8x",
          "value": 3
        },
        {
          "label": "16x",
          "value": 4
        }
      ]
    },
    {
      "index": 11,
      "symbol": "bipolarmode",
      "name": "Bipolar Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "toggled": true,
      "scalePoints": [
        {
          "label": "Unipolar",
          "value": 0
        },
        {
          "label": "Bipolar",
          "value": 1
        }
      ]
    },
    {
      "index": 12,
      "symbol": "warptype",
      "name": "H Warp Type",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 6,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "None",
          "value": 0
        },
        {
          "label": "Bend +",
          "value": 1
        },
        {
          "label": "Bend -",
          "value": 2
        },
        {
          "label": "Bend +/-",
          "value": 3
        },
        {
          "label": "Skew +",
          "value": 4
        },
        {
          "label": "Skew -",
          "value": 5
        },
        {
          "label": "Skew +/-",
          "value": 6
        }
      ]
    },
    {
      "index": 13,
      "symbol": "warpamount",
      "name": "H Warp Amount",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 14,
      "symbol": "vwarptype",
      "name": "V Warp Type",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 6,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "None",
          "value": 0
        },
        {
          "label": "Bend +",
          "value": 1
        },
        {
          "label": "Bend -",
          "value": 2
        },
        {
          "label": "Bend +/-",
          "value": 3
        },
        {
          "label": "Skew +",
          "value": 4
        },
        {
          "label": "Skew -",
          "value": 5
        },
        {
          "label": "Skew +/-",
          "value": 6
        }
      ]
    },
    {
      "index": 15,
      "symbol": "vwarpamount",
      "name": "V Warp Amount",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 16,
      "symbol": "out",
      "name": "Out",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./Wolf_Shaper.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
