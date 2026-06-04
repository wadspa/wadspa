export { default } from './tapeDelay.js';
export const meta         = {
  "id": 1211,
  "label": "tapeDelay",
  "name": "Tape Delay Simulation",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createtapeDelayPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Tape speed (inches/sec, 1=normal)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 10,
      "default": "1"
    },
    {
      "index": 1,
      "name": "Dry level (dB)",
      "dir": "input",
      "type": "control",
      "min": -90,
      "max": 0,
      "default": "min"
    },
    {
      "index": 2,
      "name": "Tap 1 distance (inches)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": "0"
    },
    {
      "index": 3,
      "name": "Tap 1 level (dB)",
      "dir": "input",
      "type": "control",
      "min": -90,
      "max": 0,
      "default": "0"
    },
    {
      "index": 4,
      "name": "Tap 2 distance (inches)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": "low"
    },
    {
      "index": 5,
      "name": "Tap 2 level (dB)",
      "dir": "input",
      "type": "control",
      "min": -90,
      "max": 0,
      "default": "min"
    },
    {
      "index": 6,
      "name": "Tap 3 distance (inches)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": "middle"
    },
    {
      "index": 7,
      "name": "Tap 3 level (dB)",
      "dir": "input",
      "type": "control",
      "min": -90,
      "max": 0,
      "default": "min"
    },
    {
      "index": 8,
      "name": "Tap 4 distance (inches)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": "high"
    },
    {
      "index": 9,
      "name": "Tap 4 level (dB)",
      "dir": "input",
      "type": "control",
      "min": -90,
      "max": 0,
      "default": "min"
    },
    {
      "index": 10,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 11,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./tapeDelay.js',    import.meta.url).href;
export const wasmUrl      = new URL('./tapeDelay.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
