#!/usr/bin/env node
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { visibleControlPorts } from '../docs/control-utils.js';
import { WADSPA_UI_MODEL, createWadspaUiModel } from '../docs/ui-model.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'docs/index.html'), 'utf8');
const instruments = readJson(join(ROOT, 'docs/instruments.json'));
const effects = readJson(join(ROOT, 'docs/plugins/catalog.json'));
const hints = readJson(join(ROOT, 'docs/ui-hints.json'));
const entries = [
  ...instruments.map(entry => ({ ...entry, target: 'instrument' })),
  ...effects.map(entry => ({ ...entry, target: 'effect' })),
];

const PANEL_TYPES = new Set([
  'compact-panel',
  'control-panel',
  'dense-bank',
  'drawbar-bank',
  'program-panel',
  'rack-strip',
  'synth-panel',
]);

const DENSITY_TYPES = new Set(['open', 'medium', 'dense']);
const widgetTotals = new Map();
const failures = [];
const layout = {
  controlColumn: cssNumber(/\.ui-control-grid\s*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'base control column width'),
  denseColumn: cssNumber(/\.ui-control-grid\[data-density="dense"\]\s*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'dense control column width'),
  rackColumn: cssNumber(/\.ui-control-grid\[data-ui-panel="rack-strip"\][\s\S]*minmax\((\d+)px,\s*1fr\)/, 'rack/drawbar strip column width'),
  synthColumn: cssNumber(/#synth-ctrls \.ui-control-grid\s*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'synth control column width'),
  synthDenseColumn: cssNumber(/#synth-ctrls \.ui-control-grid\[data-density="dense"\]\s*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'dense synth control column width'),
  matrixSection: cssNumber(/\.plugin-ui-sections\[data-ui-layout="matrix"\]\s*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'matrix section width'),
  synthMatrixSection: cssNumber(/#synth-ctrls \.plugin-ui-sections\[data-ui-layout="matrix"\]\s*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'synth matrix section width'),
  knobHit: cssNumber(/\.ctrl-row\[data-widget="knob"\] input\[type=range\][\s\S]*width:\s*(\d+)px; height:\s*56px; opacity:\s*0/s, 'knob hitbox width'),
  faderHit: cssNumber(/\.ctrl-row\[data-widget="fader"\] input\[type=range\][\s\S]*width:\s*(\d+)px; height:\s*56px; opacity:\s*0/s, 'fader hitbox width'),
  faderHeight: cssNumber(/\.ctrl-row\[data-widget="fader"\] \.knob-face\s*\{[^}]*height:\s*(\d+)px/s, 'fader visual height'),
  controlMinHeight: cssNumber(/\.ctrl-row\[data-widget="knob"\],\s*\.ctrl-row\[data-widget="fader"\s*\]\s*\{[^}]*min-height:\s*(\d+)px/s, 'knob/fader row height'),
  sliderSpan: cssNumber(/\.ctrl-row\[data-widget="slider"\]\s*\{[^}]*grid-column:\s*span\s*(\d+)/s, 'slider grid span'),
  mobileBreakpoint: cssNumber(/@media \(max-width:\s*(\d+)px\)/, 'mobile breakpoint'),
};
const cssChecks = [
  ['matrix layout grid', /\.plugin-ui-sections\[data-ui-layout="matrix"\]\s*\{[^}]*minmax\(180px,\s*1fr\)/s],
  ['panel section chrome', /\.ui-section\[data-ui-panel="synth-panel"\][\s\S]*border:\s*1px solid rgba\(255,255,255,0\.08\)/],
  ['dense grid sizing', /\.ui-control-grid\[data-density="dense"\]\s*\{[^}]*minmax\(68px,\s*1fr\)/s],
  ['rack/drawbar strip sizing', /\.ui-control-grid\[data-ui-panel="rack-strip"\][\s\S]*minmax\(62px,\s*1fr\)/],
  ['knob/fader stable cell', /\.ctrl-row\[data-widget="knob"\],\s*\.ctrl-row\[data-widget="fader"\s*\]\s*\{[^}]*min-height:\s*96px/s],
  ['knob hit area', /\.ctrl-row\[data-widget="knob"\] input\[type=range\][\s\S]*width:\s*56px; height:\s*56px; opacity:\s*0/s],
  ['label clamp', /-webkit-line-clamp:\s*3/],
  ['mobile breakpoint', /@media \(max-width:\s*900px\)/],
];

for (const [label, pattern] of cssChecks) {
  if (!pattern.test(html)) fail(`missing overlap-safe CSS hook: ${label}`);
}

if (!WADSPA_UI_MODEL.artDirection?.knobs?.includes('rotary knobs')) {
  fail('art direction explains rotary-knob default');
}
if (!WADSPA_UI_MODEL.artDirection?.panels?.includes('signal blocks')) {
  fail('art direction explains when to make panels');
}

validateLayoutContract();

for (const entry of entries) {
  const ports = visibleControlPorts(entry.ports ?? []);
  const model = createWadspaUiModel(entry, { target: entry.target, hints, ports });
  const hint = hints.plugins?.[entry.id] ?? {};
  const counts = countWidgets(model);

  for (const [widget, count] of Object.entries(counts)) {
    widgetTotals.set(widget, (widgetTotals.get(widget) ?? 0) + count);
  }

  for (const section of model.sections) {
    if (!PANEL_TYPES.has(section.panel)) fail(`${entry.id}/${section.id}: unsupported panel ${section.panel}`);
    if (!DENSITY_TYPES.has(section.density)) fail(`${entry.id}/${section.id}: unsupported density ${section.density}`);
    if (section.density === 'dense' && section.fields.length < 24) {
      fail(`${entry.id}/${section.id}: dense section has only ${section.fields.length} fields`);
    }
    if (section.panel === 'rack-strip' && section.fields.filter(field => field.widget === 'fader').length < 6) {
      fail(`${entry.id}/${section.id}: rack strip needs at least six faders`);
    }
    if (section.panel === 'drawbar-bank' && !section.fields.some(isRegistrationField)) {
      fail(`${entry.id}/${section.id}: drawbar bank lacks registration-style controls`);
    }
    if (hasNativeGroupedPanels(hint) && section.fields.length > 1 && section.panel === 'compact-panel') {
      fail(`${entry.id}/${section.id}: native grouped/tabbed UI should render multi-control sections as panels`);
    }
    validateSectionGeometry(entry, model, section);
  }

  for (const field of model.fields) {
    if (field.widget === 'slider' && !isSampleLoopSlider(field)) {
      fail(`${entry.id}/${field.portName}: sliders are only allowed for sample loop position controls`);
    }
  }

  if (hint.nativeLayouts?.includes('canvas-editor') && !hasCanvasSourceEvidence(hint)) {
    fail(`${entry.id}: canvas-editor hint lacks concrete editor/graph source evidence`);
  }

  if (model.layout === 'drawbar' && !model.fields.some(isRegistrationField)) {
    fail(`${entry.id}: drawbar layout requires drawbar/harmonic/footage controls`);
  }
  if (entry.id === 'tap-rotspeak' && model.layout === 'drawbar') {
    fail('tap-rotspeak is a rotary speaker, not a drawbar bank');
  }
  if ((entry.id === 'casynth' || entry.id === 'string-machine') && model.layout === 'drawbar') {
    fail(`${entry.id}: harmonic/footage controls are not enough evidence for organ drawbar layout`);
  }
  if (model.layout === 'matrix' && (counts.knob ?? 0) < 40) {
    fail(`${entry.id}: matrix layout should be a knob-dominant dense panel`);
  }

  const nativeKinds = hint.sourceKinds?.filter(kind => /qt|gtk|dpf|lv2-native|modgui/i.test(kind)) ?? [];
  const continuousFields = model.fields.filter(field => field.widget !== 'menu' && field.widget !== 'toggle');
  const nonSampleContinuousFields = continuousFields.filter(field => field.widget !== 'slider' || !isSampleLoopSlider(field));
  if (nativeKinds.length > 0 && nonSampleContinuousFields.length >= 4) {
    const knobsAndFaders = nonSampleContinuousFields.filter(field => field.widget === 'knob' || field.widget === 'fader').length;
    if (knobsAndFaders !== nonSampleContinuousFields.length) {
      fail(`${entry.id}: native UI continuous controls should be knobs/faders (${knobsAndFaders}/${nonSampleContinuousFields.length})`);
    }
  }

  if (/knobs/i.test(hint.modgui?.panel ?? '') && (counts.knob ?? 0) < Math.max(1, continuousFields.length - 1)) {
    fail(`${entry.id}: MOD knob panel does not render primarily as knobs`);
  }
  if (/slider|fader/i.test(hint.modgui?.panel ?? '') && !model.sections.some(section => section.panel === 'rack-strip' || section.fields.some(field => field.widget === 'fader'))) {
    fail(`${entry.id}: MOD slider/fader panel does not render as faders`);
  }
}

const sliders = widgetTotals.get('slider') ?? 0;
const knobs = widgetTotals.get('knob') ?? 0;
const faders = widgetTotals.get('fader') ?? 0;
if (sliders > 4) fail(`too many true sliders (${sliders}); continuous controls should mostly be knobs/faders`);
if (knobs < faders * 4) fail(`knob count too low for dial-heavy art direction (${knobs} knobs, ${faders} faders)`);

if (failures.length > 0) {
  for (const message of failures) console.error(`FAIL ${message}`);
  console.error(`wadspa UI art direction failed: ${failures.length} problem${failures.length === 1 ? '' : 's'}`);
  process.exit(1);
}

console.log(`wadspa UI art direction ok (${entries.length} plugins, ${knobs} knobs, ${faders} faders, ${sliders} sliders)`);

function fail(message) {
  failures.push(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function countWidgets(model) {
  const counts = {};
  for (const field of model.fields) counts[field.widget] = (counts[field.widget] ?? 0) + 1;
  return counts;
}

function validateLayoutContract() {
  if (layout.controlColumn < layout.knobHit + 16) {
    fail(`base control column ${layout.controlColumn}px is too narrow for ${layout.knobHit}px knob hitboxes`);
  }
  if (layout.denseColumn < layout.knobHit + 12) {
    fail(`dense control column ${layout.denseColumn}px is too narrow for ${layout.knobHit}px knob hitboxes`);
  }
  if (layout.synthDenseColumn < layout.knobHit + 12) {
    fail(`dense synth control column ${layout.synthDenseColumn}px is too narrow for ${layout.knobHit}px knob hitboxes`);
  }
  if (layout.rackColumn < layout.faderHit + 6) {
    fail(`rack/drawbar column ${layout.rackColumn}px is too narrow for ${layout.faderHit}px fader hitboxes`);
  }
  if (layout.controlMinHeight < layout.faderHeight + 30) {
    fail(`knob/fader row height ${layout.controlMinHeight}px is too short for ${layout.faderHeight}px faders plus label/value text`);
  }
  if (layout.sliderSpan < 2) {
    fail(`true slider rows must span at least two columns, found span ${layout.sliderSpan}`);
  }
  if (layout.synthMatrixSection < layout.matrixSection) {
    fail(`synth matrix section ${layout.synthMatrixSection}px should be at least the generic matrix section ${layout.matrixSection}px`);
  }
  if (layout.mobileBreakpoint < 720) {
    fail(`mobile breakpoint ${layout.mobileBreakpoint}px is too narrow for dense plugin panels`);
  }
}

function validateSectionGeometry(entry, model, section) {
  const column = sectionColumnWidth(model, section);
  for (const field of section.fields) {
    const needed = widgetMinimumWidth(field.widget);
    const available = field.widget === 'slider' ? column * layout.sliderSpan : column;
    if (needed > 0 && available < needed) {
      fail(`${entry.id}/${section.id}/${field.portName}: ${field.widget} needs ${needed}px but ${section.panel} column is ${available}px`);
    }
  }
}

function sectionColumnWidth(model, section) {
  if (section.panel === 'rack-strip' || section.panel === 'drawbar-bank') return layout.rackColumn;
  if (section.density === 'dense') return model.family === 'instrument' ? layout.synthDenseColumn : layout.denseColumn;
  return model.family === 'instrument' ? layout.synthColumn : layout.controlColumn;
}

function widgetMinimumWidth(widget) {
  if (widget === 'knob') return layout.knobHit + 8;
  if (widget === 'fader') return layout.faderHit + 6;
  if (widget === 'menu') return 64;
  if (widget === 'toggle') return 42;
  if (widget === 'slider') return 90;
  return 0;
}

function cssNumber(pattern, label) {
  const match = html.match(pattern);
  if (!match) {
    fail(`missing CSS number: ${label}`);
    return 0;
  }
  return Number(match[1]);
}

function isRegistrationField(field) {
  return /drawbar|harmonic|[0-9]'/i.test(`${field.portName} ${field.symbol ?? ''}`);
}

function isSampleLoopSlider(field) {
  return /(?:sample|loop)\s*(?:start|end|position|offset)/i.test(`${field.portName} ${field.symbol ?? ''}`);
}

function hasNativeGroupedPanels(hint) {
  return Boolean(hint?.nativeLayouts?.some(layout => layout === 'grouped-panel' || layout === 'tabbed-panel'));
}

function hasCanvasSourceEvidence(hint) {
  return Boolean(hint?.sourceFiles?.some(file => (
    /canvas|graph|EnvelopeUI|OscilGen|widget_(?:wave|env)|samplv1widget_(?:env|wave)|geonkick_lv2_wasm|WolfShaperPlugin/i.test(file)
      && !/DSPFilters/i.test(file)
  )));
}
