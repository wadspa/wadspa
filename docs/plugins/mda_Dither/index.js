export { default } from './MDA_Dither.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Dither",
  "label": "MDA_Dither",
  "name": "MDA Dither",
  "exportName": "createMDA_DitherPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "word_len",
      "name": "Word Len",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 8,
      "max": 24,
      "default": 16
    },
    {
      "index": 1,
      "symbol": "dither",
      "name": "Dither",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 3,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Truncation",
          "value": 0
        },
        {
          "label": "Triangular PDF dither",
          "value": 1
        },
        {
          "label": "High-pass Triangular PDF dither",
          "value": 2
        },
        {
          "label": "Second-order noise-shaped dither",
          "value": 3
        }
      ]
    },
    {
      "index": 2,
      "symbol": "dith_amp",
      "name": "Dith Amp",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 2
    },
    {
      "index": 3,
      "symbol": "dc_trim",
      "name": "DC Trim",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -2,
      "max": 2,
      "default": 0
    },
    {
      "index": 4,
      "symbol": "zoom",
      "name": "Zoom",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -80,
      "max": 0,
      "default": 0,
      "scalePoints": [
        {
          "label": "OFF",
          "value": 0
        }
      ]
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
export const wasmUrl      = new URL('./MDA_Dither.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
