export { default } from './MDA_Vocoder.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Vocoder",
  "label": "MDA_Vocoder",
  "name": "MDA Vocoder",
  "exportName": "createMDA_VocoderPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "mod_in",
      "name": "Swap carrier-modulator",
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
          "label": "Left",
          "value": 0
        },
        {
          "label": "Right",
          "value": 1
        }
      ]
    },
    {
      "index": 1,
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
      "index": 2,
      "symbol": "hi_thru",
      "name": "Hi Thru",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 40
    },
    {
      "index": 3,
      "symbol": "hi_band",
      "name": "Hi Band",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 40
    },
    {
      "index": 4,
      "symbol": "envelope",
      "name": "Envelope",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 14,
      "max": 10000,
      "default": 1602.24,
      "logarithmic": true,
      "scalePoints": [
        {
          "label": "FREEZE",
          "value": 14
        }
      ]
    },
    {
      "index": 5,
      "symbol": "filter_q",
      "name": "Filter Q",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 55
    },
    {
      "index": 6,
      "symbol": "mid_freq",
      "name": "Mid Freq",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 200,
      "max": 1600,
      "default": 1000,
      "logarithmic": true
    },
    {
      "index": 7,
      "symbol": "quality",
      "name": "Quality",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "8 BAND",
          "value": 0
        },
        {
          "label": "16 BAND",
          "value": 1
        }
      ]
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
export const wasmUrl      = new URL('./MDA_Vocoder.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
