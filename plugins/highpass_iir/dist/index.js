export { default } from './highpass_iir.js';
export const meta         = {
  "id": 1890,
  "label": "highpass_iir",
  "name": "Glame Highpass Filter",
  "maker": "Alexander Ehlert <mag@glame.de>",
  "exportName": "createhighpass_iirPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Cutoff Frequency",
      "dir": "input",
      "type": "control",
      "min": 0.0001,
      "max": 0.45,
      "default": "low",
      "logarithmic": true,
      "sampleRate": true
    },
    {
      "index": 1,
      "name": "Stages(2 poles per stage)",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 10,
      "default": "1",
      "integer": true
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
export const jsUrl        = new URL('./highpass_iir.js',    import.meta.url).href;
export const wasmUrl      = new URL('./highpass_iir.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
