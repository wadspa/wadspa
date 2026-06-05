export { default } from './MDA_Splitter.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Splitter",
  "label": "MDA_Splitter",
  "name": "MDA Splitter",
  "exportName": "createMDA_SplitterPlugin",
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
          "label": "Normal",
          "value": 0
        },
        {
          "label": "Inverse",
          "value": 0.33333333
        },
        {
          "label": "Normal Inverse",
          "value": 0.66666666
        },
        {
          "label": "Inverse Normal",
          "value": 1
        }
      ]
    },
    {
      "index": 1,
      "symbol": "freq",
      "name": "Freq",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 100,
      "max": 10000,
      "default": 5050,
      "logarithmic": true
    },
    {
      "index": 2,
      "symbol": "freq_sw",
      "name": "Freq SW",
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
          "label": "Low",
          "value": 0
        },
        {
          "label": "All",
          "value": 0.5
        },
        {
          "label": "High",
          "value": 1
        }
      ]
    },
    {
      "index": 3,
      "symbol": "level",
      "name": "Level",
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
      "symbol": "level_sw",
      "name": "Level SW",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Low",
          "value": 0
        },
        {
          "label": "All",
          "value": 0.5
        },
        {
          "label": "High",
          "value": 1
        }
      ]
    },
    {
      "index": 5,
      "symbol": "envelope",
      "name": "Envelope",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 10,
      "max": 1000,
      "default": 505
    },
    {
      "index": 6,
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
export const wasmUrl      = new URL('./MDA_Splitter.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
