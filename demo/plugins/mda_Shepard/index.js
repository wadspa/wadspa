export { default } from './MDA_Shepard.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Shepard",
  "label": "MDA_Shepard",
  "name": "MDA Shepard",
  "exportName": "createMDA_ShepardPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "mode",
      "name": "Mode",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 1,
      "symbol": "rate",
      "name": "Rate",
      "dir": "input",
      "type": "control",
      "min": -100,
      "max": 100,
      "default": -30
    },
    {
      "index": 2,
      "symbol": "output",
      "name": "Output",
      "dir": "input",
      "type": "control",
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
      "min": null,
      "max": null,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./MDA_Shepard.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
