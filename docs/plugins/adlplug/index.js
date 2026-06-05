export { default } from './ADLplug.js';
export const meta = {
  "uri": "https://github.com/jpcima/ADLplug",
  "label": "adlplug",
  "name": "ADLplug",
  "exportName": "createADLplugPlugin",
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
      "symbol": "mastervol",
      "name": "Master Volume",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 2,
      "default": 0.8
    },
    {
      "index": 4,
      "symbol": "bank",
      "name": "Embedded Bank",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 15,
      "default": 0,
      "integer": true
    },
    {
      "index": 5,
      "symbol": "program",
      "name": "Program",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 127,
      "default": 0,
      "integer": true
    },
    {
      "index": 6,
      "symbol": "emulator",
      "name": "OPL3 Emulator",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 3,
      "default": 2,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Nuked OPL3 1.8",
          "value": 0
        },
        {
          "label": "Nuked OPL3 1.7",
          "value": 1
        },
        {
          "label": "DOSBox OPL3",
          "value": 2
        },
        {
          "label": "Opal OPL3",
          "value": 3
        }
      ]
    },
    {
      "index": 7,
      "symbol": "chip_count",
      "name": "Chip Count Voices",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 8,
      "default": 2,
      "integer": true
    },
    {
      "index": 8,
      "symbol": "four_op_channels",
      "name": "4op Channel Count",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 6,
      "default": 0,
      "integer": true
    },
    {
      "index": 9,
      "symbol": "deep_vibrato",
      "name": "Deep Vibrato",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 10,
      "symbol": "deep_tremolo",
      "name": "Deep Tremolo",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 11,
      "symbol": "soft_pan",
      "name": "Soft Pan",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true
    },
    {
      "index": 12,
      "symbol": "full_range_brightness",
      "name": "Full Range Brightness",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true
    },
    {
      "index": 13,
      "symbol": "scale_modulators",
      "name": "Scale Modulators",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true
    },
    {
      "index": 14,
      "symbol": "volume_model",
      "name": "Volume Model",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 5,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Auto",
          "value": 0
        },
        {
          "label": "Generic",
          "value": 1
        },
        {
          "label": "Native OPL3",
          "value": 2
        },
        {
          "label": "DMX",
          "value": 3
        },
        {
          "label": "Apogee",
          "value": 4
        },
        {
          "label": "9X",
          "value": 5
        }
      ]
    },
    {
      "index": 15,
      "symbol": "tone",
      "name": "Output Tone Hz",
      "dir": "input",
      "type": "control",
      "min": 300,
      "max": 7000,
      "default": 2600,
      "logarithmic": true
    },
    {
      "index": 16,
      "symbol": "drive",
      "name": "Output Drive",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.08
    },
    {
      "index": 17,
      "symbol": "stereo_width",
      "name": "Stereo Width",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.75
    }
  ]
};
export const wasmUrl = new URL('./ADLplug.wasm', import.meta.url).href;
export const processorUrl = new URL('./processor.js', import.meta.url).href;
