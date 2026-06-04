export { default } from './Repelente_de_ruido.js';
export const meta         = {
  "uri": "https://github.com/lucianodato/noise-repellent#new",
  "label": "Repelente_de_ruido",
  "name": "Repelente de ruido",
  "exportName": "createRepelente_de_ruidoPlugin",
  "ports": [
    {
      "index": 0,
      "symbol": "noise_learn",
      "name": "Aprender perfil de ruido",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 1,
      "symbol": "aggressiveness",
      "name": "Agresividad",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": -100,
      "max": 100,
      "default": 0
    },
    {
      "index": 2,
      "symbol": "reset_noise_profile",
      "name": "Reiniciar perfil de ruido",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 3,
      "symbol": "adaptive_noise",
      "name": "Ruido adaptativo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 4,
      "symbol": "adaptive_method",
      "name": "Metodo adaptativo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 2,
      "default": 2,
      "integer": true,
      "scalePoints": [
        {
          "label": "SPP-MMSE (Speech)",
          "value": 0
        },
        {
          "label": "Brandt (Music)",
          "value": 1
        },
        {
          "label": "Min. Statistics (General)",
          "value": 2
        }
      ]
    },
    {
      "index": 5,
      "symbol": "reduction",
      "name": "Cantidad de reduccion",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 40,
      "default": 15
    },
    {
      "index": 6,
      "symbol": "tonal_reduction",
      "name": "Reducción tonal",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 48,
      "default": 30
    },
    {
      "index": 7,
      "symbol": "suppression",
      "name": "Supresión",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 50
    },
    {
      "index": 8,
      "symbol": "smoothing",
      "name": "Suavizado",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 0
    },
    {
      "index": 9,
      "symbol": "masking_transparency",
      "name": "Transparencia de mascara",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 100
    },
    {
      "index": 10,
      "symbol": "whitening",
      "name": "Blanqueo de residuo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 100,
      "default": 0
    },
    {
      "index": 11,
      "symbol": "Residual_listen",
      "name": "Escuchar Residuo",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 12,
      "symbol": "bypass",
      "name": "Bypass",
      "dir": "input",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 1,
      "default": 0,
      "integer": true,
      "toggled": true
    },
    {
      "index": 13,
      "symbol": "latency",
      "name": "latency",
      "dir": "output",
      "type": "control",
      "legacy": false,
      "cv": false,
      "min": 0,
      "max": 8192,
      "default": null,
      "integer": true
    },
    {
      "index": 14,
      "symbol": "input",
      "name": "Input",
      "dir": "input",
      "type": "audio",
      "legacy": false,
      "cv": false,
      "min": null,
      "max": null,
      "default": null
    },
    {
      "index": 15,
      "symbol": "output",
      "name": "Output",
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
export const wasmUrl      = new URL('./Repelente_de_ruido.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
