# wadspa

**LADSPA audio plugins compiled to WebAssembly, published as npm packages.**

wadspa takes the battle-tested [LADSPA](https://www.ladspa.org/) ecosystem — hundreds of high-quality audio effects written in C — and makes them available in any browser via the Web Audio API. Each plugin is a self-contained `.wasm` binary loaded as an `AudioWorkletNode`. No native code. No security issues. No browser-update breakage.

---

## Why wadspa?

Existing browser plugin formats (CLAP, WAM, Web Audio Modules) repeatedly break as browsers tighten security around `SharedArrayBuffer`, cross-origin isolation, and WASM instantiation. wadspa avoids all of that:

- **Standard Web Audio API** — uses `AudioWorkletNode`, which every modern browser supports and has no plans to remove
- **No shared memory** — each plugin owns its WASM heap; no `SharedArrayBuffer` required
- **No dynamic `import()` in worklets** — uses static ES module imports, which work in Chrome and Safari
- **Zero runtime dependencies** — plugins are plain npm packages; `@wadspa/core` is a single 97-line file

---

## Packages

| Package | Description | npm |
|---|---|---|
| [`@wadspa/core`](./core) | Runtime: load and connect wadspa plugins | _(coming soon)_ |
| [`@wadspa/toolchain`](./toolchain) | CLI: compile LADSPA C source into a wadspa npm package | _(coming soon)_ |

---

## Quick start

### Using an existing plugin

```js
import { loadPlugin } from '@wadspa/core';
import * as amp from '@wadspa/amp';

const ctx = new AudioContext();
const node = await loadPlugin(ctx, amp);

node.set('Gain (dB)', -6);        // fuzzy name match — case, spaces, punctuation ignored
source.connect(node.input);
node.output.connect(ctx.destination);
```

### Chaining plugins

```js
const eq  = await loadPlugin(ctx, djEqMono);
const amp = await loadPlugin(ctx, ampPlugin);

// oscillator → EQ → amp → speakers
osc.connect(eq.input);
eq.output.connect(amp.input);
amp.output.connect(ctx.destination);
```

### Building your own plugin

```sh
npm install -g @wadspa/toolchain   # requires Emscripten (emcc on PATH)

wadspa build ./my-plugin --out ./dist
```

See the [toolchain README](./toolchain) and the [plugin porting guide](./docs/porting-a-plugin.md) for a full walkthrough.

---

## Architecture

```
your code
    │
    ▼
@wadspa/core          loadPlugin(ctx, pluginModule)
    │                   fetches .wasm, loads .js into AudioWorklet
    │
    ▼
AudioWorkletNode      runs in a dedicated audio thread
    │                   one per plugin instance
    │
    ▼
plugin.wasm           compiled LADSPA plugin + shim
                        shim_init / shim_run / shim_set_* / shim_input_buf_* ...
```

The **toolchain** (`wadspa build`) handles the C → WASM compilation:

```
plugin.c  ──┐
            ├── [inspect] native binary reads ladspa_descriptor(0) → port JSON
            │
            ├── [shim]    generates _wadspa_shim.c with named C exports
            │
            ├── [emcc]    compiles plugin.c + _wadspa_shim.c → plugin.js + plugin.wasm
            │
            └── [emit]    writes processor.js, index.js, package.json
```

---

## Audio routing

**Mono plugins** (1 audio in, 1 audio out):
```js
source.connect(node.input);
node.output.connect(ctx.destination);
```

**Stereo plugins** (2 audio in, 2 audio out — e.g. reverbs, chorus):
```js
source.connect(node.input);          // stereo source, stereo output
node.output.connect(ctx.destination);
```

Stereo detection is automatic: a plugin with exactly 2 audio input ports and 2 audio output ports gets a single stereo `AudioWorkletNode` (1 input × 2 channels, 1 output × 2 channels). Everything else gets N separate mono ports.

---

## Included plugins

| Package | Plugin | Ports | Description |
|---|---|---|---|
| `@wadspa/amp` | Simple Amplifier | gain, audio in/out | Clean gain stage |
| `@wadspa/dj-eq-mono` | DJ EQ (mono) | lo/mid/hi gain, audio in/out | 3-band DJ-style EQ |

More plugins from the [Steve Harris SWH collection](https://github.com/swh/ladspa) are being compiled and will be published as separate packages.

---

## Browser support

| Browser | Support |
|---|---|
| Chrome 66+ | ✅ |
| Safari 14.5+ | ✅ |
| Firefox 76+ | ✅ |
| Edge 79+ | ✅ |

Requires `AudioWorklet` and `WebAssembly` — available in all modern evergreen browsers.

---

## Repo layout

```
wadspa/
  core/              @wadspa/core — runtime host
  toolchain/         @wadspa/toolchain — build CLI
  plugins/
    amp/             Simple Amplifier — source + dist/
    dj_eq/           DJ EQ mono — source + dist/
  demo/              browser demo: osc → dj_eq → amp → output
  docs/              guides: porting plugins, architecture
  swh-plugins/       Steve Harris LADSPA collection (reference source)
```

---

## License

MIT
