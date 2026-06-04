export { default } from './lowpass_iir.js';
export const meta         = {
  "id": 1891,
  "label": "lowpass_iir",
  "name": "Glame Lowpass Filter",
  "maker": "Alexander Ehlert <mag@glame.de>",
  "exportName": "createlowpass_iirPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Cutoff Frequency",
      "dir": "input",
      "type": "control",
      "min": 0.0001,
      "max": 0.45,
      "default": "high",
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
export const jsUrl        = new URL('./lowpass_iir.js',    import.meta.url).href;
export const wasmUrl      = new URL('./lowpass_iir.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
