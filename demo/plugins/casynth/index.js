export { default } from './the_infamous_cellular_automaton_synth.js';
export const meta         = {
  "uri": "http://ssj71.github.io/infamousPlugins/plugs.html#casynth",
  "label": "the_infamous_cellular_automaton_synth",
  "name": "the infamous cellular automaton synth",
  "exportName": "createthe_infamous_cellular_automaton_synthPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "MIDI_IN",
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
      "symbol": "OUTPUT",
      "name": "Audio Out",
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
      "symbol": "CHANNEL",
      "name": "MIDI Channel",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 16,
      "default": 0,
      "integer": true
    },
    {
      "index": 3,
      "symbol": "MASTER_GAIN",
      "name": "Master Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 2,
      "default": 1
    },
    {
      "index": 4,
      "symbol": "RULE",
      "name": "Cell Automaton Rule",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 255,
      "default": 30,
      "integer": true
    },
    {
      "index": 5,
      "symbol": "CELL_LIFE",
      "name": "Cell Lifetime",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 10,
      "default": 0.25,
      "logarithmic": true
    },
    {
      "index": 6,
      "symbol": "INIT_CELLS",
      "name": "Initial Condition",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 65535,
      "default": 1,
      "integer": true
    },
    {
      "index": 7,
      "symbol": "NHARMONICS",
      "name": "Harmonics",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 16,
      "default": 12,
      "integer": true
    },
    {
      "index": 8,
      "symbol": "HARM_MODE",
      "name": "Harmonic Gain Mode",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 3,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Sinc",
          "value": 0
        },
        {
          "label": "Saw",
          "value": 1
        },
        {
          "label": "Square",
          "value": 2
        },
        {
          "label": "Triangle",
          "value": 3
        }
      ]
    },
    {
      "index": 9,
      "symbol": "HARM_WIDTH",
      "name": "Harmonic Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 50,
      "default": 0
    },
    {
      "index": 10,
      "symbol": "WAVE",
      "name": "Waveform",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 5,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Sine",
          "value": 0
        },
        {
          "label": "Saw",
          "value": 1
        },
        {
          "label": "Square",
          "value": 2
        },
        {
          "label": "Triangle",
          "value": 3
        },
        {
          "label": "White Noise",
          "value": 4
        },
        {
          "label": "Random",
          "value": 5
        }
      ]
    },
    {
      "index": 11,
      "symbol": "ENV_A",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 15,
      "default": 0.1,
      "logarithmic": true
    },
    {
      "index": 12,
      "symbol": "ENV_D",
      "name": "Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 15,
      "default": 0.1,
      "logarithmic": true
    },
    {
      "index": 13,
      "symbol": "ENV_B",
      "name": "Break Point",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 14,
      "symbol": "ENV_SWL",
      "name": "Swell",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 15,
      "default": 3,
      "logarithmic": true
    },
    {
      "index": 15,
      "symbol": "ENV_SUS",
      "name": "Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.75
    },
    {
      "index": 16,
      "symbol": "ENV_R",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.001,
      "max": 15,
      "default": 0.1,
      "logarithmic": true
    },
    {
      "index": 17,
      "symbol": "AMOD_WAV",
      "name": "AM Waveform",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 5,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Sine",
          "value": 0
        },
        {
          "label": "Saw",
          "value": 1
        },
        {
          "label": "Square",
          "value": 2
        },
        {
          "label": "Triangle",
          "value": 3
        },
        {
          "label": "White Noise",
          "value": 4
        },
        {
          "label": "Random",
          "value": 5
        }
      ]
    },
    {
      "index": 18,
      "symbol": "AMOD_FREQ",
      "name": "AM Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 110,
      "default": 0
    },
    {
      "index": 19,
      "symbol": "AMOD_GAIN",
      "name": "AM Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 20,
      "symbol": "FMOD_WAV",
      "name": "FM Waveform",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 5,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Sine",
          "value": 0
        },
        {
          "label": "Saw",
          "value": 1
        },
        {
          "label": "Square",
          "value": 2
        },
        {
          "label": "Triangle",
          "value": 3
        },
        {
          "label": "White Noise",
          "value": 4
        },
        {
          "label": "Random",
          "value": 5
        }
      ]
    },
    {
      "index": 21,
      "symbol": "FMOD_FREQ",
      "name": "FM Frequency",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 110,
      "default": 0
    },
    {
      "index": 22,
      "symbol": "FMOD_GAIN",
      "name": "FM Gain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -4,
      "max": 4,
      "default": 0.1
    }
  ]
};
export const wasmUrl      = new URL('./the_infamous_cellular_automaton_synth.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
