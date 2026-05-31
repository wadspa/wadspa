export { default } from './MDA_Transient.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Transient",
  "label": "MDA_Transient",
  "name": "MDA Transient",
  "exportName": "createMDA_TransientPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "attack",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "min": -100,
      "max": 100,
      "default": 50
    },
    {
      "index": 1,
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "min": -100,
      "max": 100,
      "default": 50
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
      "symbol": "filter",
      "name": "Filter",
      "dir": "input",
      "type": "control",
      "min": -10,
      "max": 10,
      "default": 0
    },
    {
      "index": 4,
      "symbol": "att_hold",
      "name": "Att Hold",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 100,
      "default": 35
    },
    {
      "index": 5,
      "symbol": "rel_hold",
      "name": "Rel Hold",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 100,
      "default": 35
    },
    {
      "index": 6,
      "symbol": "left_in",
      "name": "Left In",
      "dir": "input",
      "type": "audio",
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 7,
      "symbol": "right_in",
      "name": "Right In",
      "dir": "input",
      "type": "audio",
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 8,
      "symbol": "left_out",
      "name": "Left Out",
      "dir": "output",
      "type": "audio",
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 9,
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
export const wasmUrl      = new URL('./MDA_Transient.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
