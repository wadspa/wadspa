export { default } from './singlePara.js';
export const meta         = {
  "id": 1203,
  "label": "singlePara",
  "name": "Single band parametric",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createsingleParaPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 30,
      "default": "0"
    },
    {
      "index": 1,
      "name": "Frequency (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 0.4,
      "default": "440",
      "sampleRate": true
    },
    {
      "index": 2,
      "name": "Bandwidth (octaves)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": "1"
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
export const jsUrl        = new URL('./singlePara.js',    import.meta.url).href;
export const wasmUrl      = new URL('./singlePara.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
