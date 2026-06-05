export { default } from './SO404_Bass_Synthesizer.js';
export const meta         = {
  "uri": "urn:50m30n3:plugins:SO-404",
  "label": "SO404_Bass_Synthesizer",
  "name": "SO-404 Bass Synthesizer",
  "exportName": "createSO404_Bass_SynthesizerPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "output",
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
      "index": 1,
      "symbol": "midi",
      "name": "MIDI Input",
      "dir": "input",
      "type": "midi",
      "legacy": true,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 2,
      "symbol": "controlmode",
      "name": "Control Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "enumeration": true,
      "toggled": true,
      "scalePoints": [
        {
          "label": "Midi Commands",
          "value": 0
        },
        {
          "label": "Control Ports",
          "value": 1
        }
      ]
    },
    {
      "index": 3,
      "symbol": "volume",
      "name": "Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 100
    },
    {
      "index": 4,
      "symbol": "cutoff",
      "name": "Filter Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 50
    },
    {
      "index": 5,
      "symbol": "resonance",
      "name": "Filter Resonance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 100
    },
    {
      "index": 6,
      "symbol": "envelope",
      "name": "Filter Envelope",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 80
    },
    {
      "index": 7,
      "symbol": "portamento",
      "name": "Portamento Time",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 64
    },
    {
      "index": 8,
      "symbol": "release",
      "name": "Release Time",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 100
    },
    {
      "index": 9,
      "symbol": "channel",
      "name": "Midi Channel",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 16,
      "default": 0,
      "integer": true,
      "scalePoints": [
        {
          "label": "Off",
          "value": 16
        }
      ]
    }
  ]
};
export const wasmUrl      = new URL('./SO404_Bass_Synthesizer.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
