export { default } from './valve.js';
export const meta         = {
  "id": 1209,
  "label": "valve",
  "name": "Valve saturation",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createvalvePlugin",
  "ports": [
    {
      "index": 0,
      "name": "Distortion level",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "0"
    },
    {
      "index": 1,
      "name": "Distortion character",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "0"
    },
    {
      "index": 2,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 3,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./valve.js',    import.meta.url).href;
export const wasmUrl      = new URL('./valve.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
