export { default } from './TAP_PinkFractal_Noise.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/pinknoise",
  "label": "TAP_PinkFractal_Noise",
  "name": "TAP Pink/Fractal Noise",
  "exportName": "createTAP_PinkFractal_NoisePlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "hurst",
      "name": "Fractal Dimension",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 1,
      "symbol": "signal",
      "name": "Signal Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -90,
      "max": 20,
      "default": 0
    },
    {
      "index": 2,
      "symbol": "noise",
      "name": "Noise",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -90,
      "max": 5,
      "default": -90
    },
    {
      "index": 3,
      "symbol": "input",
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
      "index": 4,
      "symbol": "output",
      "name": "Output",
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
export const wasmUrl      = new URL('./TAP_PinkFractal_Noise.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
