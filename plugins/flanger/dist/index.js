export { default } from './flanger.js';
export const meta         = {
  "id": 1191,
  "label": "flanger",
  "name": "Flanger",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createflangerPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Delay base (ms)",
      "dir": "input",
      "type": "control",
      "min": 0.1,
      "max": 25,
      "default": "low"
    },
    {
      "index": 1,
      "name": "Max slowdown (ms)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 10,
      "default": "low"
    },
    {
      "index": 2,
      "name": "LFO frequency (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.05,
      "max": 100,
      "default": "low",
      "logarithmic": true
    },
    {
      "index": 3,
      "name": "Feedback",
      "dir": "input",
      "type": "control",
      "min": -1,
      "max": 1,
      "default": "0"
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
export const jsUrl        = new URL('./flanger.js',    import.meta.url).href;
export const wasmUrl      = new URL('./flanger.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
