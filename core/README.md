# @wadspa/core

Runtime host for wadspa WASM audio plugins.

## Installation

```sh
npm install @wadspa/core
```

## Usage

```js
import { loadPlugin } from '@wadspa/core';
import * as amp from '@wadspa/amp';

const ctx = new AudioContext();
const node = await loadPlugin(ctx, amp);

// Set a control port by name (fuzzy match — case, spaces, and punctuation are ignored)
node.set('Gain (dB)', -6);

// Connect like any Web Audio node
source.connect(node.input);
node.output.connect(ctx.destination);
```

## API

### `loadPlugin(ctx, pluginModule)`

Loads a wadspa plugin into an `AudioContext` and returns a `WadspNode`.

| Argument | Type | Description |
|---|---|---|
| `ctx` | `AudioContext` | The Web Audio context to load into |
| `pluginModule` | `object` | A wadspa plugin module (see below) |

Returns `Promise<WadspNode>`.

**Plugin module shape** — any object with these three exports:

```ts
{
  meta:         PluginMeta;   // port descriptors, label, id
  wasmUrl:      string;       // URL to the .wasm file
  processorUrl: string;       // URL to the AudioWorklet processor script
}
```

Plugin packages built with `@wadspa/toolchain` export this automatically.

### `WadspNode`

#### `.set(portName, value)` → `this`

Set a control port by name. The match is fuzzy — `"Gain (dB)"`, `"gain db"`, and `"GAINDB"` all resolve to the same port. Throws if the port name doesn't match anything.

```js
node.set('Gain (dB)', -12);
node.set('Lo gain (dB)', 3);
```

#### `.input`

The `AudioNode` to connect audio into. For mono plugins this is the `AudioWorkletNode` input 0 (mono); for stereo plugins it is the same node configured with a 2-channel input.

#### `.output`

The `AudioNode` to connect audio out of. Same node — `node.input === node.output`.

#### `.ports`

Array of port descriptors from the plugin metadata.

#### `.node`

The underlying `AudioWorkletNode`.

## Stereo plugins

Plugins with exactly 2 audio inputs and 2 audio outputs are treated as stereo: a single `AudioWorkletNode` with one 2-channel input and one 2-channel output. Connect them the same way as mono plugins.

## Browser support

Chrome 64+, Safari 14.5+, Firefox 76+. Requires `AudioWorklet` support (all evergreen browsers).
