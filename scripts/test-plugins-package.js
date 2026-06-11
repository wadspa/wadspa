#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'packages', 'plugins');

const effects = readJson(join(ROOT, 'docs', 'plugins', 'catalog.json'));
const instruments = readJson(join(ROOT, 'docs', 'instruments.json'));
const pkg = readJson(join(OUT, 'package.json'));

const mod = await import(`${pathToFileURL(join(OUT, 'index.js')).href}?test=${Date.now()}`);

assert(pkg.name === '@wadspa/plugins', 'package name is @wadspa/plugins');
assert(mod.instrumentCount === instruments.length, 'instrument count matches docs catalog');
assert(mod.effectCount === effects.length, 'effect count matches docs catalog');
assert(mod.pluginCount === instruments.length + effects.length, 'plugin count matches docs catalog');

const obxd = mod.getPlugin('obxd');
assert(obxd?.name === 'Obxd', 'getPlugin resolves obxd');
assert(obxd?.license === 'GPL-2.0-only', 'obxd license metadata is preserved');

const obxdModule = mod.pluginModule('obxd', {
    baseUrl: 'https://cdn.example.test/@wadspa/plugins/',
});
assert(obxdModule.meta.id === 'obxd', 'pluginModule returns metadata');
assert(
    obxdModule.wasmUrl === 'https://cdn.example.test/@wadspa/plugins/plugins/obxd/Obxd.wasm',
    'pluginModule resolves WASM URL from package base URL'
);
assert(
    obxdModule.processorUrl === 'https://cdn.example.test/@wadspa/plugins/plugins/obxd/processor.js',
    'pluginModule resolves processor URL from package base URL'
);

assertExists(join(OUT, 'catalog.js'));
assertExists(join(OUT, 'instruments.js'));
assertExists(join(OUT, 'LICENSES.md'));
assertExists(join(OUT, 'plugins', 'obxd', 'Obxd.wasm'));
assertExists(join(OUT, 'plugins', 'obxd', 'processor.js'));
assert(!existsSync(join(OUT, 'soundfonts')), 'soundfont/sample packs are not bundled');

const wasmSize = statSync(join(OUT, 'plugins', 'obxd', 'Obxd.wasm')).size;
assert(wasmSize > 0, 'obxd WASM is non-empty');

const gplEffects = mod.listPlugins({ type: 'effect', license: 'GPL-2.0-or-later' });
assert(gplEffects.length > 0, 'listPlugins filters by type and license');

console.log(`@wadspa/plugins package ok (${mod.pluginCount} plugins: ${mod.instrumentCount} instruments, ${mod.effectCount} effects)`);

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    }
}

function assertExists(path) {
    assert(existsSync(path), `${path} exists`);
}
