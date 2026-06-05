export { default } from './ZamTube.js';
export const meta         = {
  "uri": "urn:zamaudio:ZamTube",
  "label": "ZamTube",
  "name": "ZamTube",
  "exportName": "createZamTubePlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "lv2_audio_in_1",
      "name": "Audio Input 1",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 1,
      "symbol": "lv2_audio_out_1",
      "name": "Audio Output 1",
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
      "symbol": "tubedrive",
      "name": "Tube Drive",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0.10000000149,
      "max": 11,
      "default": 0.10000000149
    },
    {
      "index": 3,
      "symbol": "bass",
      "name": "Bass",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 5
    },
    {
      "index": 4,
      "symbol": "mids",
      "name": "Mids",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 5
    },
    {
      "index": 5,
      "symbol": "treb",
      "name": "Treble",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 10,
      "default": 5
    },
    {
      "index": 6,
      "symbol": "tonestack",
      "name": "Tone Stack Model",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 24,
      "default": 0,
      "integer": true,
      "enumeration": true,
      "scalePoints": [
        {
          "label": "1959 Bassman 5F6-A",
          "value": 0
        },
        {
          "label": "Mesa Boogie Mark",
          "value": 1
        },
        {
          "label": "1969 Twin Reverb AA270",
          "value": 2
        },
        {
          "label": "1964 Princeton AA1164",
          "value": 3
        },
        {
          "label": "1959/81 JCM-800 Lead 100",
          "value": 4
        },
        {
          "label": "1981 JCM-2000 Lead",
          "value": 5
        },
        {
          "label": "JTM 45",
          "value": 6
        },
        {
          "label": "1967 Major Lead 200",
          "value": 7
        },
        {
          "label": "M2199 30W",
          "value": 8
        },
        {
          "label": "1959/86 AC-30",
          "value": 9
        },
        {
          "label": "VOX AC-15",
          "value": 10
        },
        {
          "label": "Soldano SLO 100",
          "value": 11
        },
        {
          "label": "Sovtek MIG 100 H",
          "value": 12
        },
        {
          "label": "Peavey C20",
          "value": 13
        },
        {
          "label": "Ibanez GX20",
          "value": 14
        },
        {
          "label": "Roland Cube 60",
          "value": 15
        },
        {
          "label": "Ampeg VL 501",
          "value": 16
        },
        {
          "label": "Ampeg Reverb Rocket",
          "value": 17
        },
        {
          "label": "Bogner Triple Giant Preamp",
          "value": 18
        },
        {
          "label": "Groove Trio Preamp",
          "value": 19
        },
        {
          "label": "Hughes&Kettner",
          "value": 20
        },
        {
          "label": "Fender Blues Junior",
          "value": 21
        },
        {
          "label": "Fender",
          "value": 22
        },
        {
          "label": "Fender Hot Rod",
          "value": 23
        },
        {
          "label": "Gibsen GS12 Reverb Rocket",
          "value": 24
        }
      ]
    },
    {
      "index": 7,
      "symbol": "gain",
      "name": "Input level",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -30,
      "max": 30,
      "default": 0
    },
    {
      "index": 8,
      "symbol": "insane",
      "name": "Insane Boost",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "toggled": true
    }
  ]
};
export const wasmUrl      = new URL('./ZamTube.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
