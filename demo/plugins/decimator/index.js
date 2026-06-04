export { default } from './decimator.js';
export const meta         = {
  "id": 1202,
  "label": "decimator",
  "name": "Decimator",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createdecimatorPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Bit depth",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 24,
      "default": "max"
    },
    {
      "index": 1,
      "name": "Sample rate (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.001,
      "max": 1,
      "default": "max",
      "sampleRate": true
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
export const jsUrl        = new URL('./decimator.js',    import.meta.url).href;
export const wasmUrl      = new URL('./decimator.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
