export { default } from './MDA_RingMod.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/RingMod",
  "label": "MDA_RingMod",
  "name": "MDA RingMod",
  "exportName": "createMDA_RingModPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "freq",
      "name": "Freq",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 16000,
      "default": 1000,
      "logarithmic": true
    },
    {
      "index": 1,
      "symbol": "fine",
      "name": "Fine",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 0
    },
    {
      "index": 2,
      "symbol": "feedback",
      "name": "Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
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
export const wasmUrl      = new URL('./MDA_RingMod.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
