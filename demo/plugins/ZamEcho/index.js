export { default } from './ZamEcho.js';
export const meta         = {
  "uri": "urn:zamaudio:ZamEcho",
  "label": "ZamEcho",
  "name": "ZamEcho",
  "exportName": "createZamEchoPlugin",
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
      "symbol": "lv2_events_in",
      "name": "Events Input",
      "dir": "input",
      "type": "atom",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 3,
      "symbol": "echo",
      "name": "Echo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0.5
    }
  ]
};
export const wasmUrl      = new URL('./ZamEcho.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
