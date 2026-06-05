export { default } from './MDA_Image.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Image",
  "label": "MDA_Image",
  "name": "MDA Image",
  "exportName": "createMDA_ImagePlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "mode",
      "name": "Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Stereo image adjustment",
          "value": 0
        },
        {
          "label": "Encode to MS",
          "value": 0.25
        },
        {
          "label": "Decode from MS",
          "value": 0.5
        },
        {
          "label": "Decode from MS (input channels reversed)",
          "value": 0.75
        }
      ]
    },
    {
      "index": 1,
      "symbol": "s_width",
      "name": "S Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -200,
      "max": 200,
      "default": 100
    },
    {
      "index": 2,
      "symbol": "s_pan",
      "name": "S Pan",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -100,
      "max": 100,
      "default": 0
    },
    {
      "index": 3,
      "symbol": "m_level",
      "name": "M Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -200,
      "max": 200,
      "default": 100
    },
    {
      "index": 4,
      "symbol": "m_pan",
      "name": "M Pan",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -100,
      "max": 100,
      "default": 0
    },
    {
      "index": 5,
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
      "index": 6,
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
      "index": 7,
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
      "index": 8,
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
      "index": 9,
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
export const wasmUrl      = new URL('./MDA_Image.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
