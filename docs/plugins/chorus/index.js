export { default } from './multivoiceChorus.js';
export const meta         = {
  "id": 1201,
  "label": "multivoiceChorus",
  "name": "Multivoice Chorus",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createmultivoiceChorusPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Number of voices",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 8,
      "default": "1",
      "integer": true
    },
    {
      "index": 1,
      "name": "Delay base (ms)",
      "dir": "input",
      "type": "control",
      "min": 10,
      "max": 40,
      "default": "min"
    },
    {
      "index": 2,
      "name": "Voice separation (ms)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 2,
      "default": "low"
    },
    {
      "index": 3,
      "name": "Detune (%)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 5,
      "default": "1"
    },
    {
      "index": 4,
      "name": "LFO frequency (Hz)",
      "dir": "input",
      "type": "control",
      "min": 2,
      "max": 30,
      "default": "low"
    },
    {
      "index": 5,
      "name": "Output attenuation (dB)",
      "dir": "input",
      "type": "control",
      "min": -20,
      "max": 0,
      "default": "0"
    },
    {
      "index": 6,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 7,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./multivoiceChorus.js',    import.meta.url).href;
export const wasmUrl      = new URL('./multivoiceChorus.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
