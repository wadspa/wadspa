export { default } from './MDA_RezFilter.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/RezFilter",
  "label": "MDA_RezFilter",
  "name": "MDA RezFilter",
  "exportName": "createMDA_RezFilterPlugin",
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
      "max": 100,
      "default": 33
    },
    {
      "index": 1,
      "symbol": "res",
      "name": "Res",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 70
    },
    {
      "index": 2,
      "symbol": "output",
      "name": "Output",
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
      "symbol": "env_vcf",
      "name": "Env->VCF",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -100,
      "max": 100,
      "default": 70
    },
    {
      "index": 4,
      "symbol": "attack",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 160.83,
      "default": 0
    },
    {
      "index": 5,
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 1.56,
      "max": 15511.64,
      "default": 7250
    },
    {
      "index": 6,
      "symbol": "lfo_vcf",
      "name": "LFO->VCF",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -100,
      "max": 100,
      "default": 40
    },
    {
      "index": 7,
      "symbol": "lfo_rate",
      "name": "LFO Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.01,
      "max": 100,
      "default": 40
    },
    {
      "index": 8,
      "symbol": "trigger",
      "name": "Trigger",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -37,
      "max": 3,
      "default": -37,
      "scalePoints": [
        {
          "label": "FREE RUN",
          "value": -37
        }
      ]
    },
    {
      "index": 9,
      "symbol": "max_freq",
      "name": "Max Freq",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 75
    },
    {
      "index": 10,
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
      "index": 11,
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
      "index": 12,
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
      "index": 13,
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
export const wasmUrl      = new URL('./MDA_RezFilter.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
