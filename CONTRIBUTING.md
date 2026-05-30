# Contributing to wadspa

Contributions are welcome — new plugins, toolchain improvements, bug fixes, and documentation. Here's how to get started.

## Types of contributions

### Porting a new plugin

The highest-value contribution is compiling a LADSPA plugin that isn't in the collection yet. See [docs/porting-a-plugin.md](./docs/porting-a-plugin.md) for a full walkthrough.

Good candidates from the SWH collection:
- `plate_1423` — plate reverb (stereo out — good stereo test case)
- `sc4_1882` — compressor
- `dyson_compress_1403` — Dyson compressor
- `flanger_1191` — flanger
- `chorus_1910` (if available) — chorus

When you open a PR for a new plugin, include:
- The plugin source directory with `*.c`, `ladspa.h`, and any required headers
- The compiled `dist/` output committed to the repo
- A one-line note in the root `README.md` plugin table

### Toolchain improvements

The toolchain lives in `toolchain/`. Key files:

| File | Purpose |
|---|---|
| `bin/wadspa.js` | CLI entry point — parses args, orchestrates the build steps |
| `src/inspect.js` | Compiles the plugin natively and extracts port metadata as JSON |
| `src/shim.js` | Generates `_wadspa_shim.c` and the AudioWorklet `processor.js` |
| `src/compile.js` | Runs `emcc` with the right flags |
| `templates/inspect.c` | C program that prints plugin port info as JSON |

### `@wadspa/core` improvements

The runtime lives in `core/src/index.js` — 97 lines. It is intentionally small. Changes here affect every plugin user, so keep the surface minimal.

---

## Development setup

```sh
git clone https://github.com/wadspa/wadspa.git
cd wadspa
npm install          # installs workspace dependencies

# Make the wadspa CLI available locally
cd toolchain && npm link && cd ..

# Start the demo server
cd demo && python3 -m http.server 7821
# Open http://localhost:7821
```

Requirements:
- Node.js 18+
- Emscripten: `source ~/emsdk/emsdk_env.sh`
- Native C compiler (`cc`)

---

## Building a plugin from source

```sh
wadspa build ./amp --out ./amp/dist
```

The generated `_wadspa_shim.c` is excluded from git (see `.gitignore`). It is recreated automatically on every build.

After rebuilding, copy the updated files to `demo/` if you want to test in the browser demo:

```sh
cp plugins/amp/dist/amp.js plugins/amp/dist/amp.wasm demo/
cp plugins/amp/dist/processor.js demo/amp-processor.js
```

---

## Code style

- ES modules throughout (`type: "module"`)
- No TypeScript — plain JavaScript with JSDoc comments where the types are non-obvious
- No bundler — everything runs as native ES modules in Node and the browser
- No test framework yet — test by running the demo in Chrome and Safari

---

## Pull request guidelines

- Keep PRs focused — one plugin or one feature per PR
- Include the compiled `dist/` output so reviewers can test without installing Emscripten
- If you're adding a new plugin, confirm it works in both Chrome (66+) and Safari (14.5+)
- Open an issue first for large changes to the toolchain or core API

---

## License

By contributing you agree that your contributions will be licensed under the MIT license.
