export { default } from './notch_iir.js';
export const meta         = {
  "id": 1894,
  "label": "notch_iir",
  "name": "Mag's Notch Filter",
  "maker": "Alexander Ehlert <mag@glame.de>",
  "exportName": "createnotch_iirPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Center Frequency (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.0001,
      "max": 0.45,
      "default": "middle",
      "logarithmic": true,
      "sampleRate": true
    },
    {
      "index": 1,
      "name": "Bandwidth (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.0001,
      "max": 0.45,
      "default": "middle",
      "logarithmic": true,
      "sampleRate": true
    },
    {
      "index": 2,
      "name": "Stages(2 poles per stage)",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 10,
      "default": "1",
      "integer": true
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
export const jsUrl        = new URL('./notch_iir.js',    import.meta.url).href;
export const wasmUrl      = new URL('./notch_iir.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
