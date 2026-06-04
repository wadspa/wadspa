export { default } from './plate.js';
export const meta         = {
  "id": 1423,
  "label": "plate",
  "name": "Plate reverb",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createplatePlugin",
  "ports": [
    {
      "index": 0,
      "name": "Reverb time",
      "dir": "input",
      "type": "control",
      "min": 0.01,
      "max": 8.5,
      "default": "middle"
    },
    {
      "index": 1,
      "name": "Damping",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "low"
    },
    {
      "index": 2,
      "name": "Dry/wet mix",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "low"
    },
    {
      "index": 3,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 4,
      "name": "Left output",
      "dir": "output",
      "type": "audio"
    },
    {
      "index": 5,
      "name": "Right output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./plate.js',    import.meta.url).href;
export const wasmUrl      = new URL('./plate.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
