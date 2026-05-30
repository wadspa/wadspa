export { default } from './comb.js';
export const meta         = {
  "id": 1190,
  "label": "comb",
  "name": "Comb Filter",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createcombPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Band separation (Hz)",
      "dir": "input",
      "type": "control",
      "min": 16,
      "max": 640,
      "default": "low"
    },
    {
      "index": 1,
      "name": "Feedback",
      "dir": "input",
      "type": "control",
      "min": -0.99,
      "max": 0.99,
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
export const jsUrl        = new URL('./comb.js',    import.meta.url).href;
export const wasmUrl      = new URL('./comb.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
