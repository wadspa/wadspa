# wadspa

**LADSPA and LV2 audio plugins compiled to WebAssembly, published as npm packages.**

wadspa takes the battle-tested [LADSPA](https://www.ladspa.org/) and [LV2](https://lv2plug.in/) plugin ecosystems — hundreds of high-quality audio effects and instruments written in C and C++ — and makes them available in any browser via the Web Audio API. Each plugin is a self-contained `.wasm` binary loaded as an `AudioWorkletNode`. No native code. No security issues. No browser-update breakage.

**Live browser test page:** [wadspa.github.io/wadspa](https://wadspa.github.io/wadspa/)

---

## Why wadspa?

Existing browser plugin formats (CLAP, WAM, Web Audio Modules) repeatedly break as browsers tighten security around `SharedArrayBuffer`, cross-origin isolation, and WASM instantiation. wadspa avoids all of that:

- **Standard Web Audio API** — uses `AudioWorkletNode`, which every modern browser supports and has no plans to remove
- **LADSPA effects** — hundreds of production-ready C audio effects compiled to WASM with no changes to the source
- **LV2 plugins** — effects and MIDI instruments written in C or C++, from filters and processors to full polyphonic synthesizers
- **Qt plugin support** — `toolchain/qt-stub/` is a header-only Qt shim that lets Qt-dependent LV2 DSP layers (synthv1, drumkv1, padthv1, …) compile to WASM without any Qt installation
- **Fully automated pipeline** — adding a new plugin repo requires one entry in `sources.json`; `setup-all.js` and `build-instruments.js` handle the rest
- **GTK / Qt UI skipped automatically** — LV2 separates DSP from UI; wadspa compiles only the DSP layer, excluding `*_gtk.*` and `*_qt*.*` source files
- **Zero runtime dependencies** — plugins are plain npm packages; `@wadspa/core` is a single 97-line file

---

## Instruments (18)

| Plugin | Description |
|--------|-------------|
| `wadspa_synth` | 8-voice polyphonic sawtooth with ADSR and lowpass filter |
| `fm_synth` | 2-operator FM synthesizer, 8-voice polyphonic |
| `mda_DX10` | FM synthesizer, 8-voice polyphonic |
| `mda_JX10` | Virtual analog polysynth, 8-voice |
| `mda_EPiano` | Electric piano (Rhodes/Wurlitzer style) |
| `mda_Piano` | Acoustic piano physical model |
| `synthv1` | Dual-oscillator polyphonic analog synthesizer (rncbc) |
| `drumkv1` | Per-pad drum synthesizer with per-pad synthesis and effects (rncbc) |
| `padthv1` | Polyphonic additive synthesizer using the PADsynth algorithm (rncbc) |
| `amsynth` | 32-voice analog modeling synthesizer |
| `so-404` | SO-404 bass synthesizer — TB-303-style bass synth clone |
| `so-kl5` | SO-kl5 electric piano clone |
| `so-666` | SO-666 feedback oscillator synthesizer |
| `tsf` | TinySoundFont General MIDI SF2 soundfont synthesizer |
| `samplv1` | Polyphonic sampler LV2 (requires an external sample) |
| `sorcer` | Polyphonic wavetable synthesizer LV2 |
| `string-machine` | Polyphonic string ensemble synthesizer LV2 |
| `geonkick` | MIDI-triggered kick drum synthesizer using the Geonkick DSP core |

Plus 32+ LADSPA effects (reverb, chorus, EQ, dynamics, …) all available on the browser test page.

## Top LV2 Synth Targets

The requested top-20 LV2 synth list is tracked in [`docs/top-lv2-synths.json`](./docs/top-lv2-synths.json). Exact targets that are already browser-built are marked `supported`; the rest are `candidate` entries with source repos in `sources.json` and notes for the remaining porting work.

```sh
npm run test:top-lv2-synths
npm run test:top-lv2-synths:strict
```

The normal test keeps the support matrix honest. The strict test intentionally fails until every one of the 20 targets is packaged as a browser MIDI instrument.

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

# LV2 plugin (instrument or effect, C or C++)
wadspa build-lv2 ./my-plugin --include /opt/homebrew/include

# LV2 with threading
wadspa build-lv2 ./my-plugin --threads

# LV2 with embedded data files
wadspa build-lv2 ./my-plugin --embed-file data/wavetable.bin@/data/wavetable.bin
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
                           │           concatenates multiple TTL files when ports
                           │           are split across them (e.g. fil4)
                           ├── [shim]   generates _wadspa_lv2_shim.c
                           │           · URID map (strings → uint32 IDs)
                           │           · LV2_Options feature (nominalBlockLength /
                           │             maxBlockLength) required by DPF plugins
                           │           · atom MIDI input/output buffers
                           │           · URI-based descriptor search (handles plugins
                           │             that export multiple descriptors)
                           │           · typed audio buffer / control port exports
                           ├── [emcc]   compiles plugin sources + shim → .js + .wasm
                           │           UI files (*_gtk.*, *_qt*.*) excluded automatically
                           └── [emit]   writes processor.js, index.js, package.json
```

### Qt stub library (`toolchain/qt-stub/`)

Qt-dependent LV2 plugins (such as the rncbc suite — synthv1, drumkv1, padthv1) use Qt only for their DSP configuration layer: `QSettings`, `QMap`, `QHash`, `QDomDocument`, `QString`, etc. The `toolchain/qt-stub/` directory provides header-only C++ implementations of all these types backed by `std::` containers, with no Qt installation required.

To use it, add `"includes": ["toolchain/qt-stub"]` to the plugin's `lv2.json` entry. The `build-instruments.js` script resolves this path automatically.

`toolchain/qt-stub/fftw3.h` provides a minimal FFTW3 float API stub for plugins that only need the header (not FFT performance). For PADsynth-style plugins that perform large IFFTs at init time, use `toolchain/kissfft/` instead — it provides a full O(N log N) implementation of the same FFTW3 float API.

### kissfft FFT library (`toolchain/kissfft/`)

`toolchain/kissfft/` provides a drop-in FFTW3 float API backed by [kissfft](https://github.com/mborgerding/kissfft) — an O(N log N) FFT with no external dependencies. It is required for PADsynth-style synthesizers (padthv1) that pre-generate large wavetables (up to 65536 points) at instantiation time.

To use it, list `toolchain/kissfft` in `includes` **before** `toolchain/qt-stub`, and prepend the three kissfft sources to the `sources` list:

```json
{
  "id": "padthv1",
  "includes": ["toolchain/kissfft", "toolchain/qt-stub"],
  "sources": [
    "../../toolchain/kissfft/kiss_fft.c",
    "../../toolchain/kissfft/kiss_fftr.c",
    "../../toolchain/kissfft/fftw3_kissfft.c",
    "padthv1.cpp", "..."
  ]
}
```

The include order matters: `toolchain/kissfft/fftw3.h` takes priority over `toolchain/qt-stub/fftw3.h`.

---

## Adding a new plugin

The pipeline is fully automated. To add any LV2 plugin repo:

**1. Add one entry to `sources.json`:**
```json
{
  "id": "my-synth",
  "git": "https://github.com/author/my-synth.git",
  "setup": "setup-my-synth",
  "description": "My synthesizer plugin"
}
```

**2. Clone and build:**
```sh
node scripts/fetch-sources.js --only my-synth
node scripts/setup-all.js --only my-synth
node scripts/build-instruments.js --only my-synth
```

If no dedicated `setup-my-synth.js` exists, `setup-all.js` falls back to `auto-setup.js`, which discovers source files, detects Qt headers, handles `.ttl.in` templates, and iteratively resolves compile errors automatically.

For source repositories that contain multiple instruments, add `targets` to `sources.json`. Target ids work with both fetch and setup:

```json
{
  "id": "big-plugin-suite",
  "git": "https://example.com/big-plugin-suite.git",
  "setup": null,
  "description": "A suite with several LV2 instruments",
  "targets": [
    {
      "id": "my-synth",
      "bundle": "plugins/my-synth.lv2",
      "autoSetup": true,
      "description": "My Synth instrument"
    }
  ]
}
```

```sh
node scripts/fetch-sources.js --only my-synth
node scripts/setup-all.js --only my-synth
node scripts/build-instruments.js --only my-synth
node scripts/test-instruments.js --only my-synth
node scripts/test-sliders.js --only my-synth --ui-defaults
```

Set `autoSetup` to `false` for large JUCE/DPF/modular instruments that need a dedicated setup script. That keeps setup output explicit instead of running a generic build that cannot reasonably succeed.

For Qt-dependent plugins that need custom stub generation (QThread scheduler replacement, libsndfile substitution, etc.), write a `scripts/setup-<id>.js` following the pattern of `setup-drumkv1.js` or `setup-padthv1.js`.

---

## Plugin manifest fields

LV2 registry entries live in `plugins/lv2.json`:

```json
{
  "id":           "my_synth",
  "description":  "What this plugin does",
  "category":     "Instruments",
  "includes":     ["toolchain/qt-stub"],
  "sources":      ["my_synth.cpp", "my_synth_lv2.cpp"],
  "threads":      false,
  "memoryGrowth": false,
  "embedFiles":   []
}
```

| Field | Default | Description |
|---|---|---|
| `includes` | `[]` | Extra include directories, relative to repo root |
| `sources` | (auto) | Source files to compile; paths relative to plugin dir |
| `threads` | `false` | Compile with `-pthread` |
| `memoryGrowth` | `false` | Allow WASM heap to grow at runtime |
| `embedFiles` | `[]` | Files to embed in the WASM virtual FS |
| `noTest` | `false` | Skip in `test-instruments.js` (use for plugins that require external sample files to produce sound) |

---

## Build scripts

```sh
# Clone / update all source repos, or the source that owns a target id
node scripts/fetch-sources.js
node scripts/fetch-sources.js --only vitalium

# Prepare plugin directories from source repos or source targets
node scripts/setup-all.js
node scripts/setup-all.js --only vitalium

# Build all LV2 plugins → docs/instruments.json + docs/plugins/catalog.json
node scripts/build-instruments.js

# Build all LADSPA effects → docs/plugins/catalog.json
node scripts/build-all.js

# Auto-setup any LV2 repo (source discovery + iterative compile)
node scripts/auto-setup.js path/to/repo --id my-plugin

# Smoke-test LV2 plugins in Node
node scripts/test-instruments.js
```

---

## Audio routing

**Effects** (audio in → audio out):
```js
source.connect(node.input);
node.output.connect(ctx.destination);
```

**Instruments** (MIDI in → audio out):
```js
inst.noteOn(60, 100);   // middle C, velocity 100
inst.noteOff(60);
inst.output.connect(ctx.destination);
```

Stereo detection is automatic — all bundled instruments output stereo (L + R).

---

## Browser support

| Browser | Support |
|---|---|
| Chrome 66+ | ✅ |
| Safari 14.5+ | ✅ |
| Firefox 76+ | ✅ |
| Edge 79+ | ✅ |

Threaded plugins (`threads: true`) additionally require `crossOriginIsolated`. The included `docs/coi-serviceworker.js` handles this for GitHub Pages deployments.

---

## Repo layout

```
wadspa/
  core/                    @wadspa/core — runtime host
  toolchain/
    bin/wadspa.js           CLI entry point (build, build-lv2)
    src/
      shim-ladspa.js        LADSPA shim generator
      shim-lv2.js           LV2 shim generator (URID map, LV2_Options, atom MIDI, URI search)
      compile.js            emcc invocation
    qt-stub/                Header-only Qt shim for Qt-dependent LV2 DSP layers
      qglobal.h             Q_OBJECT macros, QChar, qDeleteAll, Qt:: namespace enums
      QString               std::string wrapper with full Qt string API
      QMap / QHash          std::map / std::unordered_map with Qt iterator API
      QSettings             Inheritable settings class (no-op in WASM)
      QDomDocument          XML DOM stub (no-op)
      QFile / QFileInfo     File I/O stubs (no-op)
      QMutex / QThread      Threading stubs (no-op; WASM is single-threaded)
      fftw3.h               Minimal FFTW3 float API stub (use kissfft/ for PADsynth)
      …                     QVariant, QList, QVector, QStringList, QObject, QApplication
    kissfft/                O(N log N) FFT — drop-in FFTW3 float API via kissfft
      kiss_fft.c/h          Core complex FFT (arbitrary size)
      kiss_fftr.c/h         Real FFT (N/2+1 complex output)
      fftw3_kissfft.c       fftwf_plan_r2r_1d / fftwf_plan_dft_r2c_1d / etc.
      fftw3.h               FFTW3 float API header (takes priority over qt-stub/fftw3.h)
  plugins/
    manifest.json           LADSPA effect registry (32+ plugins)
    lv2.json                LV2 plugin registry (27 instruments + effects)
    synthv1/                Dual-oscillator polyphonic analog synthesizer
    drumkv1/                Per-pad drum synthesizer
    padthv1/                PADsynth additive synthesizer
    amsynth/                Analog modeling synthesizer
    geonkick/               Kick drum synthesizer using the Geonkick DSP core
    wadspa_synth/           Built-in 8-voice sawtooth synth (LV2, C)
    fm_synth/               2-operator FM synthesizer (LV2, C++)
    mda_*/                  MDA LV2 collection (instruments + effects)
    so-404/ so-kl5/ so-666/ SO-synth collection (bass, piano, feedback)
    sc4/ plate/ …           32+ LADSPA effects from swh-plugins
  scripts/
    fetch-sources.js         Clone / update all repos listed in sources.json
    setup-all.js             Run setup scripts/targets; falls back to auto-setup.js
    auto-setup.js            Generic LV2 setup: source discovery, Qt detection, iterative build
    setup-synthv1.js         synthv1 (Qt stub wiring, sched replacement)
    setup-drumkv1.js         drumkv1 (Qt stub, sched, libsndfile stub)
    setup-padthv1.js         padthv1 (Qt stub, sched, FFTW3 stub)
    setup-amsynth.js         amsynth preparation
    setup-geonkick.js        Geonkick DSP-core wrapper preparation
    setup-mda-lv2.js         MDA LV2 plugin preparation
    setup-so-synth.js        SO-synth (legacy LV2 event API)
    build-instruments.js     Build all LV2 plugins → docs/
    test-top-lv2-synths.js   Verify requested top synth targets and strict support gate
    build-all.js             Build all LADSPA effects → docs/
    test-instruments.js      Node WASM smoke test for LV2 plugins
  sources.json               External plugin repos (git URLs + setup script mapping)
  docs/
    index.html               GitHub Pages browser test page
    instruments.json         Built instrument catalog (generated by build-instruments.js)
    plugins/catalog.json     Built effects catalog
    coi-serviceworker.js     COOP/COEP header injection for GitHub Pages
    porting-a-plugin.md      Guide to adding new plugins
```

---

## License

MIT
