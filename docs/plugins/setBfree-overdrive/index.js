export { default } from './setBfree_Organ_Overdrive.js';
export const meta         = {
  "uri": "http://gareus.org/oss/lv2/b_overdrive",
  "label": "setBfree_Organ_Overdrive",
  "name": "setBfree Organ Overdrive",
  "exportName": "createsetBfree_Organ_OverdrivePlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "in",
      "name": "In",
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
      "name": "Out",
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
      "symbol": "bias",
      "name": "Bias",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.87399
    },
    {
      "index": 3,
      "symbol": "feedback",
      "name": "Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5821
    },
    {
      "index": 4,
      "symbol": "sagtobias",
      "name": "SagToBias",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.188
    },
    {
      "index": 5,
      "symbol": "postfeed",
      "name": "Postdiff feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 6,
      "symbol": "globfeed",
      "name": "Global feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5826
    },
    {
      "index": 7,
      "symbol": "gainin",
      "name": "Input Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.3567
    },
    {
      "index": 8,
      "symbol": "gainout",
      "name": "Output Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.07873
    }
  ]
};
export const wasmUrl      = new URL('./setBfree_Organ_Overdrive.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
