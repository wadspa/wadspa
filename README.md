# wadspa

**LADSPA and LV2 audio plugins compiled to WebAssembly, published as npm packages.**

wadspa takes the battle-tested [LADSPA](https://www.ladspa.org/) and [LV2](https://lv2plug.in/) plugin ecosystems — hundreds of high-quality audio effects and instruments written in C and C++ — and makes them available in any browser via the Web Audio API. Each plugin is a self-contained `.wasm` binary loaded as an `AudioWorkletNode`. No native code. No security issues. No browser-update breakage.

---

## Why wadspa?

Existing browser plugin formats (CLAP, WAM, Web Audio Modules) repeatedly break as browsers tighten security around `SharedArrayBuffer`, cross-origin isolation, and WASM instantiation. wadspa avoids all of that:

- **Standard Web Audio API** — uses `AudioWorkletNode`, which every modern browser supports and has no plans to remove
- **LADSPA effects** — hundreds of production-ready C audio effects compiled to WASM with no changes to the source
- **LV2 instruments** — polyphonic MIDI instruments written in C or C++, with full ADSR, FM synthesis, and more
- **No shared memory by default** — each plugin owns its WASM heap; no `SharedArrayBuffer` required unless threading is explicitly enabled
- **Threading support** — plugins that use pthreads compile with `--threads`; a COI service worker handles GitHub Pages header restrictions automatically
- **File I/O** — plugins that read data files (wavetables, IRs, presets) use Emscripten's embedded FS (`--embed-file`), baked into the WASM binary at build time
- **GTK / Qt UI skipped automatically** — LV2 separates DSP from UI; wadspa compiles only the DSP layer, automatically excluding `*_gtk.*` and `*_qt*.*` source files
- **Zero runtime dependencies** — plugins are plain npm packages; `@wadspa/core` is a single 97-line file

---

## Packages

| Package | Description | npm |
|---|---|---|
| [`@wadspa/core`](./core) | Runtime: load and connect wadspa plugins | _(coming soon)_ |
| [`@wadspa/toolchain`](./toolchain) | CLI: compile LADSPA/LV2 source into a wadspa npm package | _(coming soon)_ |

---

## Quick start

### Using an existing effect (LADSPA)

```js
import { loadPlugin } from '@wadspa/core';
import * as djEq from '@wadspa/dj-eq-mono';

const ctx = new AudioContext();
const node = await loadPlugin(ctx, djEq);

node.set('Lo gain (dB)', -6);
source.connect(node.input);
node.output.connect(ctx.destination);
```

### Using an instrument (LV2)

```js
import { loadPlugin } from '@wadspa/core';
import * as fmSynth from '@wadspa/fm_synth';

const ctx  = new AudioContext();
const inst = await loadPlugin(ctx, fmSynth);

inst.noteOn(60, 100);   // middle C, velocity 100
inst.output.connect(ctx.destination);
```

### Chaining effects

```js
const eq  = await loadPlugin(ctx, djEqMono);
const rev = await loadPlugin(ctx, plateReverb);

source.connect(eq.input);
eq.output.connect(rev.input);
rev.output.connect(ctx.destination);
```

### Building your own plugin

```sh
npm install -g @wadspa/toolchain   # requires Emscripten (emcc on PATH)

# LADSPA effect
wadspa build ./my-effect

# LV2 instrument (C or C++)
wadspa build-lv2 ./my-instrument --include /opt/homebrew/include

# LV2 with threading
wadspa build-lv2 ./my-instrument --threads

# LV2 with embedded data files
wadspa build-lv2 ./my-instrument --embed-file data/wavetable.bin@/data/wavetable.bin
```

---

## Architecture

```
your code
    │
    ▼
@wadspa/core              loadPlugin(ctx, pluginModule)
    │                       fetches .wasm, loads .js into AudioWorklet
    │
    ▼
AudioWorkletNode          runs in a dedicated audio thread
    │                       one per plugin instance
    │
    ▼
plugin.wasm               compiled plugin + shim
                            LADSPA: shim_init / shim_run / shim_set_* / shim_input_buf_*
                            LV2:    shim_init / shim_run / shim_midi_note_on/off / shim_set_*
```

### LADSPA build pipeline

```
plugin.c ──┐
           ├── [inspect] native binary reads ladspa_descriptor(0) → port JSON
           ├── [shim]    generates _wadspa_shim.c with named C exports
           ├── [emcc]    compiles plugin.c + _wadspa_shim.c → .js + .wasm
           └── [emit]    writes processor.js, index.js, package.json
```

### LV2 build pipeline

```
plugin.cpp + plugin.ttl ──┐
                           ├── [parse]  reads Turtle RDF for port metadata
                           ├── [shim]   generates _wadspa_lv2_shim.c
                           │           (URID map, atom MIDI, typed exports)
                           ├── [emcc]   compiles plugin sources + shim → .js + .wasm
                           │           UI files (*_gtk.*, *_qt*.*) excluded automatically
                           └── [emit]   writes processor.js, index.js, package.json
```

---

## Plugin manifest fields

`plugins/instruments.json` supports these per-entry fields:

```json
{
  "id":           "my_synth",
  "description":  "What this instrument does",
  "threads":      false,
  "memoryGrowth": false,
  "embedFiles":   ["data/wavetable.bin@/data/wavetable.bin"]
}
```

| Field | Default | Description |
|---|---|---|
| `threads` | `false` | Compile with `-pthread` (requires COOP/COEP headers — handled by `coi-serviceworker.js`) |
| `memoryGrowth` | `false` | Allow WASM heap to grow at runtime |
| `embedFiles` | `[]` | Files to embed in the WASM virtual FS at build time (`src@/virtual/path`) |

---

## Audio routing

**Mono effects** (1 audio in, 1 audio out):
```js
source.connect(node.input);
node.output.connect(ctx.destination);
```

**Stereo effects / instruments** (2 audio out):
```js
source.connect(node.input);
node.output.connect(ctx.destination);
```

Stereo detection is automatic. LV2 instruments always output stereo (L + R).

---

## Browser support

| Browser | Support |
|---|---|
| Chrome 66+ | ✅ |
| Safari 14.5+ | ✅ |
| Firefox 76+ | ✅ |
| Edge 79+ | ✅ |

Threaded plugins (`threads: true`) additionally require `crossOriginIsolated`. The included `docs/coi-serviceworker.js` handles this automatically for GitHub Pages deployments.

---

## Repo layout

```
wadspa/
  core/              @wadspa/core — runtime host
  toolchain/         @wadspa/toolchain — build CLI (LADSPA + LV2)
  plugins/
    manifest.json    LADSPA effect registry (32+ plugins)
    instruments.json LV2 instrument registry
    wadspa_synth/    8-voice polyphonic sawtooth synth (LV2, C)
    fm_synth/        2-operator FM synthesizer (LV2, C++)
    sc4/             SC4 stereo compressor (LADSPA)
    plate/           Plate reverb (LADSPA)
    …                32+ LADSPA effects from swh-plugins, more being added
  scripts/
    build-all.js         Build all LADSPA effects → docs/plugins/catalog.json
    build-instruments.js Build all LV2 instruments → docs/instruments.json
    test-instruments.js  Node WASM smoke test (non-threaded instruments)
  docs/
    coi-serviceworker.js COOP/COEP header injection for GitHub Pages
  swh-plugins/       Steve Harris LADSPA collection (98 plugins, 32 built so far)
```

---

## License

MIT
