#!/usr/bin/env node
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { scalePointOptions, visibleControlPorts } from '../docs/control-utils.js';
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
const models = new Map();

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

for (const entry of entries) {
  const expected = visibleControlPorts(entry.ports ?? []);
  const model = createWadspaUiModel(entry, { target: entry.target, hints });
  models.set(entry.id, { entry, model });

  if (model.schema !== WADSPA_UI_MODEL.schema) {
    fail(`${entry.id}: schema is ${model.schema}`);
  }
  if (model.fields.length !== expected.length) {
    fail(`${entry.id}: ${model.fields.length} model fields for ${expected.length} visible controls`);
  }
  if (expected.length > 0 && model.sections.length === 0) {
    fail(`${entry.id}: controls exist but no UI sections were generated`);
  }
  if (!Number.isInteger(model.sectionColumns) || model.sectionColumns < 1 || model.sectionColumns > 3) {
    fail(`${entry.id}: sectionColumns should be an integer between 1 and 3`);
  }
  if ((model.layout === 'rack' || model.layout === 'drawbar') && model.sectionColumns !== 1) {
    fail(`${entry.id}: rack/drawbar layouts should stay single-column`);
  }
  if (model.fields.length <= 9 && model.sections.length > 1 && !['rack', 'drawbar'].includes(model.layout) && model.sectionColumns > 2) {
    fail(`${entry.id}: sparse plugins should cap section columns at two`);
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

  if (model.layout === 'canvas' && !(entry.canvasEditors?.length > 0)) {
    fail(`${entry.id}: canvas layout is reserved for implemented editable canvas instruments`);
  }
}

if (!WADSPA_UI_MODEL.artDirection?.knobs || !WADSPA_UI_MODEL.artDirection?.panels) {
  fail('UI model exposes art direction for knob and panel decisions');
}
if (!WADSPA_UI_MODEL.artDirection?.menus?.includes('mode/type/select')) {
  fail('UI model art direction reserves menus for enumerated mode/type/select controls');
}
if (!WADSPA_UI_MODEL.artDirection?.menus?.includes('visible labels concise')) {
  fail('UI model art direction keeps menu labels concise after parsing embedded choices');
}
if (!WADSPA_UI_MODEL.artDirection.panels.includes('one/two-control groups compact')) {
  fail('UI model art direction keeps tiny groups compact');
}
if (!WADSPA_UI_MODEL.artDirection.panels.includes('cap sparse plugins at two balanced columns')) {
  fail('UI model art direction caps sparse plugins at two balanced columns');
}

const tapEq = hints.plugins?.['tap-eq'];
if (!tapEq?.sourceKinds?.includes('modgui')) fail('tap-eq hint includes MOD GUI source metadata');
if (!tapEq?.assets?.includes('knob')) fail('tap-eq hint includes knob asset metadata');

const tapChorus = hints.plugins?.['tap-chorusflanger'];
if (!/knobs/i.test(tapChorus?.modgui?.panel ?? '')) fail('tap-chorusflanger hint includes MOD knob-panel metadata');

const samplv1 = hints.plugins?.samplv1;
if (!samplv1?.nativeUiTypes?.some(type => /Qt|X11|external/i.test(type))) {
  fail('samplv1 hint includes native Qt/X11/external UI metadata');
}
if (!samplv1?.nativeLayouts?.includes('grouped-panel') || !samplv1?.nativeWidgets?.panels) {
  fail('samplv1 hint preserves Qt grouped-panel metadata');
}
if (!samplv1?.sourceFiles?.some(file => /samplv1widget_param\.(?:cpp|h)$/.test(file))) {
  fail('samplv1 hint cites Qt parameter widgets that drive knob/group art direction');
}
if (!samplv1?.sourceFiles?.some(file => /samplv1widget_wave\.(?:cpp|h)$/.test(file))) {
  fail('samplv1 hint cites Qt wave editor sources for canvas evidence');
}

const casynth = hints.plugins?.casynth;
if (!casynth?.sourceKinds?.includes('fltk-native-ui') || !casynth?.nativeUiTypes?.includes('FLTKUI')) {
  fail('casynth hint includes FLTK native UI metadata');
}
if (!casynth?.nativeLayouts?.includes('dial-bank') || !casynth?.nativeLayouts?.includes('grouped-panel')) {
  fail('casynth hint preserves FLTK dial/group layout metadata');
}

const setbfree = hints.plugins?.setbfree;
if (!setbfree?.assets?.includes('drawbar')) fail('setbfree hint includes drawbar metadata');
if (setbfree?.assets?.includes('canvas-editor')) {
  fail('setbfree tonegen spline math should not be inferred as an editable canvas');
}

const zynaddsubfx = hints.plugins?.zynaddsubfx;
if (!zynaddsubfx?.nativeLayouts?.includes('tabbed-panel') || !zynaddsubfx?.nativeWidgets?.tabs) {
  fail('zynaddsubfx hint preserves FLTK tabbed-panel metadata');
}

for (const id of ['delay', 'vl1-emulator']) {
  const hint = hints.plugins?.[id];
  if (hint?.assets?.includes('canvas-editor') || hint?.nativeLayouts?.includes('canvas-editor')) {
    fail(`${id}: interpolation/DSP code should not be inferred as an editable canvas`);
  }
}

const wolfShaper = hints.plugins?.['wolf-shaper'];
if (!wolfShaper?.nativeLayouts?.includes('canvas-editor')
  || !wolfShaper?.sourceFiles?.some(file => /Graph|WolfShaperPlugin|wolf_shaper\.ttl/.test(file))) {
  fail('wolf-shaper hint preserves real graph editor metadata');
}
if (wolfShaper?.sourceFiles?.some(file => /DSPFilters/i.test(file))) {
  fail('wolf-shaper hint should not cite DSPFilters support headers as UI sources');
}

for (const [id, hint] of Object.entries(hints.plugins ?? {})) {
  for (const file of hint.sourceFiles ?? []) {
    if (/lv2ui_stub/i.test(file)) fail(`${id}: generated lv2ui stubs should not be UI source evidence`);
    if (/\/dpf(?:_full)?\/(?:src|extra|distrho|dgl)\//i.test(file)) {
      fail(`${id}: DPF framework files should not be cited as plugin UI source evidence`);
    }
  }
}

const geonkickHint = hints.plugins?.geonkick;
if (!geonkickHint?.nativeLayouts?.includes('canvas-editor')
  || !geonkickHint?.sourceFiles?.some(file => /geonkick_lv2_wasm\.c/.test(file))) {
  fail('geonkick hint preserves explicit canvas edit bridge metadata');
}

const geonkick = models.get('geonkick')?.model;
if (geonkick?.layout !== 'canvas') fail('geonkick keeps canvas layout for implemented envelope editors');

if (models.get('wadspa_synth')?.model.sectionColumns !== 2) {
  fail('wadspa_synth sparse default UI should use two balanced columns, not three sparse columns');
}
if (models.get('fm_synth')?.model.sectionColumns !== 2) {
  fail('fm_synth sparse multi-section UI should use two balanced columns');
}
if (models.get('synthv1')?.model.sectionColumns !== 3) {
  fail('synthv1 dense matrix UI should still allow three section columns');
}

const wadspaSynthFilter = models.get('wadspa_synth')?.model.sections.find(section => section.id === 'filter');
if (wadspaSynthFilter?.panel !== 'compact-panel') {
  fail('wadspa_synth one-control filter section stays compact without native group evidence');
}

const fmSynthOsc = models.get('fm_synth')?.model.sections.find(section => section.id === 'oscillators');
if (fmSynthOsc?.panel !== 'compact-panel') {
  fail('fm_synth one-control oscillator section stays compact without native group evidence');
}

const sorcerFilter = models.get('sorcer')?.model.sections.find(section => section.id === 'filter');
if (sorcerFilter?.panel !== 'synth-panel') {
  fail('sorcer native tabbed/grouped two-control filter section preserves panel intent');
}

const setbfreeModel = models.get('setbfree')?.model;
if (setbfreeModel?.layout !== 'drawbar') fail('setbfree uses a drawbar bank layout');
if ((widgetCount(setbfreeModel, 'fader') ?? 0) < 9) fail('setbfree drawbars render as faders');

for (const id of ['casynth', 'string-machine']) {
  const model = models.get(id)?.model;
  if (model?.layout === 'drawbar') fail(`${id}: harmonic/footage synth controls should not become organ drawbar banks`);
}

for (const id of ['obxd', 'padthv1', 'synthv1']) {
  const model = models.get(id)?.model;
  if (!model) continue;
  if (model.layout === 'canvas') fail(`${id}: Qt-style synth should not be inferred as canvas-only UI`);
  if ((widgetCount(model, 'knob') ?? 0) <= (widgetCount(model, 'slider') ?? 0)) {
    fail(`${id}: Qt-style synth should prefer knobs over sliders`);
  }
}

const chorusModel = models.get('tap-chorusflanger')?.model;
if ((widgetCount(chorusModel, 'knob') ?? 0) < 6) fail('tap-chorusflanger MOD knob panel renders primarily as knobs');

for (const [id, portPattern, labels] of [
  ['diode', /Mode \(0 for none/i, ['none', 'half wave', 'full wave']],
  ['gate', /Output select/i, ['key listen', 'gate', 'bypass']],
  ['svf', /Filter type/i, ['none', 'LP', 'HP', 'BP', 'BR', 'AP']],
]) {
  const model = models.get(id)?.model;
  const field = model?.fields.find(item => portPattern.test(item.portName));
  if (field?.widget !== 'menu') fail(`${id}/${field?.portName ?? portPattern}: embedded numeric choices should render as a menu`);
  const options = scalePointOptions(field?.port);
  for (const label of labels) {
    if (!options.some(option => option.label === label)) {
      fail(`${id}/${field?.portName ?? portPattern}: inferred menu is missing ${label}`);
    }
  }
}

for (const [id, portPattern, expectedLabel] of [
  ['diode', /Mode \(0 for none/i, 'Mode'],
  ['gate', /Output select/i, 'Output select'],
  ['svf', /Filter type/i, 'Filter type'],
]) {
  const field = models.get(id)?.model.fields.find(item => portPattern.test(item.portName));
  if (field?.label !== expectedLabel) {
    fail(`${id}/${field?.portName ?? portPattern}: visible menu label should be ${expectedLabel}, got ${field?.label}`);
  }
}

const zamPhonoType = models.get('ZamPhono')?.model.fields.find(field => /Filter Type/i.test(field.portName));
if (zamPhonoType?.widget !== 'menu') fail('ZamPhono integer filter type should render as a compact menu');

for (const id of ['tap-eq', 'tap-eqbw', 'triple_para']) {
  const model = models.get(id)?.model;
  if (!model) continue;
  const eqFreqFaders = model.fields.filter(field => (
    field.section === 'equalizer'
      && field.widget === 'fader'
      && /freq|frequency|q\b|bandwidth|\bbw\b/i.test(`${field.portName} ${field.symbol ?? ''}`)
  ));
  if (eqFreqFaders.length > 0) {
    fail(`${id}: EQ frequency/Q controls should render as knobs, not faders`);
  }
}

for (const [id, portPattern] of [
  ['amp', /gain/i],
  ['mda_Ambience', /^Level$/i],
  ['setBfree-overdrive', /Input Gain/i],
]) {
  const model = models.get(id)?.model;
  const field = model?.fields.find(item => portPattern.test(item.portName));
  if (field?.widget !== 'knob') fail(`${id}/${field?.portName ?? portPattern}: single level controls should render as knobs`);
}

if (failures > 0) {
  console.error(`wadspa UI model failed: ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}

console.log(`wadspa UI model ok (${entries.length} plugins, ${fields} fields)`);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function widgetCount(model, widget) {
  return model?.fields?.filter(field => field.widget === widget).length ?? 0;
}
