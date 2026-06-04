export { default } from './crossoverDist.js';
export const meta         = {
  "id": 1404,
  "label": "crossoverDist",
  "name": "Crossover distortion",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createcrossoverDistPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Crossover amplitude",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 0.1,
      "default": "min"
    },
    {
      "index": 1,
      "name": "Smoothing",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "max"
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
export const jsUrl        = new URL('./crossoverDist.js',    import.meta.url).href;
export const wasmUrl      = new URL('./crossoverDist.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
