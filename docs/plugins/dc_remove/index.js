export { default } from './dcRemove.js';
export const meta         = {
  "id": 1207,
  "label": "dcRemove",
  "name": "DC Offset Remover",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createdcRemovePlugin",
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
    }
  ]
};
export const jsUrl        = new URL('./dcRemove.js',    import.meta.url).href;
export const wasmUrl      = new URL('./dcRemove.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
