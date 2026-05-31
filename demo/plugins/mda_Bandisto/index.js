export { default } from './MDA_Bandisto.js';
export const meta         = {
  "uri": "http://moddevices.com/plugins/mda/Bandisto",
  "label": "MDA_Bandisto",
  "name": "MDA Bandisto",
  "exportName": "createMDA_BandistoPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "listen",
      "name": "Listen",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 3,
      "default": 3
    },
    {
      "index": 1,
      "symbol": "l_m",
      "name": "L <> M",
      "dir": "input",
      "type": "control",
      "min": 88,
      "max": 1020,
      "default": 550
    },
    {
      "index": 2,
      "symbol": "m_h",
      "name": "M <> H",
      "dir": "input",
      "type": "control",
      "min": 112,
      "max": 19606,
      "default": 9859
    },
    {
      "index": 3,
      "symbol": "l_dist",
      "name": "L Dist",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 60,
      "default": 45
    },
    {
      "index": 4,
      "symbol": "m_dist",
      "name": "M Dist",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 60,
      "default": 45
    },
    {
      "index": 5,
      "symbol": "h_dist",
      "name": "H Dist",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 60,
      "default": 45
    },
    {
      "index": 6,
      "symbol": "l_out",
      "name": "L Out",
      "dir": "input",
      "type": "control",
      "min": -20,
      "max": 20,
      "default": 6
    },
    {
      "index": 7,
      "symbol": "m_out",
      "name": "M Out",
      "dir": "input",
      "type": "control",
      "min": -20,
      "max": 20,
      "default": 0
    },
    {
      "index": 8,
      "symbol": "h_out",
      "name": "H Out",
      "dir": "input",
      "type": "control",
      "min": -20,
      "max": 20,
      "default": 0
    },
    {
      "index": 9,
      "symbol": "mode",
      "name": "Mode",
      "dir": "input",
      "type": "control",
      "min": 0,
      "max": 1,
      "default": 0
    },
    {
      "index": 10,
      "symbol": "left_in",
      "name": "Left In",
      "dir": "input",
      "type": "audio",
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 11,
      "symbol": "right_in",
      "name": "Right In",
      "dir": "input",
      "type": "audio",
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 12,
      "symbol": "left_out",
      "name": "Left Out",
      "dir": "output",
      "type": "audio",
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 13,
      "symbol": "right_out",
      "name": "Right Out",
      "dir": "output",
      "type": "audio",
      "min": null,
      "max": null,
      "default": null
    }
  ]
};
export const wasmUrl      = new URL('./MDA_Bandisto.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
