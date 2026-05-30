# @wadspa/toolchain

CLI for compiling LADSPA C plugins to wadspa npm packages (WebAssembly + AudioWorklet).

## Requirements

- [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) (`emcc` on `$PATH`)
- [Node.js](https://nodejs.org/) 18+
- A C compiler for native inspection (`cc`)

## Installation

```sh
npm install -g @wadspa/toolchain
# or, from this repo:
cd toolchain && npm link
```

## Usage

```sh
wadspa build <plugin-dir> [options]
```

### Options

| Flag | Default | Description |
|---|---|---|
| `--out <dir>` | `<plugin-dir>/dist` | Output directory |
| `--name <name>` | `@wadspa/<label>` | npm package name |
| `--include <dir>` | _(none)_ | Extra include directory (repeatable) |
| `--define <D>` | _(none)_ | Extra preprocessor define (repeatable) |
| `--sources <files>` | all `*.c` in plugin-dir | Comma-separated source files |

### Example

```sh
wadspa build ./my-reverb --out ./dist --include ./headers
```

## What the build does

1. **Inspect** — compiles the plugin natively and calls `ladspa_descriptor(0)` to extract port metadata (names, types, ranges, defaults) as JSON.
2. **Generate shim** — writes `_wadspa_shim.c` alongside the plugin source. The shim exposes named C functions (`shim_init`, `shim_run`, `shim_set_*`, `shim_input_buf_*`, etc.) that wrap the LADSPA descriptor API.
3. **Compile** — runs `emcc` on the plugin source + shim, producing `<label>.js` and `<label>.wasm`.
4. **Emit package** — writes `processor.js` (AudioWorklet processor with static imports), `index.js` (re-exports + URL helpers), and `package.json`.

## Output package structure

```
dist/
  <label>.js          Emscripten ES module (WASM loader)
  <label>.wasm        Compiled plugin binary
  processor.js        AudioWorklet processor script
  index.js            Package entry point
  package.json        { name, version, type, exports }
```

## Writing a LADSPA plugin for wadspa

Your plugin must implement the standard LADSPA API (`ladspa.h`). The only requirement is that `ladspa_descriptor(0)` returns a valid descriptor.

```
my-plugin/
  ladspa.h           copy from the wadspa repo or any LADSPA distribution
  my-plugin.c        your plugin implementation
```

Then:

```sh
wadspa build ./my-plugin
```

### Notes

- **All audio ports are mono.** Stereo plugins have 2 audio input ports and 2 audio output ports (L/R). `@wadspa/core` automatically handles the stereo routing.
- **Biquad precision** — the toolchain always compiles with `-DBIQUAD_TYPE=double` so low-frequency biquad filters avoid float32 catastrophic cancellation. This is a no-op for plugins that don't use biquads.
- The generated `_wadspa_shim.c` is rewritten on every build and should not be committed.

## Publishing

```sh
cd dist && npm publish --access public
```

The published package exports `meta`, `wasmUrl`, and `processorUrl`, which `@wadspa/core`'s `loadPlugin` consumes directly.
