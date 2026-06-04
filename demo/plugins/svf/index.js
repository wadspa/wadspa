export { default } from './svf.js';
export const meta         = {
  "id": 1214,
  "label": "svf",
  "name": "State Variable Filter",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createsvfPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Input",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 1,
      "name": "Output",
      "dir": "output",
      "type": "audio"
    },
    {
      "index": 2,
      "name": "Filter type (0=none, 1=LP, 2=HP, 3=BP, 4=BR, 5=AP)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 5,
      "default": "0",
      "integer": true
    },
    {
      "index": 3,
      "name": "Filter freq",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 6000,
      "default": "440"
    },
    {
      "index": 4,
      "name": "Filter Q",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "low"
    },
    {
      "index": 5,
      "name": "Filter resonance",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "0"
    }
  ]
};
export const jsUrl        = new URL('./svf.js',    import.meta.url).href;
export const wasmUrl      = new URL('./svf.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
