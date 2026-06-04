export { default } from './dj_eq_mono.js';
export const meta         = {
  "id": 1907,
  "label": "dj_eq_mono",
  "name": "DJ EQ (mono)",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createdj_eq_monoPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Lo gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 6,
      "default": "0"
    },
    {
      "index": 1,
      "name": "Mid gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 6,
      "default": "0"
    },
    {
      "index": 2,
      "name": "Hi gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 6,
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
    },
    {
      "index": 5,
      "name": "latency",
      "dir": "output",
      "type": "control",
      "default": "none"
    }
  ]
};
export const jsUrl        = new URL('./dj_eq_mono.js',    import.meta.url).href;
export const wasmUrl      = new URL('./dj_eq_mono.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
