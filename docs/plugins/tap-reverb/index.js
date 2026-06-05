export { default } from './TAP_Reverberator.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/tap/reverb",
  "label": "TAP_Reverberator",
  "name": "TAP Reverberator",
  "exportName": "createTAP_ReverberatorPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "decay",
      "name": "Decay",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10000,
      "default": 2800
    },
    {
      "index": 1,
      "symbol": "drylevel",
      "name": "Dry Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -70,
      "max": 10,
      "default": -4
    },
    {
      "index": 2,
      "symbol": "wetlevel",
      "name": "Wet Level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -70,
      "max": 10,
      "default": -12
    },
    {
      "index": 3,
      "symbol": "combs_en",
      "name": "Comb Filters",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true,
      "scalePoints": [
        {
          "label": "Off",
          "value": 0
        },
        {
          "label": "On",
          "value": 1
        }
      ]
    },
    {
      "index": 4,
      "symbol": "allps_en",
      "name": "Allpass Filters",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true,
      "scalePoints": [
        {
          "label": "Off",
          "value": 0
        },
        {
          "label": "On",
          "value": 1
        }
      ]
    },
    {
      "index": 5,
      "symbol": "bandpass_en",
      "name": "Bandpass Filter",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true,
      "scalePoints": [
        {
          "label": "Off",
          "value": 0
        },
        {
          "label": "On",
          "value": 1
        }
      ]
    },
    {
      "index": 6,
      "symbol": "stereo_enh",
      "name": "Enhanced Stereo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 1,
      "integer": true,
      "toggled": true,
      "scalePoints": [
        {
          "label": "Off",
          "value": 0
        },
        {
          "label": "On",
          "value": 1
        }
      ]
    },
    {
      "index": 7,
      "symbol": "mode",
      "name": "Reverb Type",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 42,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "AfterBurn",
          "value": 0
        },
        {
          "label": "AfterBurn (Long)",
          "value": 1
        },
        {
          "label": "Ambience",
          "value": 2
        },
        {
          "label": "Ambience (Thick)",
          "value": 3
        },
        {
          "label": "Ambience (Thick) - HD",
          "value": 4
        },
        {
          "label": "Cathedral",
          "value": 5
        },
        {
          "label": "Cathedral - HD",
          "value": 6
        },
        {
          "label": "Drum Chamber",
          "value": 7
        },
        {
          "label": "Garage",
          "value": 8
        },
        {
          "label": "Garage (Bright)",
          "value": 9
        },
        {
          "label": "Gymnasium",
          "value": 10
        },
        {
          "label": "Gymnasium (Bright)",
          "value": 11
        },
        {
          "label": "Gymnasium (Bright) - HD",
          "value": 12
        },
        {
          "label": "Hall (Small)",
          "value": 13
        },
        {
          "label": "Hall (Medium)",
          "value": 14
        },
        {
          "label": "Hall (Large)",
          "value": 15
        },
        {
          "label": "Hall (Large) - HD",
          "value": 16
        },
        {
          "label": "Plate (Small)",
          "value": 17
        },
        {
          "label": "Plate (Medium)",
          "value": 18
        },
        {
          "label": "Plate (Large)",
          "value": 19
        },
        {
          "label": "Plate (Large) - HD",
          "value": 20
        },
        {
          "label": "Pulse Chamber",
          "value": 21
        },
        {
          "label": "Pulse Chamber (Reverse)",
          "value": 22
        },
        {
          "label": "Resonator (96 ms)",
          "value": 23
        },
        {
          "label": "Resonator (152 ms)",
          "value": 24
        },
        {
          "label": "Resonator (208 ms)",
          "value": 25
        },
        {
          "label": "Room (Small)",
          "value": 26
        },
        {
          "label": "Room (Medium)",
          "value": 27
        },
        {
          "label": "Room (Large)",
          "value": 28
        },
        {
          "label": "Room (Large) - HD",
          "value": 29
        },
        {
          "label": "Slap Chamber",
          "value": 30
        },
        {
          "label": "Slap Chamber - HD",
          "value": 31
        },
        {
          "label": "Slap Chamber (Bright)",
          "value": 32
        },
        {
          "label": "Slap Chamber (Bright) - HD",
          "value": 33
        },
        {
          "label": "Smooth Hall (Small)",
          "value": 34
        },
        {
          "label": "Smooth Hall (Medium)",
          "value": 35
        },
        {
          "label": "Smooth Hall (Large)",
          "value": 36
        },
        {
          "label": "Smooth Hall (Large) - HD",
          "value": 37
        },
        {
          "label": "Vocal Plate",
          "value": 38
        },
        {
          "label": "Vocal Plate - HD",
          "value": 39
        },
        {
          "label": "Warble Chamber",
          "value": 40
        },
        {
          "label": "Warehouse",
          "value": 41
        },
        {
          "label": "Warehouse - HD",
          "value": 42
        }
      ]
    },
    {
      "index": 8,
      "symbol": "inputl",
      "name": "Input Left",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 9,
      "symbol": "outputl",
      "name": "Output Left",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 10,
      "symbol": "inputr",
      "name": "Input Right",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 11,
      "symbol": "outputr",
      "name": "Output Right",
      "dir": "output",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./TAP_Reverberator.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
