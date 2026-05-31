export { default } from './MDA_DX10.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/DX10",
  "label": "MDA_DX10",
  "name": "MDA DX10",
  "exportName": "createMDA_DX10Plugin",
  "ports": [
    {
      "index": 0,
      "symbol": "attack",
      "name": "Attack",
      "dir": "input",
      "type": "control",
      "min": 2.5,
      "max": 4000,
      "default": 2.5
    },
    {
      "index": 1,
      "symbol": "decay",
      "name": "Decay",
      "dir": "input",
      "type": "control",
      "min": 46.5,
      "max": 7000,
      "default": 6124
    },
    {
      "index": 2,
      "symbol": "release",
      "name": "Release",
      "dir": "input",
      "type": "control",
      "min": 46.5,
      "max": 7000,
      "default": 424.42
    },
    {
      "index": 3,
      "symbol": "coarse",
      "name": "Coarse",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 40,
      "default": 28
    },
    {
      "index": 4,
      "symbol": "fine",
      "name": "Fine",
      "dir": "input",
      "type": "control",
      "min": 0.001,
      "max": 0.75,
      "default": 0.24675
    },
    {
      "index": 5,
      "symbol": "mod_init",
      "name": "Mod Init",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 100,
      "default": 23
    },
    {
      "index": 6,
      "symbol": "mod_dec",
      "name": "Mod Dec",
      "dir": "input",
      "type": "control",
      "min": 17,
      "max": 7000,
      "default": 4600
    },
    {
      "index": 7,
      "symbol": "mod_sus",
      "name": "Mod Sus",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 100,
      "default": 5
    },
    {
      "index": 8,
      "symbol": "mod_rel",
      "name": "Mod Rel",
      "dir": "input",
      "type": "control",
      "min": 46.5,
      "max": 7000,
      "default": 6485
    },
    {
      "index": 9,
      "symbol": "mod_vel",
      "name": "Mod Vel",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 100,
      "default": 90
    },
    {
      "index": 10,
      "symbol": "vibrato",
      "name": "Vibrato",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 100,
      "default": 0
    },
    {
      "index": 11,
      "symbol": "octave",
      "name": "Octave",
      "dir": "input",
      "type": "control",
      "min": -3,
      "max": 3,
      "default": 0
    },
    {
      "index": 12,
      "symbol": "finetune",
      "name": "FineTune",
      "dir": "input",
      "type": "control",
      "min": -100,
      "max": 100,
      "default": 0
    },
    {
      "index": 13,
      "symbol": "waveform",
      "name": "Waveform",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 100,
      "default": 44.7
    },
    {
      "index": 14,
      "symbol": "mod_thru",
      "name": "Mod Thru",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 100,
      "default": 0
    },
    {
      "index": 15,
      "symbol": "lfo_rate",
      "name": "LFO Rate",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 25,
      "default": 10.35
    },
    {
      "index": 16,
      "symbol": "left_out",
      "name": "Left Out",
      "dir": "output",
      "type": "audio",
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 17,
      "symbol": "right_out",
      "name": "Right Out",
      "dir": "output",
      "type": "audio",
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 18,
      "symbol": "event_in",
      "name": "Event In",
      "dir": "input",
      "type": "midi",
      "min": null,
      "max": null,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./MDA_DX10.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
