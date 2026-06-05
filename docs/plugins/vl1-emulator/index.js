export { default } from './VL1emulator.js';
export const meta         = {
  "uri": "https://polyvalens.com/plugins/VL1",
  "label": "VL1emulator",
  "name": "VL1-emulator",
  "exportName": "createVL1emulatorPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "midi_in",
      "name": "MIDI In",
      "dir": "input",
      "type": "midi",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 1,
      "symbol": "out_l",
      "name": "Audio Out L",
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
      "symbol": "out_r",
      "name": "Audio Out R",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 3,
      "symbol": "mode",
      "name": "Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 3,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Play",
          "value": 0
        },
        {
          "label": "Rec",
          "value": 1
        },
        {
          "label": "Cal",
          "value": 2
        },
        {
          "label": "Off",
          "value": 3
        }
      ]
    },
    {
      "index": 4,
      "symbol": "volume",
      "name": "Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 80
    },
    {
      "index": 5,
      "symbol": "balance",
      "name": "Balance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 50
    },
    {
      "index": 6,
      "symbol": "octave",
      "name": "Octave",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Low",
          "value": 0
        },
        {
          "label": "Middle",
          "value": 1
        },
        {
          "label": "High",
          "value": 2
        }
      ]
    },
    {
      "index": 7,
      "symbol": "tune",
      "name": "Tune",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 50
    },
    {
      "index": 8,
      "symbol": "sound",
      "name": "Sound",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 9,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Piano",
          "value": 0
        },
        {
          "label": "Fantasy",
          "value": 1
        },
        {
          "label": "Violin",
          "value": 2
        },
        {
          "label": "Flute",
          "value": 3
        },
        {
          "label": "Guitar 1",
          "value": 4
        },
        {
          "label": "Guitar 2",
          "value": 5
        },
        {
          "label": "English Horn",
          "value": 6
        },
        {
          "label": "Electro 1",
          "value": 7
        },
        {
          "label": "Electro 2",
          "value": 8
        },
        {
          "label": "Electro 3",
          "value": 9
        }
      ]
    },
    {
      "index": 9,
      "symbol": "attack",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 9,
      "default": 0,
      "integer": true
    },
    {
      "index": 10,
      "symbol": "decay",
      "name": "Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 9,
      "default": 4,
      "integer": true
    },
    {
      "index": 11,
      "symbol": "sustain_level",
      "name": "Sustain Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 9,
      "default": 5,
      "integer": true
    },
    {
      "index": 12,
      "symbol": "sustain_time",
      "name": "Sustain Time",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 9,
      "default": 3,
      "integer": true
    },
    {
      "index": 13,
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 9,
      "default": 2,
      "integer": true
    },
    {
      "index": 14,
      "symbol": "vibrato",
      "name": "Vibrato",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 9,
      "default": 0,
      "integer": true
    },
    {
      "index": 15,
      "symbol": "tremolo",
      "name": "Tremolo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 9,
      "default": 0,
      "integer": true
    },
    {
      "index": 16,
      "symbol": "tempo",
      "name": "Tempo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -9,
      "max": 9,
      "default": 4,
      "integer": true
    }
  ]
};
export const wasmUrl      = new URL('./VL1emulator.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
