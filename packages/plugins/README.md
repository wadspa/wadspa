# @wadspa/plugins

Aggregate catalog and lazy-loadable assets for the browser-built wadspa plugin ecosystem.

Use this package with `@wadspa/core` when you want one npm dependency for the supported plugin catalog instead of installing one package per effect or instrument.

```sh
npm install @wadspa/core @wadspa/plugins
```

```js
import { loadPlugin } from '@wadspa/core';
import { pluginModule } from '@wadspa/plugins';

const ctx = new AudioContext();
await ctx.resume();

const obxd = await loadPlugin(ctx, pluginModule('obxd'));
obxd.output.connect(ctx.destination);
obxd.noteOn(60, 100);
```

The package exports:

- `plugins`: all supported entries, tagged with `type: 'instrument' | 'effect'`
- `instruments`: instrument catalog
- `effects`: effect catalog
- `pluginModule(id)`: returns `{ meta, wasmUrl, processorUrl }` for `@wadspa/core`
- `pluginAssetUrl(id, fileName)`: URL for a plugin asset
- `listPlugins(filters)` and `getPlugin(id)`: catalog helpers

For CDNs or apps that copy this package to a public directory, pass a package base URL:

```js
const mod = pluginModule('plate', {
  baseUrl: 'https://cdn.example.com/vendor/@wadspa/plugins/'
});
```

The payload includes mixed-license third-party plugin builds. See `LICENSES.md` and each catalog entry's `license` field before redistributing subsets.

Sample packs and soundfonts are not bundled in the npm package. For SF2/sample-based instruments, host your own sample assets and load them with `@wadspa/core` APIs such as `node.loadSF2(url)`.
