export { default } from './CS_Chorus_1.js';
export const meta         = {
  "uri": "http://drobilla.net/plugins/fomp/cs_chorus1",
  "label": "CS_Chorus_1",
  "name": "CS Chorus 1",
  "exportName": "createCS_Chorus_1Plugin",
  "ports": [
    {
      "index": 0,
      "symbol": "in",
      "name": "Input",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 1,
      "symbol": "out",
      "name": "Output",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 2,
      "symbol": "delay",
      "name": "Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 30,
      "default": 0
    },
    {
      "index": 3,
      "symbol": "mod_freq_1",
      "name": "Mod Frequency 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.003,
      "max": 10,
      "default": null,
      "logarithmic": true
    },
    {
      "index": 4,
      "symbol": "mod_amp_1",
      "name": "Mod Amplitude 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 0
    },
    {
      "index": 5,
      "symbol": "mod_freq_2",
      "name": "Mod Frequency 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.01,
      "max": 30,
      "default": null,
      "logarithmic": true
    },
    {
      "index": 6,
      "symbol": "mod_amp_2",
      "name": "Mod Amplitude 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 3,
      "default": 0
    }
  ]
};
export const wasmUrl      = new URL('./CS_Chorus_1.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
