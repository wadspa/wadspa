export { default } from './diode.js';
export const meta         = {
  "id": 1185,
  "label": "diode",
  "name": "Diode Processor",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "creatediodePlugin",
  "ports": [
    {
      "index": 0,
      "name": "Mode (0 for none, 1 for half wave, 2 for full wave)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 3,
      "default": "0"
    },
    {
      "index": 1,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 2,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./diode.js',    import.meta.url).href;
export const wasmUrl      = new URL('./diode.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
