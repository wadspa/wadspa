export { default } from './amp.js';
export const meta         = {
  "id": 1181,
  "label": "amp",
  "name": "Simple amplifier",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createampPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Amps gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 70,
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
export const jsUrl        = new URL('./amp.js',    import.meta.url).href;
export const wasmUrl      = new URL('./amp.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
