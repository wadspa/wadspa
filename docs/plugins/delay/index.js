export { default } from './delay_n.js';
export const meta         = {
  "id": 1898,
  "label": "delay_n",
  "name": "Simple delay line, noninterpolating",
  "maker": "Andy Wingo <wingo at pobox dot com>",
  "exportName": "createdelay_nPlugin",
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
      "name": "Max Delay (s)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "default": "none"
    },
    {
      "index": 3,
      "name": "Delay Time (s)",
      "dir": "input",
      "type": "control",
      "min": 0,
      "default": "none"
    }
  ]
};
export const jsUrl        = new URL('./delay_n.js',    import.meta.url).href;
export const wasmUrl      = new URL('./delay_n.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
