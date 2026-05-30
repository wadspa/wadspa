# wadspa

**LADSPA plugins compiled to WebAssembly, published as npm packages.**

wadspa takes the battle-tested [LADSPA](https://www.ladspa.org/) plugin ecosystem — hundreds of high-quality audio effects written in C — and makes them available in the browser via the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API). No native code, no security issues, no browser-update breakage.

## Why not CLAP / WAM / AudioWorklet plugins directly?

Browser security updates regularly break plugin formats that rely on shared memory, `SharedArrayBuffer`, or cross-origin isolation quirks. wadspa avoids this entirely: each plugin is a self-contained `.wasm` binary loaded via a standard `AudioWorkletNode`. It runs in every modern browser today and will continue to work as browsers evolve.

## Packages

| Package | Description |
|---|---|
| [`@wadspa/core`](./core) | Runtime: load and connect wadspa plugins |
| [`@wadspa/toolchain`](./toolchain) | CLI: compile LADSPA C source to a wadspa npm package |

## Quick start

### Using a plugin

```js
import { loadPlugin } from '@wadspa/core';
import * as amp from '@wadspa/amp';

const ctx = new AudioContext();
const node = await loadPlugin(ctx, amp);

node.set('Gain (dB)', -6);
source.connect(node.input);
node.output.connect(ctx.destination);
```

### Building a plugin

```sh
npm install -g @wadspa/toolchain   # or: npm link in ./toolchain

wadspa build ./my-plugin --out ./dist
```

See [`@wadspa/toolchain`](./toolchain) for the full build guide.

## Repo layout

```
wadspa/
  core/          @wadspa/core — runtime host
  toolchain/     @wadspa/toolchain — build CLI
  amp/           amp plugin source + dist/
  dj_eq/         dj_eq_mono plugin source + dist/
  demo/          browser demo (amp + dj_eq_mono)
  swh-plugins/   Steve Harris LADSPA plugin collection (submodule)
```

## Audio routing

**Mono plugins** (1 audio in, 1 audio out) expose a single mono `input` and `output`:

```js
source.connect(node.input);
node.output.connect(ctx.destination);
```

**Stereo plugins** (2 audio in, 2 audio out) expose a single stereo `input` and `output`:

```js
source.connect(node.input);          // source must be stereo
node.output.connect(ctx.destination);
```

## License

MIT
