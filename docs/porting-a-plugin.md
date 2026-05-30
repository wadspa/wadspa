# Porting a Plugin to wadspa

There are two paths depending on what kind of plugin you're porting:

- **SWH LADSPA plugin** — use the automated bulk-build pipeline (`scripts/build-all.js`)
- **Custom LADSPA plugin** — use `wadspa build` directly
- **LV2 instrument** — use `wadspa build-lv2`

---

## Path 1: SWH LADSPA plugin (automated)

The [Steve Harris SWH collection](https://github.com/swh/ladspa) is already wired into the build pipeline. Adding a plugin takes one manifest entry and one command.

### 1. Add an entry to `plugins/manifest.json`

```json
{
  "id": "my_plugin",
  "xml": "my_plugin_1234.xml",
  "npmName": "@wadspa/my-plugin"
}
```

Fields:

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Directory name under `plugins/` |
| `xml` | yes | XML filename in `swh-plugins/` |
| `npmName` | yes | npm package name |
| `util` | no | Header files to copy from `plugins/shared/util/` (e.g. `["biquad.h"]`) |
| `utilSrc` | no | C source files to compile from `plugins/shared/util/` (e.g. `["db.c","rms.c"]`) |

### 2. Run the build script

```sh
# build just this plugin
node scripts/build-all.js --only my_plugin

# build everything not yet built
node scripts/build-all.js --skip-existing

# build everything from scratch
node scripts/build-all.js
```

The script handles everything automatically:
- Generates C source from the XML descriptor via `makestub.pl`
- Copies `ladspa.h`, `ladspa-util.h`, and `config.h` from `plugins/shared/`
- Copies any `util/` headers and C sources listed in the manifest
- Runs `wadspa build` with the right flags
- Writes the compiled package to `plugins/<id>/dist/`

### Common `util` dependencies

| Plugin type | `util` | `utilSrc` |
|-------------|--------|-----------|
| Filters / EQ | `["biquad.h"]` | — |
| Compressor / dynamics | `["db.h","rms.h"]` | `["db.c","rms.c"]` |
| Waveguide / physical | `["waveguide_nl.h"]` | — |

All these files live in `plugins/shared/util/` and are already patched (biquad uses `double` literals; no float-precision surprises).

---

## Path 2: Custom LADSPA plugin

For plugins not in the SWH collection — third-party C code, original effects, etc.

### 1. Create the plugin directory

```
plugins/my_plugin/
  my_plugin.c       LADSPA plugin source
  ladspa.h          copy from plugins/shared/ladspa.h
  config.h          copy from plugins/shared/config.h (if needed)
```

Any headers the plugin uses must be reachable. If they live alongside the C file, `--include` points there automatically. For extra directories, pass additional `--include` flags.

### 2. Build

```sh
wadspa build plugins/my_plugin --name @wadspa/my-plugin
```

The toolchain:
1. Loads the compiled `.so` natively to inspect ports
2. Generates a C shim exposing `shim_init`, `shim_run`, and typed getters/setters
3. Compiles the plugin + shim with `emcc` to `.js` + `.wasm`
4. Writes `dist/` with `index.js`, `processor.js`, `package.json`

Output:

```
→ Inspecting plugin...
  My Plugin (id=1234, 4 ports)
  [0] input  control  Gain (dB) (-70..6, default=0)
  ...
→ Generating shim.c...
→ Compiling to WASM...
  my_plugin.js   (8KB)
  my_plugin.wasm (5KB)
→ Package written to plugins/my_plugin/dist
  @wadspa/my-plugin
```

---

## Path 3: LV2 instrument

LV2 instruments (synthesizers, samplers) take MIDI in and produce audio out. The toolchain reads their Turtle (`.ttl`) metadata directly — no native binary inspection needed.

### 1. Write the plugin

A minimal LV2 instrument directory:

```
plugins/my_synth/
  manifest.ttl      declares the plugin URI and binary
  my_synth.ttl      declares all ports
  my_synth.c        LV2 plugin implementation
```

`manifest.ttl`:
```turtle
@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<https://wadspa.org/plugins/my_synth>
    a lv2:Plugin ;
    lv2:binary <my_synth.so> ;
    rdfs:seeAlso <my_synth.ttl> .
```

`my_synth.ttl` — declare ports with `lv2:index`, `lv2:symbol`, direction, and type. MIDI input uses `atom:AtomPort` + `atom:supports midi:MidiEvent`.

Required LV2 features: `urid:map`. The shim provides a minimal URID map implementation — your plugin does not need to bundle one.

### 2. Build

```sh
wadspa build-lv2 plugins/my_synth --include /opt/homebrew/include
```

The `--include` path must contain the LV2 headers (`lv2/`, `lv2.h`). On macOS with Homebrew: `/opt/homebrew/include`. On Linux: `/usr/include`.

The toolchain:
1. Parses the `.ttl` files to discover all ports
2. Generates a C shim with a URID map, MIDI atom buffer, and typed accessors
3. Compiles to `.js` + `.wasm`
4. Writes `dist/` with `index.js`, `processor.js`, `package.json`

### 3. Use in the browser

```js
import { loadPlugin } from '@wadspa/core';

const ctx  = new AudioContext();
const synth = await loadPlugin(ctx, mySynthModule);

synth.output.connect(ctx.destination);

// MIDI
synth.noteOn(60, 100);   // middle C, velocity 100
synth.noteOff(60);

// Controls
synth.set('Filter Cutoff', 0.7);
synth.set('Attack', 0.05);
```

---

## Shared headers (`plugins/shared/`)

All canonical headers live here. Never edit them inside individual plugin directories — patch `plugins/shared/` instead.

| File | Notes |
|------|-------|
| `ladspa.h` | Standard LADSPA API |
| `ladspa-util.h` | SWH utility macros |
| `config.h` | Autotools stub (empty, WASM is always little-endian) |
| `util/biquad.h` | Fully patched — all float literals replaced with double |
| `util/iir.h/c` | IIR filter implementation |
| `util/rms.h/c` | RMS envelope follower |
| `util/db.h/c` | dB conversion utilities |
| `util/buffer.h/c` | Ring buffer |
| `util/waveguide_nl.h` | Nonlinear waveguide |

The biquad patch (`double` literals throughout) prevents catastrophic cancellation at low frequencies. The toolchain also passes `-DBIQUAD_TYPE=double` automatically.

---

## Troubleshooting

**`emcc: requires python 3.10 or above`** — a Python virtualenv with an older Python is active. The toolchain strips venv paths from `PATH` before invoking `emcc`, but if you hit this manually, deactivate the venv first.

**`ladspa_descriptor returned NULL`** — the native inspector calls `ladspa_descriptor(0)`. Make sure your plugin exports that symbol and index 0 returns a valid descriptor.

**Plugin sounds wrong at low frequencies** — float precision in biquad. Confirm you're using the `biquad.h` from `plugins/shared/util/` (already patched) and not a fresh copy from the SWH repo.

**LV2 port count is wrong** — the TTL parser matches all `[...]` blocks in the `.ttl` file. Make sure each port block contains `lv2:index`, `lv2:symbol`, and a direction/type triple.

**Stuck notes (LV2 synth)** — if rapid re-clicks cause notes to sustain indefinitely, check that `note_on` prefers to retrigger an existing voice for that MIDI note before allocating a new one. See `plugins/wadspa_synth/wadspa_synth.c` for the reference implementation.

---

## Porting checklist

**LADSPA (SWH)**
- [ ] Entry added to `plugins/manifest.json`
- [ ] `util` / `utilSrc` fields set for any external headers
- [ ] `node scripts/build-all.js --only <id>` succeeds
- [ ] Plugin tested in browser (Chrome + Safari)

**LADSPA (custom)**
- [ ] `ladspa_descriptor(0)` exported and returns a valid descriptor
- [ ] All headers reachable from the build dir
- [ ] `wadspa build` succeeds and port list looks correct
- [ ] Plugin tested in browser

**LV2**
- [ ] `manifest.ttl` and plugin `.ttl` present and parseable
- [ ] All ports have `lv2:index`, `lv2:symbol`, direction, and type
- [ ] `wadspa build-lv2 --include <lv2-headers>` succeeds
- [ ] MIDI note-on/off tested in browser (Chrome + Safari)
- [ ] Controls respond to `synth.set()`
