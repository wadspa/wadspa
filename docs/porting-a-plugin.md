# Porting a LADSPA Plugin to wadspa

This guide walks through porting a real LADSPA plugin from the [Steve Harris SWH collection](https://github.com/swh/ladspa) to a published wadspa npm package.

We'll use the **DJ EQ (mono)** plugin as the working example — it has external utility headers, a `config.h` dependency, and uses biquad filters, so it covers all the common complications.

---

## Prerequisites

- Emscripten installed and on `$PATH` (`emcc --version` works)
- `@wadspa/toolchain` installed globally (`wadspa build` works)
- The `swh-plugins` source tree cloned somewhere (used for utility headers)

---

## Step 1: Find the plugin source

SWH plugins are generated from XML descriptors. Each plugin is a single `<label>.c` file inside the build output. For `dj_eq_mono`, the relevant files are:

```
swh-plugins/
  dj_eq_1901.xml          descriptor (ports, metadata)
  ladspa-util.h           utility macros used by many plugins
  util/
    biquad.h              biquad filter implementation
```

The generated `.c` file (`dj_eq_mono_1907.c` or similar) is what you'd get from running the SWH build system. For wadspa we write or adapt it directly, since we don't run `make`.

---

## Step 2: Set up the plugin directory

```
dj_eq/
  ladspa.h          copy from wadspa/amp/ladspa.h
  ladspa-util.h     copy from swh-plugins/ladspa-util.h
  config.h          stub (see below)
  dj_eq.c           plugin implementation
  util/
    biquad.h        copy from swh-plugins/util/biquad.h
```

**`config.h` stub** — the SWH plugins assume autotools generated this. For WASM we don't need it, but the headers `#include` it. Create a stub:

```c
/* config.h — stub for wadspa (WASM is always little-endian) */
```

---

## Step 3: Handle biquad float precision

The `util/biquad.h` uses `BIQUAD_TYPE` (defaulting to `float`) for its filter coefficients. At typical audio sample rates, low-frequency bands involve differences between nearly-equal numbers — this causes catastrophic cancellation with 32-bit floats.

Two changes are required:

**a)** Pass `--define BIQUAD_TYPE=double` to the build (the toolchain does this automatically with `-DBIQUAD_TYPE=double`).

**b)** Replace `float` literals in `biquad.h` with `double` literals — Emscripten won't promote them automatically:

```c
// Before
#define B_BUTTER_SHIFT(b,xn) (...)
  c->b1 = 2.0f * (k * k - 1.0f) * ...

// After
#define B_BUTTER_SHIFT(b,xn) (...)
  c->b1 = 2.0 * (k * k - 1.0) * ...
```

Run a global find-and-replace in `util/biquad.h`: `0.0f` → `0.0`, `1.0f` → `1.0`, `2.0f` → `2.0`, `0.5f` → `0.5`.

---

## Step 4: Build

```sh
wadspa build ./dj_eq --include ./dj_eq --name @wadspa/dj-eq-mono
```

The `--include ./dj_eq` tells the compiler where to find `ladspa-util.h` and `config.h` when they're included from within `dj_eq.c`.

Expected output:

```
→ Inspecting plugin...
  DJ EQ (mono) (id=1907, 6 ports)
  [0] input  control  Lo gain (dB) (-70..6, default=0)
  [1] input  control  Mid gain (dB) (-70..6, default=0)
  [2] input  control  Hi gain (dB) (-70..6, default=0)
  [3] input  audio    Input
  [4] output audio    Output
  [5] output control  Latency
→ Generating shim.c...
→ Compiling to WASM...
  dj_eq_mono.js  (81KB)
  dj_eq_mono.wasm  (5KB)
→ Package written to ./dj_eq/dist
  @wadspa/dj-eq-mono
```

---

## Step 5: Test in the browser

Serve the `dist/` directory (or copy the files to a demo page) and load the plugin:

```js
import { loadPlugin } from '@wadspa/core';
import * as djEq from './dj_eq/dist/index.js';

const ctx = new AudioContext();
const eq  = await loadPlugin(ctx, djEq);

eq.set('Lo gain (dB)',  -6);
eq.set('Mid gain (dB)',  0);
eq.set('Hi gain (dB)',   3);

source.connect(eq.input);
eq.output.connect(ctx.destination);
```

---

## Step 6: Publish to npm

```sh
cd dj_eq/dist
npm publish --access public
```

After publishing, users can install and use it directly:

```sh
npm install @wadspa/core @wadspa/dj-eq-mono
```

```js
import { loadPlugin } from '@wadspa/core';
import * as djEq from '@wadspa/dj-eq-mono';
```

---

## Common issues

### `config.h: No such file or directory`

Some SWH plugins include `config.h`. Create the stub file in the plugin directory:

```c
/* config.h — stub for wadspa */
```

### `ladspa-util.h: No such file or directory`

Pass the directory containing `ladspa-util.h` as `--include`:

```sh
wadspa build ./my-plugin --include ./my-plugin
```

### Plugin compiles but sounds wrong at low frequencies

Float32 precision issue in biquad filters. See Step 3 above. The toolchain always passes `-DBIQUAD_TYPE=double`, but you also need to change the float literals in `biquad.h` itself.

### `ladspa_descriptor returned NULL`

The native inspector calls `ladspa_descriptor(0)`. If your plugin only exports index > 0, or the symbol name is different, the build will fail. Make sure the symbol is exactly `ladspa_descriptor` and index `0` returns a valid descriptor.

### Plugin has no audio ports / wrong port count

Check that the `PortDescriptors` array in your `LADSPA_Descriptor` struct matches the actual `PortCount`. A mismatch causes the inspector to misread the port list.

---

## Porting checklist

- [ ] `ladspa.h` is in the plugin directory
- [ ] `ladspa_descriptor(0)` is exported and returns a valid descriptor
- [ ] External headers (e.g. `ladspa-util.h`) are accessible via `--include`
- [ ] `config.h` stub exists if the plugin headers require it
- [ ] Float literals in biquad.h replaced with double literals (if applicable)
- [ ] Plugin sounds correct in browser at multiple sample rates
- [ ] `dist/` has been tested with `@wadspa/core` in Chrome and Safari
