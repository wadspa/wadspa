export { default } from './gverb.js';
export const meta         = {
  "id": 1216,
  "label": "gverb",
  "name": "GVerb",
  "maker": "Juhana Sadeharju <kouhia at nic.funet.fi>, LADSPAification by Steve Harris <steve@plugin.org.uk>",
  "exportName": "creategverbPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Roomsize (m)",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 300,
      "default": "low"
    },
    {
      "index": 1,
      "name": "Reverb time (s)",
      "dir": "input",
      "type": "control",
      "min": 0.1,
      "max": 30,
      "default": "low"
    },
    {
      "index": 2,
      "name": "Damping",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "middle"
    },
    {
      "index": 3,
      "name": "Input bandwidth",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "high"
    },
    {
      "index": 4,
      "name": "Dry signal level (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 0,
      "default": "min"
    },
    {
      "index": 5,
      "name": "Early reflection level (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 0,
      "default": "0"
    },
    {
      "index": 6,
      "name": "Tail level (dB)",
      "dir": "input",
      "type": "control",
      "min": -70,
      "max": 0,
      "default": "high"
    },
    {
      "index": 7,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 8,
      "name": "Left output",
      "dir": "output",
      "type": "audio"
    },
    {
      "index": 9,
      "name": "Right output",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./gverb.js',    import.meta.url).href;
export const wasmUrl      = new URL('./gverb.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
