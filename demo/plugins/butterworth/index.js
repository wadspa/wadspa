export { default } from './bwxover_iir.js';
export const meta         = {
  "id": 1902,
  "label": "bwxover_iir",
  "name": "Glame Butterworth X-over Filter",
  "maker": "Alexander Ehlert <mag@glame.de>",
  "exportName": "createbwxover_iirPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Cutoff Frequency (Hz)",
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
      "name": "Resonance",
      "dir": "input",
      "type": "control",
      "min": 0.1,
      "max": 1.41,
      "default": "middle"
    },
    {
      "index": 2,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 3,
      "name": "LP-Output",
      "dir": "output",
      "type": "audio"
    },
    {
      "index": 4,
      "name": "HP-Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./bwxover_iir.js',    import.meta.url).href;
export const wasmUrl      = new URL('./bwxover_iir.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
