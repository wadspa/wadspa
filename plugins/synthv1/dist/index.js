export { default } from './synthv1.js';
export const meta         = {
  "uri": "http://synthv1.sourceforge.net/lv2",
  "label": "synthv1",
  "name": "synthv1",
  "exportName": "createsynthv1Plugin",
  "ports": [
    {
      "index": 0,
      "symbol": "in",
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
      "symbol": "notify",
      "name": "Notify",
      "dir": "output",
      "type": "atom",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 2,
      "symbol": "in_L",
      "name": "Audio In L",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 3,
      "symbol": "in_R",
      "name": "Audio In R",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 4,
      "symbol": "Out_L",
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
      "index": 5,
      "symbol": "Out_R",
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
      "index": 6,
      "symbol": "DCO1_SHAPE1",
      "name": "DCO1 Wave Shape 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Pulse",
          "value": 0
        },
        {
          "label": "Saw",
          "value": 1
        },
        {
          "label": "Sine",
          "value": 2
        },
        {
          "label": "Rand",
          "value": 3
        },
        {
          "label": "Noise",
          "value": 4
        }
      ]
    },
    {
      "index": 7,
      "symbol": "DCO1_WIDTH1",
      "name": "DCO1 Wave Width 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 8,
      "symbol": "DCO1_BANDL1",
      "name": "DCO1 Wave Bandlimit 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 9,
      "symbol": "DCO1_SYNC1",
      "name": "DCO1 Wave Sync 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 10,
      "symbol": "DCO1_SHAPE2",
      "name": "DCO1 Wave Shape 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Pulse",
          "value": 0
        },
        {
          "label": "Saw",
          "value": 1
        },
        {
          "label": "Sine",
          "value": 2
        },
        {
          "label": "Rand",
          "value": 3
        },
        {
          "label": "Noise",
          "value": 4
        }
      ]
    },
    {
      "index": 11,
      "symbol": "DCO1_WIDTH2",
      "name": "DCO1 Width 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 12,
      "symbol": "DCO1_BANDL2",
      "name": "DCO1 Wave Bandlimit 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 13,
      "symbol": "DCO1_SYNC2",
      "name": "DCO1 Wave Sync 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 14,
      "symbol": "DCO1_BALANCE",
      "name": "DCO1 Balance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 15,
      "symbol": "DCO1_DETUNE",
      "name": "DCO1 Detune",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 16,
      "symbol": "DCO1_PHASE",
      "name": "DCO1 Phase",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 17,
      "symbol": "DCO1_RINGMOD",
      "name": "DCO1 Ring Mod",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 18,
      "symbol": "DCO1_OCTAVE",
      "name": "DCO1 Octave",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -4,
      "max": 4,
      "default": 0
    },
    {
      "index": 19,
      "symbol": "DCO1_TUNING",
      "name": "DCO1 Tuning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 20,
      "symbol": "DCO1_GLIDE",
      "name": "DCO1 Glide",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 21,
      "symbol": "DCO1_ENVTIME",
      "name": "DCO1 Env.Time",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 22,
      "symbol": "DCF1_ENABLED",
      "name": "DCF1 Enabled",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "toggled": true
    },
    {
      "index": 23,
      "symbol": "DCF1_CUTOFF",
      "name": "DCF1 Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 24,
      "symbol": "DCF1_RESO",
      "name": "DCF1 Resonance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 25,
      "symbol": "DCF1_TYPE",
      "name": "DCF1 Type",
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
          "label": "LPF",
          "value": 0
        },
        {
          "label": "BPF",
          "value": 1
        },
        {
          "label": "HPF",
          "value": 2
        },
        {
          "label": "BRF",
          "value": 3
        }
      ]
    },
    {
      "index": 26,
      "symbol": "DCF1_SLOPE",
      "name": "DCF1 Slope",
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
          "label": "12dB/oct",
          "value": 0
        },
        {
          "label": "24dB/oct",
          "value": 1
        },
        {
          "label": "Biquad",
          "value": 2
        },
        {
          "label": "Formant",
          "value": 3
        }
      ]
    },
    {
      "index": 27,
      "symbol": "DCF1_ENVELOPE",
      "name": "DCF1 Envelope",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 1
    },
    {
      "index": 28,
      "symbol": "DCF1_ATTACK",
      "name": "DCF1 Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 29,
      "symbol": "DCF1_DECAY",
      "name": "DCF1 Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 30,
      "symbol": "DCF1_SUSTAIN",
      "name": "DCF1 Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 31,
      "symbol": "DCF1_RELEASE",
      "name": "DCF1 Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 32,
      "symbol": "LFO1_ENABLED",
      "name": "LFO1 Enabled",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "toggled": true
    },
    {
      "index": 33,
      "symbol": "LFO1_SHAPE",
      "name": "LFO1 Wave Shape",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Pulse",
          "value": 0
        },
        {
          "label": "Saw",
          "value": 1
        },
        {
          "label": "Sine",
          "value": 2
        },
        {
          "label": "Rand",
          "value": 3
        },
        {
          "label": "Noise",
          "value": 4
        }
      ]
    },
    {
      "index": 34,
      "symbol": "LFO1_WIDTH",
      "name": "LFO1 Wave Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 35,
      "symbol": "LFO1_BPM",
      "name": "LFO1 BPM",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 360,
      "default": 180
    },
    {
      "index": 36,
      "symbol": "LFO1_RATE",
      "name": "LFO1 Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 37,
      "symbol": "LFO1_SYNC",
      "name": "LFO1 Sync",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 38,
      "symbol": "LFO1_SWEEP",
      "name": "LFO1 Sweep",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 39,
      "symbol": "LFO1_PITCH",
      "name": "LFO1 Pitch",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 40,
      "symbol": "LFO1_BALANCE",
      "name": "LFO1 Balance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 41,
      "symbol": "LFO1_RINGMOD",
      "name": "LFO1 Ring Mod",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 42,
      "symbol": "LFO1_CUTOFF",
      "name": "LFO1 Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 43,
      "symbol": "LFO1_RESO",
      "name": "LFO1 Resonance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 44,
      "symbol": "LFO1_PANNING",
      "name": "LFO1 Panning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 45,
      "symbol": "LFO1_VOLUME",
      "name": "LFO1 Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 46,
      "symbol": "LFO1_ATTACK",
      "name": "LFO1 Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 47,
      "symbol": "LFO1_DECAY",
      "name": "LFO1 Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 48,
      "symbol": "LFO1_SUSTAIN",
      "name": "LFO1 Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 49,
      "symbol": "LFO1_RELEASE",
      "name": "LFO1 Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 50,
      "symbol": "DCA1_VOLUME",
      "name": "DCA1 Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 51,
      "symbol": "DCA1_ATTACK",
      "name": "DCA1 Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 52,
      "symbol": "DCA1_DECAY",
      "name": "DCA1 Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 53,
      "symbol": "DCA1_SUSTAIN",
      "name": "DCA1 Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 54,
      "symbol": "DCA1_RELEASE",
      "name": "DCA1 Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 55,
      "symbol": "OUT1_WIDTH",
      "name": "OUT1 Stereo Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 56,
      "symbol": "OUT1_PANNING",
      "name": "OUT1 Panning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 57,
      "symbol": "OUT1_FXSEND",
      "name": "OUT1 FX Send",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 58,
      "symbol": "OUT1_VOLUME",
      "name": "OUT1 Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 59,
      "symbol": "DEF1_PITCHBEND",
      "name": "DEF1 Pitchbend",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 0.2
    },
    {
      "index": 60,
      "symbol": "DEF1_MODWHEEL",
      "name": "DEF1 Modwheel",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 61,
      "symbol": "DEF1_PRESSURE",
      "name": "DEF1 Pressure",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 62,
      "symbol": "DEF1_VELOCITY",
      "name": "DEF1 Velocity",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 63,
      "symbol": "DEF1_CHANNEL",
      "name": "DEF1 Channel",
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
      "index": 64,
      "symbol": "DEF1_MONO",
      "name": "DEF1 Mono",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Poly",
          "value": 0
        },
        {
          "label": "Mono",
          "value": 1
        },
        {
          "label": "Legato",
          "value": 2
        }
      ]
    },
    {
      "index": 65,
      "symbol": "DCO2_SHAPE1",
      "name": "DCO2 Wave Shape 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Pulse",
          "value": 0
        },
        {
          "label": "Saw",
          "value": 1
        },
        {
          "label": "Sine",
          "value": 2
        },
        {
          "label": "Rand",
          "value": 3
        },
        {
          "label": "Noise",
          "value": 4
        }
      ]
    },
    {
      "index": 66,
      "symbol": "DCO2_WIDTH1",
      "name": "DCO2 Wave Width 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 67,
      "symbol": "DCO2_BANDL1",
      "name": "DCO2 Wave Bandlimit 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 68,
      "symbol": "DCO2_SYNC1",
      "name": "DCO2 Wave Sync 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 69,
      "symbol": "DCO2_SHAPE2",
      "name": "DCO2 Wave Shape 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Pulse",
          "value": 0
        },
        {
          "label": "Saw",
          "value": 1
        },
        {
          "label": "Sine",
          "value": 2
        },
        {
          "label": "Rand",
          "value": 3
        },
        {
          "label": "Noise",
          "value": 4
        }
      ]
    },
    {
      "index": 70,
      "symbol": "DCO2_WIDTH2",
      "name": "DCO2 Wave Width 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 71,
      "symbol": "DCO2_BANDL2",
      "name": "DCO2 Wave Bandlimit 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 72,
      "symbol": "DCO2_SYNC2",
      "name": "DCO2 Wave Sync 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 73,
      "symbol": "DCO2_BALANCE",
      "name": "DCO2 Balance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 74,
      "symbol": "DCO2_DETUNE",
      "name": "DCO2 Detune",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 75,
      "symbol": "DCO2_PHASE",
      "name": "DCO2 Phase",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 76,
      "symbol": "DCO2_RINGMOD",
      "name": "DCO2 Ring Mod",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 77,
      "symbol": "DCO2_OCTAVE",
      "name": "DCO2 Octave",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -4,
      "max": 4,
      "default": -2
    },
    {
      "index": 78,
      "symbol": "DCO2_TUNING",
      "name": "DCO2 Tuning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 79,
      "symbol": "DCO2_GLIDE",
      "name": "DCO2 Glide",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 80,
      "symbol": "DCO2_ENVTIME",
      "name": "DCO2 Env.Time",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 81,
      "symbol": "DCF2_ENABLED",
      "name": "DCF2 Enabled",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "toggled": true
    },
    {
      "index": 82,
      "symbol": "DCF2_CUTOFF",
      "name": "DCF2 Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 83,
      "symbol": "DCF2_RESO",
      "name": "DCF2 Resonance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 84,
      "symbol": "DCF2_TYPE",
      "name": "DCF2 Type",
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
          "label": "LPF",
          "value": 0
        },
        {
          "label": "BPF",
          "value": 1
        },
        {
          "label": "HPF",
          "value": 2
        },
        {
          "label": "BRF",
          "value": 3
        }
      ]
    },
    {
      "index": 85,
      "symbol": "DCF2_SLOPE",
      "name": "DCF2 Slope",
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
          "label": "12dB/oct",
          "value": 0
        },
        {
          "label": "24dB/oct",
          "value": 1
        },
        {
          "label": "Biquad",
          "value": 2
        },
        {
          "label": "Formant",
          "value": 3
        }
      ]
    },
    {
      "index": 86,
      "symbol": "DCF2_ENVELOPE",
      "name": "DCF2 Envelope",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 1
    },
    {
      "index": 87,
      "symbol": "DCF2_ATTACK",
      "name": "DCF2 Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 88,
      "symbol": "DCF2_DECAY",
      "name": "DCF2 Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 89,
      "symbol": "DCF2_SUSTAIN",
      "name": "DCF2 Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 90,
      "symbol": "DCF2_RELEASE",
      "name": "DCF2 Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 91,
      "symbol": "LFO2_ENABLED",
      "name": "LFO2 Enabled",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "toggled": true
    },
    {
      "index": 92,
      "symbol": "LFO2_SHAPE",
      "name": "LFO2 Wave Shape",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 1,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Pulse",
          "value": 0
        },
        {
          "label": "Saw",
          "value": 1
        },
        {
          "label": "Sine",
          "value": 2
        },
        {
          "label": "Rand",
          "value": 3
        },
        {
          "label": "Noise",
          "value": 4
        }
      ]
    },
    {
      "index": 93,
      "symbol": "LFO2_WIDTH",
      "name": "LFO2 Wave Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 94,
      "symbol": "LFO2_BPM",
      "name": "LFO2 BPM",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 360,
      "default": 180
    },
    {
      "index": 95,
      "symbol": "LFO2_RATE",
      "name": "LFO2 Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 96,
      "symbol": "LFO2_SYNC",
      "name": "LFO2 Sync",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 97,
      "symbol": "LFO2_SWEEP",
      "name": "LFO2 Sweep",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 98,
      "symbol": "LFO2_PITCH",
      "name": "LFO2 Pitch",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 99,
      "symbol": "LFO2_BALANCE",
      "name": "LFO2 Balance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 100,
      "symbol": "LFO2_RINGMOD",
      "name": "LFO2 Ring Mod",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 101,
      "symbol": "LFO2_CUTOFF",
      "name": "LFO2 Cutoff",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 102,
      "symbol": "LFO2_RESO",
      "name": "LFO2 Resonance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 103,
      "symbol": "LFO2_PANNING",
      "name": "LFO2 Panning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 104,
      "symbol": "LFO2_VOLUME",
      "name": "LFO2 Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 105,
      "symbol": "LFO2_ATTACK",
      "name": "LFO2 Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 106,
      "symbol": "LFO2_DECAY",
      "name": "LFO2 Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 107,
      "symbol": "LFO2_SUSTAIN",
      "name": "LFO2 Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 108,
      "symbol": "LFO2_RELEASE",
      "name": "LFO2 Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 109,
      "symbol": "DCA2_VOLUME",
      "name": "DCA2 Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 110,
      "symbol": "DCA2_ATTACK",
      "name": "DCA2 Attack",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 111,
      "symbol": "DCA2_DECAY",
      "name": "DCA2 Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 112,
      "symbol": "DCA2_SUSTAIN",
      "name": "DCA2 Sustain",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 113,
      "symbol": "DCA2_RELEASE",
      "name": "DCA2 Release",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 114,
      "symbol": "OUT2_WIDTH",
      "name": "OUT2 Stereo Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 115,
      "symbol": "OUT2_PANNING",
      "name": "OUT2 Panning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 116,
      "symbol": "OUT2_FXSEND",
      "name": "OUT2 FX Send",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1
    },
    {
      "index": 117,
      "symbol": "OUT2_VOLUME",
      "name": "OUT2 Volume",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 118,
      "symbol": "DEF2_PITCHBEND",
      "name": "DEF2 Pitchbend",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 0.2
    },
    {
      "index": 119,
      "symbol": "DEF2_MODWHEEL",
      "name": "DEF2 Modwheel",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 120,
      "symbol": "DEF2_PRESSURE",
      "name": "DEF2 Pressure",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 121,
      "symbol": "DEF2_VELOCITY",
      "name": "DEF2 Velocity",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.2
    },
    {
      "index": 122,
      "symbol": "DEF2_CHANNEL",
      "name": "DEF2 Channel",
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
      "index": 123,
      "symbol": "DEF2_MONO",
      "name": "DEF2 Mono",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Poly",
          "value": 0
        },
        {
          "label": "Mono",
          "value": 1
        },
        {
          "label": "Legato",
          "value": 2
        }
      ]
    },
    {
      "index": 124,
      "symbol": "CHO1_WET",
      "name": "Chorus Wet",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 125,
      "symbol": "CHO1_DELAY",
      "name": "Chorus Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 126,
      "symbol": "CHO1_FEEDB",
      "name": "Chorus Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 127,
      "symbol": "CHO1_RATE",
      "name": "Chorus Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 128,
      "symbol": "CHO1_MOD",
      "name": "Chorus Modulation",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 129,
      "symbol": "FLA1_WET",
      "name": "Flanger Wet",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 130,
      "symbol": "FLA1_DELAY",
      "name": "Flanger Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 131,
      "symbol": "FLA1_FEEDB",
      "name": "Flanger Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 132,
      "symbol": "FLA1_DAFT",
      "name": "Flanger Daft",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 133,
      "symbol": "PHA1_WET",
      "name": "Phaser Wet",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 134,
      "symbol": "PHA1_RATE",
      "name": "Phaser Rate",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 135,
      "symbol": "PHA1_FEEDB",
      "name": "Phaser Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 136,
      "symbol": "PHA1_DEPTH",
      "name": "Phaser Depth",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 137,
      "symbol": "PHA1_DAFT",
      "name": "Phaser Daft",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 138,
      "symbol": "DEL1_WET",
      "name": "Delay Wet",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 139,
      "symbol": "DEL1_DELAY",
      "name": "Delay Delay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 140,
      "symbol": "DEL1_FEEDB",
      "name": "Delay Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 141,
      "symbol": "DEL1_BPM",
      "name": "Delay BPM",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 360,
      "default": 180
    },
    {
      "index": 142,
      "symbol": "REV1_WET",
      "name": "Reverb Wet",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 143,
      "symbol": "REV1_ROOM",
      "name": "Reverb Room",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 144,
      "symbol": "REV1_DAMP",
      "name": "Reverb Damp",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 145,
      "symbol": "REV1_FEEDB",
      "name": "Reverb Feedback",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 146,
      "symbol": "REV1_WIDTH",
      "name": "Reverb Width",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 147,
      "symbol": "DYN1_COMPRESS",
      "name": "Dynamic Compressor",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    },
    {
      "index": 148,
      "symbol": "DYN1_LIMITER",
      "name": "Dynamic Limiter",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "toggled": true
    },
    {
      "index": 149,
      "symbol": "KEY1_LOW",
      "name": "Keyboard Low",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 0,
      "integer": true
    },
    {
      "index": 150,
      "symbol": "KEY1_HIGH",
      "name": "Keyboard High",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 127,
      "integer": true
    }
  ]
};
export const wasmUrl      = new URL('./synthv1.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
