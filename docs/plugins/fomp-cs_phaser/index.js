export { default } from './CS_Phaser_1.js';
export const meta         = {
  "uri": "http://drobilla.net/plugins/fomp/cs_phaser1",
  "label": "CS_Phaser_1",
  "name": "CS Phaser 1",
  "exportName": "createCS_Phaser_1Plugin",
  "ports": [
    {
      "index": 0,
      "symbol": "in",
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
      "index": 1,
      "symbol": "out",
      "name": "Output",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 2,
      "symbol": "fm",
      "name": "FM",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": true,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 3,
      "symbol": "exp_fm",
      "name": "Exp FM",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": true,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 4,
      "symbol": "lin_fm",
      "name": "Lin FM",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": true,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 5,
      "symbol": "in_gain",
      "name": "Input gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -40,
      "max": 10,
      "default": 0
    },
    {
      "index": 6,
      "symbol": "sections",
      "name": "Sections",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 30,
      "default": 1,
      "integer": true
    },
    {
      "index": 7,
      "symbol": "freq",
      "name": "Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -6,
      "max": 6,
      "default": 0
    },
    {
      "index": 8,
      "symbol": "exp_fm_gain",
      "name": "Exp FM gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 0
    },
    {
      "index": 9,
      "symbol": "lin_fm_gain",
      "name": "Lin FM gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 0
    },
    {
      "index": 10,
      "symbol": "fb_gain",
      "name": "Feedback gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 11,
      "symbol": "out_mix",
      "name": "Output mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    }
  ]
};
export const wasmUrl      = new URL('./CS_Phaser_1.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
