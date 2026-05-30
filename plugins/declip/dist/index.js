export { default } from './declip.js';
export const meta         = {
  "id": 1195,
  "label": "declip",
  "name": "Declipper",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createdeclipPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 1,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./declip.js',    import.meta.url).href;
export const wasmUrl      = new URL('./declip.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
