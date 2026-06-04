export { default } from './TAP_Scaling_Limiter.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/limiter",
  "label": "TAP_Scaling_Limiter",
  "name": "TAP Scaling Limiter",
  "exportName": "createTAP_Scaling_LimiterPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "limitlevel",
      "name": "Limit Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -30,
      "max": 20,
      "default": 0
    },
    {
      "index": 1,
      "symbol": "outputvolume",
      "name": "Output Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -30,
      "max": 20,
      "default": 0
    },
    {
      "index": 2,
      "symbol": "latency",
      "name": "latency",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2500.1,
      "default": 2500.1
    },
    {
      "index": 3,
      "symbol": "Input",
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
      "symbol": "Output",
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
export const wasmUrl      = new URL('./TAP_Scaling_Limiter.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
