export { default } from './fastLookaheadLimiter.js';
export const meta         = {
  "id": 1913,
  "label": "fastLookaheadLimiter",
  "name": "Fast Lookahead limiter",
  "maker": "Steve Harris <steve@plugin.org.uk>",
  "exportName": "createfastLookaheadLimiterPlugin",
  "ports": [
    {
      "index": 0,
      "name": "Input gain (dB)",
      "dir": "input",
      "type": "control",
      "min": -20,
      "max": 20,
      "default": "0"
    },
    {
      "index": 1,
      "name": "Limit (dB)",
      "dir": "input",
      "type": "control",
      "min": -20,
      "max": 0,
      "default": "0"
    },
    {
      "index": 2,
      "name": "Release time (s)",
      "dir": "input",
      "type": "control",
      "min": 0.01,
      "max": 2,
      "default": "low"
    },
    {
      "index": 3,
      "name": "Attenuation (dB)",
      "dir": "output",
      "type": "control",
      "min": 0,
      "max": 70,
      "default": "none"
    },
    {
      "index": 4,
      "name": "Input 1",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 5,
      "name": "Input 2",
      "dir": "input",
      "type": "audio"
    },
    {
      "index": 6,
      "name": "Output 1",
      "dir": "output",
      "type": "audio"
    },
    {
      "index": 7,
      "name": "Output 2",
      "dir": "output",
      "type": "audio"
    },
    {
      "index": 8,
      "name": "latency",
      "dir": "output",
      "type": "control",
      "default": "none"
    }
  ]
};
export const jsUrl        = new URL('./fastLookaheadLimiter.js',    import.meta.url).href;
export const wasmUrl      = new URL('./fastLookaheadLimiter.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
