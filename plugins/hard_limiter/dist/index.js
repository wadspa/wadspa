export { default } from './hardLimiter.js';
export const meta         = {
  "id": 1413,
  "label": "hardLimiter",
  "name": "Hard Limiter",
  "maker": "Marcus Andersson",
  "exportName": "createhardLimiterPlugin",
  "ports": [
    {
      "index": 0,
      "name": "dB limit",
      "dir": "input",
      "type": "control",
      "min": -50,
      "max": 0,
      "default": "0"
    },
    {
      "index": 1,
      "name": "Wet level",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "1"
    },
    {
      "index": 2,
      "name": "Residue level",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "0"
    },
    {
      "index": 3,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 4,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./hardLimiter.js',    import.meta.url).href;
export const wasmUrl      = new URL('./hardLimiter.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
