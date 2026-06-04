export { default } from './gate.js';
export const meta         = {
  "id": 1921,
  "label": "gate",
  "name": "Gate",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "creategatePlugin",
  "ports": [
    {
      "index": 0,
      "name": "LF key filter (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.0007,
      "max": 0.1,
      "default": "min",
      "sampleRate": true
    },
    {
      "index": 1,
      "name": "HF key filter (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.005,
      "max": 0.49,
      "default": "max",
      "sampleRate": true
    },
    {
      "index": 2,
      "name": "Key level (dB)",
      "dir": "output",
      "type": "control",
      "min": -70,
      "max": 20,
      "default": "none"
    },
    {
      "index": 3,
      "name": "Threshold (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 20,
      "default": "min"
    },
    {
      "index": 4,
      "name": "Attack (ms)",
      "dir": "input",
      "type": "control",
      "min": 0.01,
      "max": 1000,
      "default": "low"
    },
    {
      "index": 5,
      "name": "Hold (ms)",
      "dir": "input",
      "type": "control",
      "min": 2,
      "max": 2000,
      "default": "high"
    },
    {
      "index": 6,
      "name": "Decay (ms)",
      "dir": "input",
      "type": "control",
      "min": 2,
      "max": 4000,
      "default": "middle"
    },
    {
      "index": 7,
      "name": "Range (dB)",
      "dir": "input",
      "type": "control",
      "min": -90,
      "max": 0,
      "default": "min"
    },
    {
      "index": 8,
      "name": "Output select (-1 = key listen, 0 = gate, 1 = bypass)",
      "dir": "input",
      "type": "control",
      "min": -1,
      "max": 1,
      "default": "0",
      "integer": true
    },
    {
      "index": 9,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 10,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./gate.js',    import.meta.url).href;
export const wasmUrl      = new URL('./gate.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
