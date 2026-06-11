# @wadspa/core

Runtime host for wadspa WASM audio plugins. Loads a compiled LADSPA/LV2-to-WASM plugin package into a Web Audio `AudioContext` and returns a node you can connect like any other `AudioNode`.

## Installation

```sh
npm install @wadspa/core @wadspa/plugins
```

## Usage

```js
import { loadPlugin } from '@wadspa/core';
import { pluginModule } from '@wadspa/plugins';

const ctx = new AudioContext();
const node = await loadPlugin(ctx, pluginModule('amp'));

node.set('Gain (dB)', -6);
source.connect(node.input);
node.output.connect(ctx.destination);
```

`loadPlugin` must be called from a user gesture (click, keydown) that has already resumed the `AudioContext`, or after `await ctx.resume()`.

### LV2 instrument

```js
import { loadPlugin } from '@wadspa/core';
import { pluginModule } from '@wadspa/plugins';

const ctx = new AudioContext();
await ctx.resume();

const inst = await loadPlugin(ctx, pluginModule('fm_synth'));
inst.output.connect(ctx.destination);

inst.noteOn(60, 100);   // middle C
setTimeout(() => inst.noteOff(60), 500);
```

---

## API

### `loadPlugin(ctx, pluginModule)` → `Promise<WadspNode>`

Loads a wadspa plugin package into an `AudioContext`.

| Argument | Type | Description |
|---|---|---|
| `ctx` | `AudioContext` | The Web Audio context to load the plugin into |
| `pluginModule` | `object` | A wadspa plugin module — see shape below |

Internally this:
1. Fetches the `.wasm` binary
2. Calls `ctx.audioWorklet.addModule(processorUrl)` to register the processor
3. Creates an `AudioWorkletNode` and sends the WASM bytes, audio-buffer exports, and control setter map to it via `postMessage`
4. Waits for the worklet to confirm it is initialized
5. Returns a `WadspNode` wrapping the node

**Plugin module shape** — any object with these three exports:

```ts
{
  meta:         PluginMeta;   // port descriptors + label
  wasmUrl:      string;       // URL to the .wasm file
  processorUrl: string;       // URL to the AudioWorklet processor .js file
}
```

Packages built with `@wadspa/toolchain` export this shape automatically via their `index.js`.

---

### `WadspNode`

The object returned by `loadPlugin`.

#### `.set(portName, value)` -> `this`

Sets a control input port by name. The match is **fuzzy** — case, spaces, parentheses, hyphens, and underscores are all ignored, so `"Gain (dB)"`, `"gain db"`, and `"GAINDB"` all resolve to the same port.

Returns `this` so calls can be chained:

```js
node
  .set('Lo gain (dB)', -6)
  .set('Mid gain (dB)', 0)
  .set('Hi gain (dB)', 3);
```

Throws `Error` if the name doesn't match any control input port.

For LV2 ports marked `sampleRate`, values inside the raw LV2 range are scaled by the current `AudioContext.sampleRate` before dispatch. That lets browser UI code display frequency-like values in Hz while still sending the normalized LV2 value expected by the plugin.

#### MIDI helpers -> `this`

LV2 instruments expose MIDI through the same `WadspNode`:

```js
inst.noteOn(60, 100, 0);
inst.noteOff(60, 0);
inst.cc(74, 96, 0);
inst.polyPressure(60, 80, 0);
inst.channelPressure(80, 0);
inst.pitchBend(1.5, 0);
inst.midi(0x90, 64, 100);
```

`.midi(status, data1, data2)` sends a raw MIDI message. The convenience helpers send note, controller, pressure, and pitch-bend messages. They throw if the loaded plugin does not expose a MIDI input port.

#### `.loadSF2(urlOrBuffer)` -> `Promise<this>`

Loads a SoundFont into TSF-capable plugins:

```js
const tsf = await loadPlugin(ctx, tsfPlugin);
await tsf.loadSF2('/soundfonts/general-midi.sf2');
tsf.noteOn(60, 100);
```

`urlOrBuffer` can be a URL string or an `ArrayBuffer`.

#### `.input`

The `AudioNode` to connect audio into. This is the underlying `AudioWorkletNode`:

```js
source.connect(node.input);
```

For **mono plugins** (1 audio in port): mono signal in.  
For **stereo plugins** (2 audio in ports): stereo signal in — `inputs[0][0]` is L, `inputs[0][1]` is R.

#### `.output`

The `AudioNode` to pull audio from. Same object as `.input` — `node.input === node.output === node.node`.

```js
node.output.connect(ctx.destination);
node.output.connect(analyser);
```

#### `.node`

The underlying `AudioWorkletNode`, if you need lower-level access (e.g. to call `.disconnect()` or inspect `.parameters`).

#### `.ports`

Array of port descriptor objects from the plugin metadata. Each descriptor has:

```ts
{
  index:       number;
  name:        string;
  dir:         'input' | 'output';
  type:        'audio' | 'control' | 'midi';
  symbol?:     string;    // LV2 symbol, when present
  min?:        number;
  max?:        number;
  default?:    string;    // 'min', 'max', 'middle', '0', '440', ...
  integer?:    boolean;
  logarithmic?: boolean;
  toggled?:    boolean;
  sampleRate?: boolean;
  scalePoints?: Array<{ value: number; label?: string }>;
}
```

#### `.hasMidi`

Boolean indicating whether the loaded plugin has a MIDI input.

---

## Chaining plugins

```js
const eq  = await loadPlugin(ctx, djEqMono);
const amp = await loadPlugin(ctx, ampPlugin);

// osc → EQ → amp → output
osc.connect(eq.input);
eq.output.connect(amp.input);
amp.output.connect(ctx.destination);
```

Each plugin runs in its own `AudioWorkletNode`. There is no shared state between plugins.

---

## Stereo plugins

A plugin with exactly 2 audio input ports and 2 audio output ports is automatically treated as stereo. Its `AudioWorkletNode` is configured with one 2-channel input and one 2-channel output. The L/R routing into and out of the LADSPA buffers is handled internally.

```js
// stereo reverb, chorus, etc. — same API as mono
const reverb = await loadPlugin(ctx, myReverbPlugin);
stereoSource.connect(reverb.input);
reverb.output.connect(ctx.destination);
```

---

## Error handling

`loadPlugin` rejects if:
- The WASM file can't be fetched (network error, 404)
- `addModule` fails (syntax error in the processor script)
- The worklet reports an initialization error
- A plugin-specific asset load, such as `loadSF2()`, reports an error

```js
try {
  const node = await loadPlugin(ctx, amp);
} catch (e) {
  console.error('Plugin load failed:', e.message);
}
```

Control port errors (calling `.set()` with an unknown name) and MIDI calls on non-MIDI plugins throw synchronously.

---

## Browser support

| Browser | Version |
|---|---|
| Chrome | 66+ |
| Safari | 14.5+ |
| Firefox | 76+ |
| Edge | 79+ |

Requires `AudioWorklet` and `WebAssembly`. Both are available in all modern evergreen browsers.
