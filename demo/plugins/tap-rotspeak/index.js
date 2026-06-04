export { default } from './TAP_Rotary_Speaker.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/rotspeak",
  "label": "TAP_Rotary_Speaker",
  "name": "TAP Rotary Speaker",
  "exportName": "createTAP_Rotary_SpeakerPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "hornfreq",
      "name": "Horn Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 30,
      "default": 0
    },
    {
      "index": 1,
      "symbol": "bassfreq",
      "name": "Rotor Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 30,
      "default": 0
    },
    {
      "index": 2,
      "symbol": "stwidht",
      "name": "Mic Distance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 0
    },
    {
      "index": 3,
      "symbol": "hrbal",
      "name": "Rotor/Horn Mix",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 4,
      "symbol": "latency",
      "name": "latency",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 9200,
      "default": 9200
    },
    {
      "index": 5,
      "symbol": "inputl",
      "name": "Input L",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 6,
      "symbol": "inputr",
      "name": "Input R",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 7,
      "symbol": "outputl",
      "name": "Output L",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 8,
      "symbol": "outputr",
      "name": "Output R",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./TAP_Rotary_Speaker.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
