export { default } from './MDA_RoundPan.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/RoundPan",
  "label": "MDA_RoundPan",
  "name": "MDA RoundPan",
  "exportName": "createMDA_RoundPanPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "pan",
      "name": "Pan",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -180,
      "max": 180,
      "default": 0
    },
    {
      "index": 1,
      "symbol": "auto",
      "name": "Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -515,
      "max": 515,
      "default": 309
    },
    {
      "index": 2,
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
      "index": 3,
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
      "index": 4,
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
      "index": 5,
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
export const wasmUrl      = new URL('./MDA_RoundPan.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
