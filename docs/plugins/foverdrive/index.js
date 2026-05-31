export { default } from './foverdrive.js';
export const meta         = {
  "id": 1196,
  "label": "foverdrive",
  "name": "Fast overdrive",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createfoverdrivePlugin",
  "ports": [
    {
      "index": 0,
      "name": "Drive level",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 3,
      "default": "min"
    },
    {
      "index": 1,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 2,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./foverdrive.js',    import.meta.url).href;
export const wasmUrl      = new URL('./foverdrive.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
