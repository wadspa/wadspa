export { default } from './sc4.js';
export const meta         = {
  "id": 1882,
  "label": "sc4",
  "name": "SC4",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createsc4Plugin",
  "ports": [
    {
      "index": 0,
      "name": "RMS/peak",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "min"
    },
    {
      "index": 1,
      "name": "Attack time (ms)",
      "dir": "input",
      "type": "control",
      "min": 1.5,
      "max": 400,
      "default": "low"
    },
    {
      "index": 2,
      "name": "Release time (ms)",
      "dir": "input",
      "type": "control",
      "min": 2,
      "max": 800,
      "default": "middle"
    },
    {
      "index": 3,
      "name": "Threshold level (dB)",
      "dir": "input",
      "type": "control",
      "min": -30,
      "max": 0,
      "default": "max"
    },
    {
      "index": 4,
      "name": "Ratio (1:n)",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 20,
      "default": "1"
    },
    {
      "index": 5,
      "name": "Knee radius (dB)",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 10,
      "default": "low"
    },
    {
      "index": 6,
      "name": "Makeup gain (dB)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 24,
      "default": "0"
    },
    {
      "index": 7,
      "name": "Amplitude (dB)",
      "dir": "output",
      "type": "control",
      "min": -40,
      "max": 12,
      "default": "none"
    },
    {
      "index": 8,
      "name": "Gain reduction (dB)",
      "dir": "output",
      "type": "control",
      "min": -24,
      "max": 0,
      "default": "none"
    },
    {
      "index": 9,
      "name": "Left input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 10,
      "name": "Right input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 11,
      "name": "Left output",
      "dir": "output",
      "type": "audio"
    },
    {
      "index": 12,
      "name": "Right output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./sc4.js',    import.meta.url).href;
export const wasmUrl      = new URL('./sc4.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
