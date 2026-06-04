export { default } from './TAP_DeEsser.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/deesser",
  "label": "TAP_DeEsser",
  "name": "TAP DeEsser",
  "exportName": "createTAP_DeEsserPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "thresholdlevel",
      "name": "Threshold Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -50,
      "max": 10,
      "default": 0
    },
    {
      "index": 1,
      "symbol": "frequency",
      "name": "Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 2000,
      "max": 16000,
      "default": 5500
    },
    {
      "index": 2,
      "symbol": "sidechainfilter",
      "name": "Sidechain Filter",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Highpass",
          "value": 0
        },
        {
          "label": "Bandpass",
          "value": 1
        }
      ]
    },
    {
      "index": 3,
      "symbol": "monitor",
      "name": "Monitor",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Audio",
          "value": 0
        },
        {
          "label": "Sidechain",
          "value": 1
        }
      ]
    },
    {
      "index": 4,
      "symbol": "attenuation",
      "name": "Attenuation",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 0
    },
    {
      "index": 5,
      "symbol": "input",
      "name": "Input",
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
      "symbol": "output",
      "name": "Output",
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
export const wasmUrl      = new URL('./TAP_DeEsser.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
