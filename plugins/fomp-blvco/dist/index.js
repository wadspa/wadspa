export { default } from './Pulse_VCO.js';
export const meta         = {
  "uri": "http://drobilla.net/plugins/fomp/pulse_vco",
  "label": "Pulse_VCO",
  "name": "Pulse VCO",
  "exportName": "createPulse_VCOPlugin",
  "ports": [
    {
      "index": 0,
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
      "index": 1,
      "symbol": "freq",
      "name": "Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": true,
      "min": 0.000001,
      "max": 1,
      "default": 440,
      "sampleRate": true,
      "logarithmic": true
    },
    {
      "index": 2,
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
      "index": 3,
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
      "index": 4,
      "symbol": "octave",
      "name": "Octave",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -4,
      "max": 4,
      "default": 0,
      "integer": true
    },
    {
      "index": 5,
      "symbol": "tune",
      "name": "Tune",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 6,
      "symbol": "exp_fm_gain",
      "name": "Exp FM gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 0
    },
    {
      "index": 7,
      "symbol": "lin_fm_gain",
      "name": "Lin FM gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 0
    },
    {
      "index": 8,
      "symbol": "lp_filter",
      "name": "LP filter",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    }
  ]
};
export const wasmUrl      = new URL('./Pulse_VCO.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
