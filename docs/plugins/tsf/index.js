export { default } from './tsf.js';
export const meta         = {
  "uri": "https://wadspa.org/plugins/tsf",
  "label": "tsf",
  "name": "TinySoundFont",
  "exportName": "createTSFPlugin",
  "sf2": true,
  "ports": [
    {
      "index": 0,
      "symbol": "midi_in",
      "name": "MIDI In",
      "dir": "input",
      "type": "midi"
    },
    {
      "index": 1,
      "symbol": "out_l",
      "name": "Audio Out L",
      "dir": "output",
      "type": "audio"
    },
    {
      "index": 2,
      "symbol": "out_r",
      "name": "Audio Out R",
      "dir": "output",
      "type": "audio"
    },
    {
      "index": 3,
      "symbol": "gain",
      "name": "Gain",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 2,
      "default": 0.5
    }
  ]
};
export const wasmUrl      = new URL('./tsf.wasm',    import.meta.url).href;
export const processorUrl = new URL('./processor.js', import.meta.url).href;
