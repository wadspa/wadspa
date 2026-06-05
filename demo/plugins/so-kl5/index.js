export { default } from './SOkl5_Piano_Synthesizer.js';
export const meta         = {
  "uri": "urn:50m30n3:plugins:SO-kl5",
  "label": "SOkl5_Piano_Synthesizer",
  "name": "SO-kl5 Piano Synthesizer",
  "exportName": "createSOkl5_Piano_SynthesizerPlugin",
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
      "symbol": "sustain",
      "name": "Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 4,
      "symbol": "resonance",
      "name": "Filter Resonance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 0.907,
      "default": 0.625
    },
    {
      "index": 5,
      "symbol": "cutoff",
      "name": "Filter Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.0125,
      "max": 0.3333,
      "default": 0.1725
    },
    {
      "index": 6,
      "symbol": "attack",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.00625,
      "max": 0.165,
      "default": 0.01125
    },
    {
      "index": 7,
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
      "index": 8,
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
export const wasmUrl      = new URL('./SOkl5_Piano_Synthesizer.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
