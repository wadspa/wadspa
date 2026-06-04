export { default } from './MDA_Stereo.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Stereo",
  "label": "MDA_Stereo",
  "name": "MDA Stereo",
  "exportName": "createMDA_StereoPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "width",
      "name": "Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -100,
      "max": 100,
      "default": 56
    },
    {
      "index": 1,
      "symbol": "delay",
      "name": "Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.45,
      "max": 47.62,
      "default": 22.43
    },
    {
      "index": 2,
      "symbol": "balance",
      "name": "Balance",
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
      "symbol": "mod",
      "name": "Mod",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 47.62,
      "default": 0,
      "scalePoints": [
        {
          "label": "OFF",
          "value": 0
        }
      ]
    },
    {
      "index": 4,
      "symbol": "rate",
      "name": "Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.1,
      "max": 100,
      "default": 50
    },
    {
      "index": 5,
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
      "index": 6,
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
      "index": 7,
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
      "index": 8,
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
export const wasmUrl      = new URL('./MDA_Stereo.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
