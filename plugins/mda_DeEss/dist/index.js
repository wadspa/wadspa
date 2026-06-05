export { default } from './MDA_Deess.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/DeEss",
  "label": "MDA_Deess",
  "name": "MDA De-ess",
  "exportName": "createMDA_DeessPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "thresh",
      "name": "Thresh",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 0,
      "default": -30
    },
    {
      "index": 1,
      "symbol": "freq",
      "name": "Freq",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1000,
      "max": 12000,
      "default": 7600,
      "logarithmic": true
    },
    {
      "index": 2,
      "symbol": "hf_drive",
      "name": "HF Drive",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 20,
      "default": 0
    },
    {
      "index": 3,
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
      "index": 4,
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
      "index": 5,
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
      "index": 6,
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
export const wasmUrl      = new URL('./MDA_Deess.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
