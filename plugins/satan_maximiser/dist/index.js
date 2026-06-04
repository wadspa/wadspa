export { default } from './satanMaximiser.js';
export const meta         = {
  "id": 1408,
  "label": "satanMaximiser",
  "name": "Barry's Satan Maximiser",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createsatanMaximiserPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Decay time (samples)",
      "dir": "input",
      "type": "control",
      "min": 2,
      "max": 30,
      "default": "max"
    },
    {
      "index": 1,
      "name": "Knee point (dB)",
      "dir": "input",
      "type": "control",
      "min": -90,
      "max": 0,
      "default": "0"
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
export const jsUrl        = new URL('./satanMaximiser.js',    import.meta.url).href;
export const wasmUrl      = new URL('./satanMaximiser.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
