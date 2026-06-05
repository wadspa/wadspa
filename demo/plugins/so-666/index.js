export { default } from './SO666_Feedback_Synthesizer.js';
export const meta         = {
  "uri": "urn:50m30n3:plugins:SO-666",
  "label": "SO666_Feedback_Synthesizer",
  "name": "SO-666 Feedback Synthesizer",
  "exportName": "createSO666_Feedback_SynthesizerPlugin",
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
      "symbol": "feedback",
      "name": "Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.85
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
      "max": 1,
      "default": 0.5
    },
    {
      "index": 5,
      "symbol": "cutoff",
      "name": "Filter Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.25,
      "max": 0.885,
      "default": 0.57
    },
    {
      "index": 6,
      "symbol": "volume",
      "name": "Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 127
    },
    {
      "index": 7,
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
export const wasmUrl      = new URL('./SO666_Feedback_Synthesizer.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
