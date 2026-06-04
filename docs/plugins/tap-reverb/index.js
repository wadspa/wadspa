export { default } from './TAP_Reverberator.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/reverb",
  "label": "TAP_Reverberator",
  "name": "TAP Reverberator",
  "exportName": "createTAP_ReverberatorPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "decay",
      "name": "Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10000,
      "default": 2800
    },
    {
      "index": 1,
      "symbol": "drylevel",
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
      "index": 2,
      "symbol": "wetlevel",
      "name": "Wet Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -70,
      "max": 10,
      "default": -12
    },
    {
      "index": 3,
      "symbol": "combs_en",
      "name": "Comb Filters",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true,
      "scalePoints": [
        {
          "label": "Off",
          "value": 0
        }
      ]
    },
    {
      "index": 4,
      "symbol": "allps_en",
      "name": "Allpass Filters",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true,
      "scalePoints": [
        {
          "label": "Off",
          "value": 0
        }
      ]
    },
    {
      "index": 5,
      "symbol": "bandpass_en",
      "name": "Bandpass Filter",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true,
      "scalePoints": [
        {
          "label": "Off",
          "value": 0
        }
      ]
    },
    {
      "index": 6,
      "symbol": "stereo_enh",
      "name": "Enhanced Stereo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true,
      "scalePoints": [
        {
          "label": "Off",
          "value": 0
        }
      ]
    },
    {
      "index": 7,
      "symbol": "mode",
      "name": "Reverb Type",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 42,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "AfterBurn",
          "value": 0
        }
      ]
    },
    {
      "index": 8,
      "symbol": "inputl",
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
      "index": 9,
      "symbol": "outputl",
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
      "index": 10,
      "symbol": "inputr",
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
      "index": 11,
      "symbol": "outputr",
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
export const wasmUrl      = new URL('./TAP_Reverberator.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
