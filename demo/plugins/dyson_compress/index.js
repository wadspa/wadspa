export { default } from './dysonCompress.js';
export const meta         = {
  "id": 1403,
  "label": "dysonCompress",
  "name": "Dyson compressor",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createdysonCompressPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Peak limit (dB)",
      "dir": "input",
      "type": "control",
      "min": -30,
      "max": 0,
      "default": "0"
    },
    {
      "index": 1,
      "name": "Release time (s)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "low"
    },
    {
      "index": 2,
      "name": "Fast compression ratio",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "middle"
    },
    {
      "index": 3,
      "name": "Compression ratio",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "middle"
    },
    {
      "index": 4,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 5,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./dysonCompress.js',    import.meta.url).href;
export const wasmUrl      = new URL('./dysonCompress.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
