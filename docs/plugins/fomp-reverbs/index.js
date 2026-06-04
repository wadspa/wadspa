export { default } from './reverb.js';
export const meta         = {
  "uri": "http://drobilla.net/plugins/fomp/reverb",
  "label": "reverb",
  "name": "reverb",
  "exportName": "createreverbPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "in_l",
      "name": "In L",
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
      "symbol": "in_r",
      "name": "In R",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 2,
      "symbol": "out_l",
      "name": "Out L",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 3,
      "symbol": "out_r",
      "name": "Out R",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 4,
      "symbol": "delay",
      "name": "Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.02,
      "max": 0.1,
      "default": 0.06
    },
    {
      "index": 5,
      "symbol": "xover",
      "name": "Xover",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 50,
      "max": 1000,
      "default": 223.607,
      "logarithmic": true
    },
    {
      "index": 6,
      "symbol": "rt_low",
      "name": "RT-low",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 8,
      "default": 2.75
    },
    {
      "index": 7,
      "symbol": "rt_mid",
      "name": "RT-mid",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1,
      "max": 8,
      "default": 2.75
    },
    {
      "index": 8,
      "symbol": "damping",
      "name": "Damping",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1500,
      "max": 24000,
      "default": 6000,
      "logarithmic": true
    },
    {
      "index": 9,
      "symbol": "f1_freq",
      "name": "F1-freq",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 40,
      "max": 10000,
      "default": 159.054,
      "logarithmic": true
    },
    {
      "index": 10,
      "symbol": "f1_gain",
      "name": "F1-gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 20,
      "default": 0
    },
    {
      "index": 11,
      "symbol": "f2_freq",
      "name": "F2-freq",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 40,
      "max": 10000,
      "default": 2514.87,
      "logarithmic": true
    },
    {
      "index": 12,
      "symbol": "f2_gain",
      "name": "F2-gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -20,
      "max": 20,
      "default": 0
    },
    {
      "index": 13,
      "symbol": "out_mix",
      "name": "Output mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    }
  ]
};
export const wasmUrl      = new URL('./reverb.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
