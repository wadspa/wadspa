export { default } from './padthv1.js';
export const meta         = {
  "uri": "http://padthv1.sourceforge.net/lv2",
  "label": "padthv1",
  "name": "padthv1",
  "exportName": "createpadthv1Plugin",
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
      "symbol": "GEN1_SAMPLE1",
      "name": "GEN1 Sample1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 60,
      "integer": true
    },
    {
      "index": 7,
      "symbol": "GEN1_WIDTH1",
      "name": "GEN1 Width 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 2,
      "max": 200,
      "default": 40
    },
    {
      "index": 8,
      "symbol": "GEN1_SCALE1",
      "name": "GEN1 Scale 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 9,
      "symbol": "GEN1_NH1",
      "name": "GEN1 Nh 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 2,
      "max": 64,
      "default": 32,
      "integer": true
    },
    {
      "index": 10,
      "symbol": "GEN1_APOD1",
      "name": "GEN1 Apodizer 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 4,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Rect",
          "value": 0
        },
        {
          "label": "Triang",
          "value": 1
        },
        {
          "label": "Welch",
          "value": 2
        },
        {
          "label": "Hann",
          "value": 3
        },
        {
          "label": "Gauss",
          "value": 4
        }
      ]
    },
    {
      "index": 11,
      "symbol": "GEN1_DETUNE1",
      "name": "GEN1 Detune 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": -0.1
    },
    {
      "index": 12,
      "symbol": "GEN1_GLIDE1",
      "name": "GEN1 Glide 1",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 13,
      "symbol": "GEN1_SAMPLE2",
      "name": "GEN1 Sample2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 127,
      "default": 60,
      "integer": true
    },
    {
      "index": 14,
      "symbol": "GEN1_WIDTH2",
      "name": "GEN1 Width 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 2,
      "max": 200,
      "default": 40
    },
    {
      "index": 15,
      "symbol": "GEN1_SCALE2",
      "name": "GEN1 Scale 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 16,
      "symbol": "GEN1_NH2",
      "name": "GEN1 Nh 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 2,
      "max": 64,
      "default": 32,
      "integer": true
    },
    {
      "index": 17,
      "symbol": "GEN1_APOD2",
      "name": "GEN1 Apodizer 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 4,
      "default": 4,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "Rect",
          "value": 0
        },
        {
          "label": "Triang",
          "value": 1
        },
        {
          "label": "Welch",
          "value": 2
        },
        {
          "label": "Hann",
          "value": 3
        },
        {
          "label": "Gauss",
          "value": 4
        }
      ]
    },
    {
      "index": 18,
      "symbol": "GEN1_DETUNE2",
      "name": "GEN1 Detune 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0.1
    },
    {
      "index": 19,
      "symbol": "GEN1_GLIDE2",
      "name": "GEN1 Glide 2",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 20,
      "symbol": "GEN1_BALANCE",
      "name": "GEN1 Balance",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 21,
      "symbol": "GEN1_PHASE",
      "name": "GEN1 Phase",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 22,
      "symbol": "GEN1_RINGMOD",
      "name": "GEN1 Ring Mod",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 23,
      "symbol": "GEN1_OCTAVE",
      "name": "GEN1 Octave",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -4,
      "max": 4,
      "default": 0
    },
    {
      "index": 24,
      "symbol": "GEN1_TUNING",
      "name": "GEN1 Tuning",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -1,
      "max": 1,
      "default": 0
    },
    {
      "index": 25,
      "symbol": "GEN1_ENVTIME",
      "name": "GEN1 Env.Time",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    },
    {
      "index": 26,
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
      "index": 27,
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
      "index": 28,
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
      "index": 29,
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
      "index": 30,
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
      "index": 31,
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
      "index": 32,
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
      "index": 33,
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
      "index": 34,
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
      "index": 35,
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
      "index": 36,
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
      "index": 37,
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
      "index": 38,
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
      "index": 39,
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
      "index": 40,
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
      "index": 41,
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
      "index": 42,
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
      "index": 43,
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
      "index": 44,
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
      "index": 45,
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
      "index": 46,
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
      "index": 47,
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
      "index": 48,
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
      "index": 49,
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
      "index": 50,
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
      "index": 51,
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
      "index": 52,
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
      "index": 53,
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
      "index": 54,
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
      "index": 55,
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
      "index": 56,
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
      "index": 57,
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
      "index": 58,
      "symbol": "DCA1_RELEASE",
      "name": "DCA1 Release",
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
      "index": 60,
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
      "index": 61,
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
      "index": 62,
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
      "index": 63,
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
      "index": 64,
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
      "index": 65,
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
      "index": 66,
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
      "index": 67,
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
      "index": 68,
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
      "index": 69,
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
      "index": 70,
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
      "index": 71,
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
      "index": 72,
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
      "index": 73,
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
      "index": 74,
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
      "index": 75,
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
      "index": 76,
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
      "index": 77,
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
      "index": 78,
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
      "index": 79,
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
      "index": 80,
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
      "index": 81,
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
      "index": 82,
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
      "index": 83,
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
      "index": 84,
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
      "index": 85,
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
      "index": 86,
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
      "index": 87,
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
      "index": 88,
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
      "index": 89,
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
      "index": 90,
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
      "index": 91,
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
      "index": 92,
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
      "index": 93,
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
      "index": 94,
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
      "index": 95,
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
export const wasmUrl      = new URL('./padthv1.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
