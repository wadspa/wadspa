export { default } from './triplePara.js';
export const meta         = {
  "id": 1204,
  "label": "triplePara",
  "name": "Triple band parametric with shelves",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createtripleParaPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Low-shelving gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 30,
      "default": "0"
    },
    {
      "index": 1,
      "name": "Low-shelving frequency (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.0001,
      "max": 0.49,
      "default": "min",
      "logarithmic": true,
      "sampleRate": true
    },
    {
      "index": 2,
      "name": "Low-shelving slope",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "middle"
    },
    {
      "index": 3,
      "name": "Band 1 gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 30,
      "default": "0"
    },
    {
      "index": 4,
      "name": "Band 1 frequency (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.0001,
      "max": 0.49,
      "default": "low",
      "logarithmic": true,
      "sampleRate": true
    },
    {
      "index": 5,
      "name": "Band 1 bandwidth (octaves)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": "1"
    },
    {
      "index": 6,
      "name": "Band 2 gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 30,
      "default": "0"
    },
    {
      "index": 7,
      "name": "Band 2 frequency (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.0001,
      "max": 0.49,
      "default": "middle",
      "logarithmic": true,
      "sampleRate": true
    },
    {
      "index": 8,
      "name": "Band 2 bandwidth (octaves)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": "1"
    },
    {
      "index": 9,
      "name": "Band 3 gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 30,
      "default": "0"
    },
    {
      "index": 10,
      "name": "Band 3 frequency (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.0001,
      "max": 0.49,
      "default": "high",
      "logarithmic": true,
      "sampleRate": true
    },
    {
      "index": 11,
      "name": "Band 3 bandwidth (octaves)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": "1"
    },
    {
      "index": 12,
      "name": "High-shelving gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 30,
      "default": "0"
    },
    {
      "index": 13,
      "name": "High-shelving frequency (Hz)",
      "dir": "input",
      "type": "control",
      "min": 0.0001,
      "max": 0.49,
      "default": "max",
      "logarithmic": true,
      "sampleRate": true
    },
    {
      "index": 14,
      "name": "High-shelving slope",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "middle"
    },
    {
      "index": 15,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 16,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./triplePara.js',    import.meta.url).href;
export const wasmUrl      = new URL('./triplePara.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
