export { default } from './fil4mono.js';
export const meta         = {
  "uri": "http://gareus.org/oss/lv2/fil4#mono",
  "label": "fil4mono",
  "name": "fil4#mono",
  "exportName": "createfil4monoPlugin",
  "ports": []
};
export const wasmUrl      = new URL('./fil4mono.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
