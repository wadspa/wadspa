export { default } from './ZynAddSubFX.js';
export const meta = {
  "uri": "https://zynaddsubfx.sourceforge.io/",
  "label": "zynaddsubfx",
  "name": "ZynAddSubFX",
  "exportName": "createZynAddSubFXPlugin",
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
      "symbol": "master_volume",
      "name": "Master Volume",
      "dir": "input",
      "type": "control",
      "min": -18,
      "max": 6,
      "default": 0,
      "unit": "dB"
    },
    {
      "index": 4,
      "symbol": "key_shift",
      "name": "Key Shift",
      "dir": "input",
      "type": "control",
      "min": -12,
      "max": 12,
      "default": 0,
      "integer": true
    },
    {
      "index": 5,
      "symbol": "part_volume",
      "name": "Part Volume",
      "dir": "input",
      "type": "control",
      "min": -18,
      "max": 6,
      "default": 0,
      "unit": "dB"
    },
    {
      "index": 6,
      "symbol": "part_pan",
      "name": "Part Pan",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 7,
      "symbol": "velocity_sense",
      "name": "Velocity Sense",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 127,
      "default": 64,
      "integer": true
    },
    {
      "index": 8,
      "symbol": "voice_limit",
      "name": "Voice Limit",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 16,
      "default": 8,
      "integer": true
    },
    {
      "index": 9,
      "symbol": "amp_attack",
      "name": "Amp Attack",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 2,
      "default": 0
    },
    {
      "index": 10,
      "symbol": "amp_decay",
      "name": "Amp Decay",
      "dir": "input",
      "type": "control",
      "min": 0.02,
      "max": 4,
      "default": 0.127
    },
    {
      "index": 11,
      "symbol": "amp_sustain",
      "name": "Amp Sustain",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 12,
      "symbol": "amp_release",
      "name": "Amp Release",
      "dir": "input",
      "type": "control",
      "min": 0.02,
      "max": 4,
      "default": 0.041
    },
    {
      "index": 13,
      "symbol": "filter_cutoff",
      "name": "Filter Cutoff",
      "dir": "input",
      "type": "control",
      "min": 120,
      "max": 12000,
      "default": 5000,
      "unit": "Hz"
    },
    {
      "index": 14,
      "symbol": "filter_resonance",
      "name": "Filter Resonance",
      "dir": "input",
      "type": "control",
      "min": 0.2,
      "max": 12,
      "default": 1.25
    },
    {
      "index": 15,
      "symbol": "filter_type",
      "name": "Filter Type",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": 2,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "LP1",
          "value": 0
        },
        {
          "label": "HP1",
          "value": 1
        },
        {
          "label": "LP2",
          "value": 2
        },
        {
          "label": "HP2",
          "value": 3
        },
        {
          "label": "BP",
          "value": 4
        }
      ]
    },
    {
      "index": 16,
      "symbol": "filter_stages",
      "name": "Filter Stages",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": 1,
      "integer": true
    },
    {
      "index": 17,
      "symbol": "voice_volume",
      "name": "Voice Volume",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 18,
      "symbol": "voice_detune",
      "name": "Voice Detune",
      "dir": "input",
      "type": "control",
      "min": -1,
      "max": 1,
      "default": 0
    }
  ]
};
export const wasmUrl = new URL('./ZynAddSubFX.wasm', import.meta.url).href;
export const processorUrl = new URL('./processor.js', import.meta.url).href;
