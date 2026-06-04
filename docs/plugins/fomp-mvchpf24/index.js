export { default } from './Moog_HighPass_Filter_1.js';
export const meta         = {
  "uri": "http://drobilla.net/plugins/fomp/mvchpf1",
  "label": "Moog_HighPass_Filter_1",
  "name": "Moog High-Pass Filter 1",
  "exportName": "createMoog_HighPass_Filter_1Plugin",
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
      "symbol": "in_gain",
      "name": "Input gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -60,
      "max": 10,
      "default": 0
    },
    {
      "index": 5,
      "symbol": "freq",
      "name": "Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.000001,
      "max": 1,
      "default": 440,
      "sampleRate": true,
      "logarithmic": true
    },
    {
      "index": 6,
      "symbol": "exp_gm_gain",
      "name": "Exp FM gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": null
    },
    {
      "index": 7,
      "symbol": "out_gain",
      "name": "Output gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -15,
      "max": 15,
      "default": 0
    }
  ]
};
export const wasmUrl      = new URL('./Moog_HighPass_Filter_1.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
