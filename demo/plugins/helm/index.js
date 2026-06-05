export { default } from './Helm.js';
export const meta = {
  "uri": "https://tytel.org/helm/",
  "label": "helm",
  "name": "Helm",
  "exportName": "createHelmPlugin",
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
      "symbol": "volume",
      "name": "Volume",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1.4143,
      "default": 0.7071068
    },
    {
      "index": 4,
      "symbol": "polyphony",
      "name": "Polyphony",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 32,
      "default": 4,
      "integer": true
    },
    {
      "index": 5,
      "symbol": "legato",
      "name": "Legato",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 6,
      "symbol": "pitch_bend_range",
      "name": "Pitch Bend Range",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 48,
      "default": 2,
      "integer": true
    },
    {
      "index": 7,
      "symbol": "amp_attack",
      "name": "Amp Attack",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": 0.109545
    },
    {
      "index": 8,
      "symbol": "amp_decay",
      "name": "Amp Decay",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": 1.5
    },
    {
      "index": 9,
      "symbol": "amp_sustain",
      "name": "Amp Sustain",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 10,
      "symbol": "amp_release",
      "name": "Amp Release",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": 0.3
    },
    {
      "index": 11,
      "symbol": "osc_1_waveform",
      "name": "Osc 1 Waveform",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 10,
      "default": 4,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Sine",
          "value": 0
        },
        {
          "label": "Triangle",
          "value": 1
        },
        {
          "label": "Square",
          "value": 2
        },
        {
          "label": "Saw Up",
          "value": 3
        },
        {
          "label": "Saw Down",
          "value": 4
        },
        {
          "label": "3 Step",
          "value": 5
        },
        {
          "label": "4 Step",
          "value": 6
        },
        {
          "label": "8 Step",
          "value": 7
        },
        {
          "label": "3 Pyramid",
          "value": 8
        },
        {
          "label": "5 Pyramid",
          "value": 9
        },
        {
          "label": "9 Pyramid",
          "value": 10
        }
      ]
    },
    {
      "index": 12,
      "symbol": "osc_1_transpose",
      "name": "Osc 1 Transpose",
      "dir": "input",
      "type": "control",
      "min": -48,
      "max": 48,
      "default": 0,
      "integer": true
    },
    {
      "index": 13,
      "symbol": "osc_1_tune",
      "name": "Osc 1 Tune",
      "dir": "input",
      "type": "control",
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 14,
      "symbol": "osc_1_unison_detune",
      "name": "Osc 1 Unison Detune",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 100,
      "default": 10
    },
    {
      "index": 15,
      "symbol": "osc_1_unison_voices",
      "name": "Osc 1 Unison Voices",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 15,
      "default": 1,
      "integer": true
    },
    {
      "index": 16,
      "symbol": "osc_1_volume",
      "name": "Osc 1 Volume",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.5477225575
    },
    {
      "index": 17,
      "symbol": "osc_2_waveform",
      "name": "Osc 2 Waveform",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 10,
      "default": 4,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Sine",
          "value": 0
        },
        {
          "label": "Triangle",
          "value": 1
        },
        {
          "label": "Square",
          "value": 2
        },
        {
          "label": "Saw Up",
          "value": 3
        },
        {
          "label": "Saw Down",
          "value": 4
        },
        {
          "label": "3 Step",
          "value": 5
        },
        {
          "label": "4 Step",
          "value": 6
        },
        {
          "label": "8 Step",
          "value": 7
        },
        {
          "label": "3 Pyramid",
          "value": 8
        },
        {
          "label": "5 Pyramid",
          "value": 9
        },
        {
          "label": "9 Pyramid",
          "value": 10
        }
      ]
    },
    {
      "index": 18,
      "symbol": "osc_2_transpose",
      "name": "Osc 2 Transpose",
      "dir": "input",
      "type": "control",
      "min": -48,
      "max": 48,
      "default": 0,
      "integer": true
    },
    {
      "index": 19,
      "symbol": "osc_2_tune",
      "name": "Osc 2 Tune",
      "dir": "input",
      "type": "control",
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 20,
      "symbol": "osc_2_unison_detune",
      "name": "Osc 2 Unison Detune",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 100,
      "default": 10
    },
    {
      "index": 21,
      "symbol": "osc_2_unison_voices",
      "name": "Osc 2 Unison Voices",
      "dir": "input",
      "type": "control",
      "min": 1,
      "max": 15,
      "default": 1,
      "integer": true
    },
    {
      "index": 22,
      "symbol": "osc_2_volume",
      "name": "Osc 2 Volume",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.5477225575
    },
    {
      "index": 23,
      "symbol": "cross_modulation",
      "name": "Cross Mod",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 0.5,
      "default": 0
    },
    {
      "index": 24,
      "symbol": "osc_feedback_amount",
      "name": "Osc Feedback Amount",
      "dir": "input",
      "type": "control",
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 25,
      "symbol": "osc_feedback_transpose",
      "name": "Osc Feedback Transpose",
      "dir": "input",
      "type": "control",
      "min": -24,
      "max": 24,
      "default": 0,
      "integer": true
    },
    {
      "index": 26,
      "symbol": "osc_feedback_tune",
      "name": "Osc Feedback Tune",
      "dir": "input",
      "type": "control",
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 27,
      "symbol": "noise_volume",
      "name": "Noise Volume",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 28,
      "symbol": "sub_volume",
      "name": "Sub Osc Volume",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.35
    },
    {
      "index": 29,
      "symbol": "sub_octave",
      "name": "Sub Octave Down",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 30,
      "symbol": "sub_waveform",
      "name": "Sub Osc Waveform",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 10,
      "default": 2,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Sine",
          "value": 0
        },
        {
          "label": "Triangle",
          "value": 1
        },
        {
          "label": "Square",
          "value": 2
        },
        {
          "label": "Saw Up",
          "value": 3
        },
        {
          "label": "Saw Down",
          "value": 4
        },
        {
          "label": "3 Step",
          "value": 5
        },
        {
          "label": "4 Step",
          "value": 6
        },
        {
          "label": "8 Step",
          "value": 7
        },
        {
          "label": "3 Pyramid",
          "value": 8
        },
        {
          "label": "5 Pyramid",
          "value": 9
        },
        {
          "label": "9 Pyramid",
          "value": 10
        }
      ]
    },
    {
      "index": 31,
      "symbol": "sub_shuffle",
      "name": "Sub Osc Shuffle",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 32,
      "symbol": "filter_on",
      "name": "Filter On",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 33,
      "symbol": "cutoff",
      "name": "Filter Cutoff",
      "dir": "input",
      "type": "control",
      "min": 28,
      "max": 84,
      "default": 68
    },
    {
      "index": 34,
      "symbol": "resonance",
      "name": "Filter Resonance",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 35,
      "symbol": "filter_drive",
      "name": "Filter Drive",
      "dir": "input",
      "type": "control",
      "min": -12,
      "max": 20,
      "default": 0
    },
    {
      "index": 36,
      "symbol": "filter_blend",
      "name": "Filter Blend",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 2,
      "default": 0
    },
    {
      "index": 37,
      "symbol": "filter_style",
      "name": "Filter Style",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 2,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "12dB",
          "value": 0
        },
        {
          "label": "24dB",
          "value": 1
        },
        {
          "label": "Shelf",
          "value": 2
        }
      ]
    },
    {
      "index": 38,
      "symbol": "fil_env_depth",
      "name": "Filter Env Depth",
      "dir": "input",
      "type": "control",
      "min": -128,
      "max": 128,
      "default": 48
    },
    {
      "index": 39,
      "symbol": "fil_attack",
      "name": "Filter Attack",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": 0
    },
    {
      "index": 40,
      "symbol": "fil_decay",
      "name": "Filter Decay",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 4,
      "default": 1.5
    },
    {
      "index": 41,
      "symbol": "fil_sustain",
      "name": "Filter Sustain",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 42,
      "symbol": "fil_release",
      "name": "Filter Release",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1.5,
      "default": 0.8
    },
    {
      "index": 43,
      "symbol": "distortion_on",
      "name": "Distortion On",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 44,
      "symbol": "distortion_type",
      "name": "Distortion Type",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 3,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Soft Clip",
          "value": 0
        },
        {
          "label": "Hard Clip",
          "value": 1
        },
        {
          "label": "Linear Fold",
          "value": 2
        },
        {
          "label": "Sine Fold",
          "value": 3
        }
      ]
    },
    {
      "index": 45,
      "symbol": "distortion_drive",
      "name": "Distortion Drive",
      "dir": "input",
      "type": "control",
      "min": -30,
      "max": 30,
      "default": 0
    },
    {
      "index": 46,
      "symbol": "distortion_mix",
      "name": "Distortion Mix",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 47,
      "symbol": "delay_on",
      "name": "Delay On",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 48,
      "symbol": "delay_dry_wet",
      "name": "Delay Mix",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 49,
      "symbol": "delay_feedback",
      "name": "Delay Feedback",
      "dir": "input",
      "type": "control",
      "min": -1,
      "max": 1,
      "default": 0.4
    },
    {
      "index": 50,
      "symbol": "delay_frequency",
      "name": "Delay Frequency",
      "dir": "input",
      "type": "control",
      "min": -2,
      "max": 5,
      "default": 2
    },
    {
      "index": 51,
      "symbol": "reverb_on",
      "name": "Reverb On",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 52,
      "symbol": "reverb_dry_wet",
      "name": "Reverb Mix",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 53,
      "symbol": "reverb_feedback",
      "name": "Reverb Feedback",
      "dir": "input",
      "type": "control",
      "min": 0.8,
      "max": 1,
      "default": 0.9
    },
    {
      "index": 54,
      "symbol": "reverb_damping",
      "name": "Reverb Damping",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0.5
    }
  ]
};
export const wasmUrl = new URL('./Helm.wasm', import.meta.url).href;
export const processorUrl = new URL('./processor.js', import.meta.url).href;
