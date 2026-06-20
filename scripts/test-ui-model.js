#!/usr/bin/env node
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { visibleControlPorts } from '../docs/control-utils.js';
import { WADSPA_UI_MODEL, createWadspaUiModel } from '../docs/ui-model.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const instruments = readJson(join(ROOT, 'docs/instruments.json'));
const effects = readJson(join(ROOT, 'docs/plugins/catalog.json'));
const hints = readJson(join(ROOT, 'docs/ui-hints.json'));
const entries = [
  ...instruments.map(entry => ({ ...entry, target: 'instrument' })),
  ...effects.map(entry => ({ ...entry, target: 'effect' })),
];

let failures = 0;
let fields = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

for (const entry of entries) {
  const expected = visibleControlPorts(entry.ports ?? []);
  const model = createWadspaUiModel(entry, { target: entry.target, hints });

  if (model.schema !== WADSPA_UI_MODEL.schema) {
    fail(`${entry.id}: schema is ${model.schema}`);
  }
  if (model.fields.length !== expected.length) {
    fail(`${entry.id}: ${model.fields.length} model fields for ${expected.length} visible controls`);
  }
  if (expected.length > 0 && model.sections.length === 0) {
    fail(`${entry.id}: controls exist but no UI sections were generated`);
  }

  const fieldPorts = new Set(model.fields.map(field => field.portName));
  for (const port of expected) {
    if (!fieldPorts.has(port.name)) fail(`${entry.id}: missing UI field for ${port.name}`);
  }

  for (const field of model.fields) {
    fields += 1;
    if (!WADSPA_UI_MODEL.widgets.includes(field.widget)) {
      fail(`${entry.id}/${field.portName}: unsupported widget ${field.widget}`);
    }
    if (!field.section || !field.role || !field.label) {
      fail(`${entry.id}/${field.portName}: incomplete UI field metadata`);
    }
  }
}

const tapEq = hints.plugins?.['tap-eq'];
if (!tapEq?.sourceKinds?.includes('modgui')) fail('tap-eq hint includes MOD GUI source metadata');
if (!tapEq?.assets?.includes('knob')) fail('tap-eq hint includes knob asset metadata');

const samplv1 = hints.plugins?.samplv1;
if (!samplv1?.nativeUiTypes?.some(type => /Qt|X11|external/i.test(type))) {
  fail('samplv1 hint includes native Qt/X11/external UI metadata');
}

const setbfree = hints.plugins?.setbfree;
if (!setbfree?.assets?.includes('drawbar')) fail('setbfree hint includes drawbar metadata');

if (failures > 0) {
  console.error(`wadspa UI model failed: ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}

console.log(`wadspa UI model ok (${entries.length} plugins, ${fields} fields)`);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
