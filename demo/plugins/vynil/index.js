export { default } from './vynil.js';
export const meta         = {
  "id": 1905,
  "label": "vynil",
  "name": "VyNil (Vinyl Effect)",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createvynilPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Year",
      "dir": "input",
      "type": "control",
      "min": 1900,
      "max": 1990,
      "default": "max"
    },
    {
      "index": 1,
      "name": "RPM",
      "dir": "input",
      "type": "control",
      "min": 33,
      "max": 78,
      "default": "min"
    },
    {
      "index": 2,
      "name": "Surface warping",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "0"
    },
    {
      "index": 3,
      "name": "Crackle",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "0"
    },
    {
      "index": 4,
      "name": "Wear",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": "0"
    },
    {
      "index": 5,
      "name": "Input L",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 6,
      "name": "Input R",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 7,
      "name": "Output L",
      "dir": "output",
      "type": "audio"
    },
    {
      "index": 8,
      "name": "Output R",
      "dir": "output",
      "type": "audio"
    }
  ]
};
export const jsUrl        = new URL('./vynil.js',    import.meta.url).href;
export const wasmUrl      = new URL('./vynil.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
