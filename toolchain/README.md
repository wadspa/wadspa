# @wadspa/toolchain

CLI for compiling LADSPA and LV2 plugins to wadspa npm packages (WebAssembly + AudioWorklet).

## Requirements

- **[Emscripten](https://emscripten.org/docs/getting_started/downloads.html)** — `emcc` must be on `$PATH`, or install via emsdk and run `source ~/emsdk/emsdk_env.sh`
- **Node.js 18+**
- **A native C compiler** — `cc` (used to inspect the plugin before WASM compilation)

## Installation

```sh
npm install -g @wadspa/toolchain
```

Or from this repo:

```sh
cd toolchain && npm link
```

Verify:

```sh
wadspa
# wadspa build <plugin-dir> [options]
# wadspa build-lv2 <plugin-dir> [options]
```

---

## Usage

```sh
wadspa build <plugin-dir> [options]       # LADSPA
wadspa build-lv2 <plugin-dir> [options]   # LV2
```

### Options

| Flag | Scope | Default | Description |
|---|---|---|---|
| `--out <dir>` | both | `<plugin-dir>/dist` | Output directory for the compiled package |
| `--name <name>` | both | `@wadspa/<label>` | npm package name |
| `--include <dir>` | both | _(none)_ | Extra include directory passed to the compiler (repeatable) |
| `--define <D>` | both | _(none)_ | Extra preprocessor define (repeatable) |
| `--sources <files>` | both | LADSPA: all `*.c`; LV2: all `*.c`/`*.cpp` except UI files | Comma-separated source files, relative to the plugin dir |
| `--threads` | LV2 | `false` | Enable pthreads; browser hosting requires COOP/COEP / `crossOriginIsolated` |
| `--memory-growth` | LV2 | `false` | Enable Emscripten heap growth |
| `--embed-file <src@dst>` | LV2 | _(none)_ | Embed data files into the WASM virtual filesystem |
| `--extra-export <fn>` | LV2 | _(none)_ | Export an additional shim/plugin function |
| `--extra-feature <name>` | LV2 | _(none)_ | Enable a generated LV2 host feature, such as `worker` |

---

## Walkthrough: compiling a LADSPA plugin

This example compiles the **amp** (Simple Amplifier) plugin from source.

### 1. Set up the plugin directory

```
my-plugin/
  ladspa.h      # copy from wadspa/amp/ladspa.h or any LADSPA distribution
  amp.c         # your plugin implementation
```

`ladspa.h` is the only external dependency. Copy it from `amp/ladspa.h` in this repo — it is the standard unmodified LADSPA header.

### 2. Implement the LADSPA descriptor

Your `.c` file must export `ladspa_descriptor(unsigned long index)`. When called with `index = 0`, it must return a valid `LADSPA_Descriptor*`:

```c
#include "ladspa.h"
#include <stdlib.h>
#include <math.h>

// ... plugin implementation ...

static LADSPA_Descriptor descriptor = {
  .UniqueID   = 1181,
  .Label      = "amp",
  .Name       = "Simple Amplifier",
  .Maker      = "wadspa",
  .PortCount  = 3,
  .PortDescriptors  = port_descriptors,
  .PortNames        = port_names,
  .PortRangeHints   = port_hints,
  .instantiate      = instantiate,
  .connect_port     = connect_port,
  .activate         = NULL,
  .run              = run,
  .cleanup          = cleanup,
};

const LADSPA_Descriptor * ladspa_descriptor(unsigned long index) {
  return index == 0 ? &descriptor : NULL;
}
```

See `amp/amp.c` for a complete minimal example.

### 3. Build

```sh
wadspa build ./my-plugin
```

Output:

```
→ Inspecting plugin...
  Simple Amplifier (id=1181, 3 ports)
  [0] input  control  Gain (dB) (-70..70, default=0)
  [1] input  audio    Input
  [2] output audio    Output
→ Generating shim.c...
→ Compiling to WASM...
  amp.js  (74KB)
  amp.wasm  (2KB)
→ Package written to ./my-plugin/dist
  @wadspa/amp
```

### 4. Use the package

```js
import { loadPlugin } from '@wadspa/core';
import * as amp from './my-plugin/dist/index.js';

const ctx = new AudioContext();
const node = await loadPlugin(ctx, amp);
node.set('Gain (dB)', -6);
```

Or publish to npm and import by name:

```sh
cd my-plugin/dist && npm publish --access public
```

---

## Walkthrough: compiling an LV2 plugin

LV2 builds read Turtle metadata from `manifest.ttl` and related `.ttl` files in the plugin directory. The generated package shape is the same as LADSPA packages, but the shim also hosts LV2 features such as URID mapping, atom MIDI, control symbols, and descriptor lookup by URI.

Minimal layout:

```
my-lv2-plugin/
  manifest.ttl
  my_plugin.ttl
  my_plugin.cpp
  my_plugin_lv2.cpp
```

Build:

```sh
wadspa build-lv2 ./my-lv2-plugin \
  --include ./my-lv2-plugin \
  --sources my_plugin.cpp,my_plugin_lv2.cpp
```

Common LV2 options:

```sh
# Plugins that need pthread support
wadspa build-lv2 ./my-lv2-plugin --threads

# Plugins that need data files in Emscripten's virtual FS
wadspa build-lv2 ./my-lv2-plugin --embed-file data/table.bin@/data/table.bin

# DPF/stateful plugins whose wrapper provides _shim_set_plugin_state
wadspa build-lv2 ./my-lv2-plugin \
  --extra-feature worker \
  --extra-export _shim_set_plugin_state
```

UI sources are skipped automatically for LV2 builds when they match common GTK/Qt UI filename patterns such as `*_gtk.*`, `*_qt*.*`, and `*_ui.*`.

---

## What the LADSPA build does

### Step 1 — Inspect

The toolchain compiles your plugin natively (`cc`) and runs it, calling `ladspa_descriptor(0)` to extract port metadata as JSON:

```json
{
  "id": 1181,
  "label": "amp",
  "name": "Simple Amplifier",
  "ports": [
    { "index": 0, "name": "Gain (dB)", "dir": "input", "type": "control", "min": -70, "max": 70, "default": "0" },
    { "index": 1, "name": "Input",     "dir": "input",  "type": "audio" },
    { "index": 2, "name": "Output",    "dir": "output", "type": "audio" }
  ]
}
```

This drives everything else — port names become C symbol names, control ranges become default values, audio port count determines mono vs. stereo routing.

### Step 2 — Generate shim

The toolchain writes `_wadspa_shim.c` next to your source. The shim wraps the LADSPA descriptor API in plain named C functions that Emscripten can export:

```c
void  shim_init(unsigned long sample_rate);   // instantiate + connect_port + activate
void  shim_run(unsigned long count);           // calls descriptor->run
float *shim_input_buf_input();                 // returns pointer to audio input buffer
float *shim_output_buf_output();               // returns pointer to audio output buffer
void  shim_set_gain_db(float v);               // sets control port value
float shim_get_gain_db();                      // gets control port value
```

`_wadspa_shim.c` is regenerated on every build. Do not commit it or edit it by hand.

### Step 3 — Compile

Runs `emcc` on your source files + the generated shim:

```sh
emcc amp.c _wadspa_shim.c \
  -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=1 \
  -s ENVIRONMENT='node,worker' \
  -s EXPORTED_FUNCTIONS='["_shim_init","_shim_run",...]' \
  -s EXPORTED_RUNTIME_METHODS='["HEAPF32"]' \
  -DBIQUAD_TYPE=double \
  -lm \
  -o amp.js
```

The `-DBIQUAD_TYPE=double` flag is always passed. It prevents float32 catastrophic cancellation in low-frequency biquad filters (a known issue at sample rates like 44100 Hz). It is a no-op for plugins that don't use biquads.

### Step 4 — Emit package

Writes three files to the output directory:

**`processor.js`** — the AudioWorklet processor script, statically importing the Emscripten module:

```js
import createampPlugin from './amp.js';

class WadspProcessor extends AudioWorkletProcessor {
  // initializes WASM, routes audio buffers, handles set messages
}

registerProcessor('wadspa-amp', WadspProcessor);
```

**`index.js`** — the package entry point, re-exporting plugin metadata and file URLs:

```js
export const meta         = { id: 1181, label: 'amp', ... };
export const wasmUrl      = new URL('./amp.wasm',    import.meta.url).href;
export const processorUrl = new URL('./processor.js', import.meta.url).href;
```

**`package.json`** — standard npm package manifest.

---

## What the LV2 build adds

`wadspa build-lv2` follows the same inspect/generate/compile/emit shape, but its metadata comes from LV2 Turtle files instead of a native LADSPA descriptor probe.

The generated LV2 shim provides:

- URID mapping for LV2 string URIs
- `LV2_Options` block-size features required by DPF-style plugins
- modern atom MIDI and legacy event MIDI input support
- descriptor lookup by plugin URI for bundles that export multiple descriptors
- audio, CV, control, MIDI, and atom port buffers
- named control setters/getters based on LV2 symbols
- optional worker plumbing for DPF-style plugins, plus state writes when the plugin/wrapper provides and exports `_shim_set_plugin_state`

The generated LV2 AudioWorklet processor handles:

- raw MIDI messages plus note/controller/pressure/pitch-bend helper messages from `@wadspa/core`
- stereo routing via separate mono worklet outputs for Safari compatibility
- browser-safe static imports, not dynamic `import()`
- browser-safe plugin state writes for canvas/editor surfaces; generated state writers use a small C-string encoder instead of `TextEncoder`, which is not available in target AudioWorklet environments

---

## Handling external dependencies

Some LADSPA plugins from the SWH collection include utility headers (`ladspa-util.h`, `util/biquad.h`, etc.). Pass their parent directory as `--include`:

```sh
wadspa build ./dj_eq --include ./swh-plugins
```

If the plugin uses autotools-generated `config.h`, create a stub:

```c
/* config.h — stub for wadspa build (WASM is always little-endian) */
```

The toolchain automatically compiles all `*.c` files in the plugin directory (excluding generated shims). Use `--sources` to be explicit:

```sh
wadspa build ./my-plugin --sources main.c,helper.c
```

---

## Output package layout

```
dist/
  <label>.js          Emscripten ES module — WASM loader + exports
  <label>.wasm        Compiled plugin binary
  processor.js        AudioWorklet processor with static import
  index.js            Package entry: exports meta, wasmUrl, processorUrl
  package.json        { name, version, type: "module", exports }
```

---

## Troubleshooting

**`emcc not found`** — run `source ~/emsdk/emsdk_env.sh` or set `EMCC=/path/to/emcc`.

**`No .c source files found`** — the toolchain auto-detects `*.c` in the plugin directory. Use `--sources` if they're elsewhere.

**`ladspa_descriptor returned NULL`** — your plugin only exports descriptors for index > 0, or the compile failed silently. Check that `ladspa_descriptor(0)` returns a valid pointer.

**Biquad low-frequency distortion** — compile with `-DBIQUAD_TYPE=double` (already the default). Also replace `float` literals in `biquad.h` with `double` literals (e.g. `0.0` not `0.0f`).

**Safari: Dynamic-import not available in Worklets** — caused by using `import()` inside an AudioWorklet. The toolchain generates static `import` statements — make sure you're using the output from the current toolchain, not a cached or hand-written processor.

**Chrome: URL is not defined** — caused by Emscripten's `findWasmBinary()` being called without a `locateFile` override. The toolchain always passes `locateFile: (p, d) => d + p` in the generated processor to prevent this. If you see this with a manually-written processor, add that option to your factory call.

**Canvas/editor changes do not affect sound** — for LV2 plugins that use state keys for envelopes, shaper curves, or other editor data, make sure `_shim_set_plugin_state` is exported or the `worker` feature is enabled. The generated processor should contain `function encodeCString(value)` and must not contain `TextEncoder`.
