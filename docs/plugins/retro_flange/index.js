export { default } from './retroFlange.js';
export const meta         = {
  "id": 1208,
  "label": "retroFlange",
  "name": "Retro Flanger",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createretroFlangePlugin",
  "ports": [
    {
      "index": 0,
      "name": "Average stall (ms)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 10,
      "default": "low"
    },
    {
      "index": 1,
      "name": "Flange frequency (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.5,
      "max": 8,
      "default": "1"
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
export const jsUrl        = new URL('./retroFlange.js',    import.meta.url).href;
export const wasmUrl      = new URL('./retroFlange.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
