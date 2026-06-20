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

const PANEL_REASONS = new Set([
  'compact-few-controls',
  'dense-control-bank',
  'drawbar-bank',
  'native-grouped-panel',
  'native-tabbed-panel',
  'parallel-fader-bank',
  'program-block',
  'signal-block',
]);

const DENSITY_TYPES = new Set(['open', 'medium', 'dense']);
const widgetTotals = new Map();
const failures = [];
const modelsById = new Map();
const layout = {
  controlColumn: cssNumber(/\.ui-control-grid\s*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'base control column width'),
  denseColumn: cssNumber(/\.ui-control-grid\[data-density="dense"\]\s*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'dense control column width'),
  rackColumn: cssNumber(/\.ui-control-grid\[data-ui-panel="rack-strip"\][^{]*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'rack/drawbar strip column width'),
  synthColumn: cssNumber(/#synth-ctrls \.ui-control-grid\s*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'synth control column width'),
  synthDenseColumn: cssNumber(/#synth-ctrls \.ui-control-grid\[data-density="dense"\]\s*\{[^}]*minmax\((\d+)px,\s*1fr\)/s, 'dense synth control column width'),
  sectionColumn: cssNumber(/\.plugin-ui-sections\s*\{[^}]*--ui-section-width:\s*(\d+)px/s, 'base section column width'),
  matrixSection: cssNumber(/\.plugin-ui-sections\[data-ui-layout="matrix"\]\s*\{[^}]*--ui-section-width:\s*(\d+)px/s, 'matrix section width'),
  synthSection: cssNumber(/#synth-ctrls \.plugin-ui-sections\s*\{[^}]*--ui-section-width:\s*(\d+)px/s, 'synth section column width'),
  synthMatrixSection: cssNumber(/#synth-ctrls \.plugin-ui-sections\[data-ui-layout="matrix"\]\s*\{[^}]*--ui-section-width:\s*(\d+)px/s, 'synth matrix section width'),
  rackCardMin: cssNumber(/\.card\[data-ui-layout="rack"\][^{]*\{[^}]*min-width:\s*(\d+)px/s, 'rack card minimum width'),
  knobFace: cssNumber(/\.knob-face\s*\{[^}]*width:\s*(\d+)px; height:\s*46px/s, 'knob face width'),
  knobHit: cssNumber(/\.ctrl-row\[data-widget="knob"\] input\[type=range\][\s\S]*width:\s*(\d+)px; height:\s*56px; opacity:\s*0/s, 'knob hitbox width'),
  faderHit: cssNumber(/\.ctrl-row\[data-widget="fader"\] input\[type=range\][\s\S]*width:\s*(\d+)px; height:\s*56px; opacity:\s*0/s, 'fader hitbox width'),
  faderHeight: cssNumber(/\.ctrl-row\[data-widget="fader"\] \.knob-face\s*\{[^}]*height:\s*(\d+)px/s, 'fader visual height'),
  controlMinHeight: cssNumber(/\.ctrl-row\[data-widget="knob"\],\s*\.ctrl-row\[data-widget="fader"\s*\]\s*\{[^}]*min-height:\s*(\d+)px/s, 'knob/fader row height'),
  sliderSpan: cssNumber(/\.ctrl-row\[data-widget="slider"\]\s*\{[^}]*grid-column:\s*span\s*(\d+)/s, 'slider grid span'),
  denseMenuSpan: cssNumber(/\.ui-control-grid\[data-density="medium"\] \.ctrl-row\[data-widget="menu"\],[\s\S]*?\.ui-control-grid\[data-density="dense"\] \.ctrl-row\[data-widget="menu"\]\s*\{[^}]*grid-column:\s*span\s*(\d+)/s, 'dense menu grid span'),
  denseMenuMin: cssNumber(/\.ui-control-grid\[data-density="medium"\] \.ctrl-row\[data-widget="menu"\],[\s\S]*?\.ui-control-grid\[data-density="dense"\] \.ctrl-row\[data-widget="menu"\]\s*\{[^}]*min-width:\s*min\(100%,\s*(\d+)px\)/s, 'dense menu minimum width'),
  mobileBreakpoint: cssNumber(/@media \(max-width:\s*(\d+)px\)/, 'mobile breakpoint'),
  synthSurface: cssClamp(/#synth-section\s*\{[^}]*flex:\s*0 0 clamp\((\d+)px,\s*(\d+)vw,\s*(\d+)px\)/s, 'desktop synth surface width'),
};
const cssChecks = [
  ['wide instrument surface', /#synth-section\s*\{[^}]*flex:\s*0 0 clamp\(420px,\s*46vw,\s*800px\)/s],
  ['compact section flow', /\.plugin-ui-sections\s*\{[^}]*--ui-section-width:\s*150px;[\s\S]*display:\s*grid;\s*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(var\(--ui-section-width\),\s*1fr\)\);[\s\S]*gap:\s*0\.42rem 0\.6rem/s],
  ['matrix layout columns', /\.plugin-ui-sections\[data-ui-layout="matrix"\]\s*\{[^}]*--ui-section-width:\s*190px/s],
  ['instrument matrix columns', /#synth-ctrls \.plugin-ui-sections\[data-ui-layout="matrix"\]\s*\{[^}]*--ui-section-width:\s*238px/s],
  ['section band chrome', /\.ui-section\[data-ui-panel="synth-panel"\][\s\S]*border-top:\s*1px solid rgba\(255,255,255,0\.12\);[\s\S]*background:\s*none;/],
  ['section column packing', /\.plugin-ui-column\s*\{[^}]*display:\s*flex;\s*flex-direction:\s*column;\s*gap:\s*0\.42rem/s],
  ['balanced section renderer', /function arrangePluginUiSections\(wrap,\s*sectionEls,\s*model\)[\s\S]*wrap\.dataset\.uiFlow = 'balanced-columns'[\s\S]*target\.weight \+= Number\(sectionEl\.dataset\.uiWeight\)/],
  ['model-driven section column count', /wrap\.dataset\.uiColumns = String\(model\.sectionColumns\);[\s\S]*const columnCount = Math\.min\(sectionEls\.length,\s*Math\.max\(1,\s*Number\(model\.sectionColumns\) \|\| 1\)\);/],
  ['panel reason stamp', /sectionEl\.dataset\.uiPanelReason = section\.panelReason;/],
  ['dense grid sizing', /\.ui-control-grid\[data-density="dense"\]\s*\{[^}]*minmax\(78px,\s*1fr\)/s],
  ['rack/drawbar strip sizing', /\.ui-control-grid\[data-ui-panel="rack-strip"\][^{]*\{[^}]*minmax\(72px,\s*1fr\)/s],
  ['knob/fader stable cell', /\.ctrl-row\[data-widget="knob"\],\s*\.ctrl-row\[data-widget="fader"\s*\]\s*\{[^}]*min-height:\s*94px/s],
  ['knob hit area', /\.ctrl-row\[data-widget="knob"\] input\[type=range\][\s\S]*width:\s*56px; height:\s*56px; opacity:\s*0; pointer-events:\s*none/s],
  ['knob gesture surface is not text/drag selectable', /\.ctrl-row\[data-widget="knob"\] \.control-stack,[\s\S]*user-select:\s*none;\s*-webkit-user-select:\s*none;\s*-webkit-user-drag:\s*none/s],
  ['relative knob drag', /function bindRelativeControlGesture\(row,\s*control,\s*port,\s*commitControl\)[\s\S]*const beginDrag = \(startEvent[\s\S]*target\.addEventListener\('pointerdown'/],
  ['mouse drag fallback', /target\.addEventListener\('mousedown'[\s\S]*beginDrag\(e,\s*document,\s*document,\s*'mousemove',\s*'mouseup'/],
  ['pointer-start mousemove fallback', /if \(pointerId !== null\) \{[\s\S]*document\.addEventListener\('mousemove',\s*handleMove\);[\s\S]*document\.addEventListener\('mouseup',\s*endDrag\);/],
  ['pointer mouse suppression', /let suppressMouseUntil = 0;[\s\S]*suppressMouseUntil = Date\.now\(\) \+ 800;[\s\S]*if \(Date\.now\(\) < suppressMouseUntil\) \{[\s\S]*cancelRelativePointerEvent\(e\);/],
  ['knob drag deadzone', /function gestureTravelPastDeadzone\(travel,\s*deadzone\)[\s\S]*Math\.abs\(travel\) <= deadzone[\s\S]*Math\.sign\(travel\) \* deadzone/],
  ['hidden range input cannot take over knob gesture', /control\.tabIndex = -1;[\s\S]*control\.setAttribute\('aria-hidden',\s*'true'\);[\s\S]*control\.addEventListener\(eventName,\s*cancelRelativePointerEvent\);/],
  ['no click-to-position knob jump', /const beginDrag = \(startEvent[\s\S]*cancelRelativePointerEvent\(startEvent\);[\s\S]*const startValue = Number\(control\.value\)[\s\S]*const rawTravel = -dy;[\s\S]*gestureTravelPastDeadzone\(rawTravel,\s*moveEvent\.shiftKey \? 1 : 8\)[\s\S]*startValue \+ \(travel \/ pixels\) \* span/],
  ['plain knob clicks are cancelled', /for \(const eventName of \['click',\s*'dblclick',\s*'dragstart'\]\) \{[\s\S]*target\.addEventListener\(eventName,\s*cancelRelativePointerEvent\);/],
  ['stationary knob body', /\.knob-face\s*\{[^}]*transform:\s*none;/s],
  ['rotating knob indicator', /\.knob-face::after\s*\{[^}]*transform:\s*rotate\(var\(--knob-angle,\s*-135deg\)\)/s],
  ['stationary fader cap', /\.ctrl-row\[data-widget="fader"\] \.knob-face::after\s*\{[^}]*transform:\s*none;/s],
  ['full-width menu controls', /\.ctrl-row\[data-widget="menu"\] \.ctrl-line\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[\s\S]*\.ctrl-row\[data-widget="menu"\] select\s*\{[^}]*width:\s*100%;/s],
  ['menu duplicate value hidden', /\.ctrl-row\[data-widget="menu"\] \.val\s*\{[^}]*display:\s*none;/s],
  ['dense menu cells span two tracks', /\.ui-control-grid\[data-density="medium"\] \.ctrl-row\[data-widget="menu"\],[\s\S]*?\.ui-control-grid\[data-density="dense"\] \.ctrl-row\[data-widget="menu"\]\s*\{[^}]*grid-column:\s*span\s*2;[\s\S]*min-width:\s*min\(100%,\s*132px\);/s],
  ['compact label clamp', /-webkit-line-clamp:\s*2/],
  ['mobile breakpoint', /@media \(max-width:\s*900px\)/],
];

for (const [label, pattern] of cssChecks) {
  if (!pattern.test(html)) fail(`missing overlap-safe CSS hook: ${label}`);
}
validateLetterSpacing();

if (!WADSPA_UI_MODEL.artDirection?.knobs?.includes('rotary knobs')) {
  fail('art direction explains rotary-knob default');
}
if (!WADSPA_UI_MODEL.artDirection?.faders?.includes('Reserve vertical faders')) {
  fail('art direction reserves faders for parallel level banks');
}
if (!WADSPA_UI_MODEL.artDirection?.panels?.includes('signal blocks')) {
  fail('art direction explains when to make panels');
}
if (!WADSPA_UI_MODEL.artDirection?.panels?.includes('one/two-control groups compact')) {
  fail('art direction keeps tiny groups compact');
}
if (!WADSPA_UI_MODEL.artDirection?.panels?.includes('cap sparse plugins at two balanced columns')) {
  fail('art direction caps sparse plugins at two balanced columns');
}
if (!WADSPA_UI_MODEL.artDirection?.menus?.includes('reserve wider cells')) {
  fail('art direction reserves wider cells for dense menu banks');
}
if (!WADSPA_UI_MODEL.panelRules?.some(rule => rule.includes('native-tabbed-panel'))) {
  fail('UI model exposes native tab panel rule');
}
if (!WADSPA_UI_MODEL.panelRules?.some(rule => rule.includes('compact-few-controls'))) {
  fail('UI model exposes compact few-control panel rule');
}

validateLayoutContract();

for (const entry of entries) {
  const ports = visibleControlPorts(entry.ports ?? []);
  const model = createWadspaUiModel(entry, { target: entry.target, hints, ports });
  const hint = hints.plugins?.[entry.id] ?? {};
  const counts = countWidgets(model);
  modelsById.set(entry.id, { entry, model, hint, counts });

  for (const [widget, count] of Object.entries(counts)) {
    widgetTotals.set(widget, (widgetTotals.get(widget) ?? 0) + count);
  }

  for (const section of model.sections) {
    if (!PANEL_TYPES.has(section.panel)) fail(`${entry.id}/${section.id}: unsupported panel ${section.panel}`);
    if (!PANEL_REASONS.has(section.panelReason)) fail(`${entry.id}/${section.id}: unsupported panel reason ${section.panelReason}`);
    if (!DENSITY_TYPES.has(section.density)) fail(`${entry.id}/${section.id}: unsupported density ${section.density}`);
    if (section.density === 'dense' && section.fields.length < 24) {
      fail(`${entry.id}/${section.id}: dense section has only ${section.fields.length} fields`);
    }
    if (section.panel === 'dense-bank' && section.panelReason !== 'dense-control-bank') {
      fail(`${entry.id}/${section.id}: dense bank lacks dense-control-bank reason`);
    }
    if (section.panel === 'compact-panel' && section.fields.length <= 2 && section.panelReason !== 'compact-few-controls') {
      fail(`${entry.id}/${section.id}: compact one/two-control section lacks compact-few-controls reason`);
    }
    if (section.panel === 'rack-strip' && section.fields.filter(field => field.widget === 'fader').length < 6) {
      fail(`${entry.id}/${section.id}: rack strip needs at least six faders`);
    }
    if (section.panel === 'rack-strip' && section.panelReason !== 'parallel-fader-bank') {
      fail(`${entry.id}/${section.id}: rack strip lacks parallel-fader-bank reason`);
    }
    if (section.panel === 'drawbar-bank' && !section.fields.some(isRegistrationField)) {
      fail(`${entry.id}/${section.id}: drawbar bank lacks registration-style controls`);
    }
    if (section.panel === 'drawbar-bank' && section.panelReason !== 'drawbar-bank') {
      fail(`${entry.id}/${section.id}: drawbar section lacks drawbar-bank reason`);
    }
    if (hasNativeGroupedPanels(hint) && section.fields.length > 1 && section.panel === 'compact-panel') {
      fail(`${entry.id}/${section.id}: native grouped/tabbed UI should render multi-control sections as panels`);
    }
    if (hasNativeTabbedPanels(hint) && section.fields.length > 1 && section.panelReason !== 'native-tabbed-panel' && section.panel !== 'dense-bank') {
      fail(`${entry.id}/${section.id}: native tabbed UI section should keep native-tabbed-panel reason`);
    }
    if (!hasNativeTabbedPanels(hint) && hasNativeGroupedPanels(hint) && section.fields.length > 1 && section.panelReason !== 'native-grouped-panel' && section.panel !== 'dense-bank') {
      fail(`${entry.id}/${section.id}: native grouped UI section should keep native-grouped-panel reason`);
    }
    if (!hasNativeGroupedPanels(hint)
      && section.fields.length <= 2
      && section.panel !== 'compact-panel'
      && section.panel !== 'rack-strip'
      && section.panel !== 'drawbar-bank') {
      fail(`${entry.id}/${section.id}: tiny sections without native group evidence should stay compact, not ${section.panel}`);
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
  if (model.fields.length <= 9 && model.sections.length > 1 && !['rack', 'drawbar'].includes(model.layout) && model.sectionColumns > 2) {
    fail(`${entry.id}: sparse layouts should not spread across more than two section columns`);
  }

  const eqFrequencyFaders = model.fields.filter(field => (
    field.section === 'equalizer'
      && field.widget === 'fader'
      && /freq|frequency|q\b|bandwidth|\bbw\b|resonance|reso/i.test(`${field.portName} ${field.symbol ?? ''}`)
  ));
  if (eqFrequencyFaders.length > 0) {
    fail(`${entry.id}: EQ frequency/shape controls should be knobs, not faders (${eqFrequencyFaders.map(field => field.portName).join(', ')})`);
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

validateRepresentativeLayouts(modelsById);

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
  if (layout.synthColumn < layout.knobHit + 12) {
    fail(`synth control column ${layout.synthColumn}px is too narrow for ${layout.knobHit}px knob hitboxes`);
  }
  if (layout.synthColumn > 80) {
    fail(`synth control column ${layout.synthColumn}px wastes sparse instrument panel space`);
  }
  if (layout.rackColumn < layout.faderHit + 6) {
    fail(`rack/drawbar column ${layout.rackColumn}px is too narrow for ${layout.faderHit}px fader hitboxes`);
  }
  if (layout.controlMinHeight < layout.faderHeight + 30) {
    fail(`knob/fader row height ${layout.controlMinHeight}px is too short for ${layout.faderHeight}px faders plus label/value text`);
  }
  if (layout.controlMinHeight > 98) {
    fail(`knob/fader row height ${layout.controlMinHeight}px wastes vertical control-surface space`);
  }
  if (layout.knobHit < layout.knobFace + 10) {
    fail(`knob hitbox ${layout.knobHit}px is too close to ${layout.knobFace}px knob face`);
  }
  if (layout.sectionColumn > 160 || layout.synthSection > 180) {
    fail(`section columns ${layout.sectionColumn}px/${layout.synthSection}px are too wide for compact instrument panels`);
  }
  if (layout.sliderSpan < 2) {
    fail(`true slider rows must span at least two columns, found span ${layout.sliderSpan}`);
  }
  if (layout.denseMenuSpan < 2) {
    fail(`dense menu rows must span at least two columns, found span ${layout.denseMenuSpan}`);
  }
  if (layout.denseMenuMin < 128) {
    fail(`dense menu minimum width ${layout.denseMenuMin}px is too narrow for mode/type dropdowns`);
  }
  if (layout.synthMatrixSection < layout.matrixSection) {
    fail(`synth matrix section ${layout.synthMatrixSection}px should be at least the generic matrix section ${layout.matrixSection}px`);
  }
  if (layout.mobileBreakpoint < 720) {
    fail(`mobile breakpoint ${layout.mobileBreakpoint}px is too narrow for dense plugin panels`);
  }
  if (layout.synthSurface.min < 420 || layout.synthSurface.vw < 46 || layout.synthSurface.max < 800) {
    fail(`desktop synth surface ${layout.synthSurface.min}px/${layout.synthSurface.vw}vw/${layout.synthSurface.max}px is too narrow for dense native synth panels`);
  }
}

function validateLetterSpacing() {
  const nonZero = [...html.matchAll(/letter-spacing\s*:\s*([^;'"]+)/g)]
    .map(match => match[1].trim())
    .filter(value => !/^0(?:px|em|rem)?$/.test(value));
  if (nonZero.length > 0) {
    fail(`letter-spacing should stay zero in dense plugin UI (${[...new Set(nonZero)].join(', ')})`);
  }
}

function validateRepresentativeLayouts(models) {
  const synthv1 = requireModel(models, 'synthv1');
  if (synthv1?.model.layout !== 'matrix') fail('synthv1 representative dense synth should use matrix layout');
  if (synthv1?.model.sectionColumns !== 3) fail('synthv1 representative dense synth should allow three balanced columns');
  if ((synthv1?.counts.knob ?? 0) < 100) fail('synthv1 representative dense synth should stay knob-dominant');
  if ((synthv1?.counts.menu ?? 0) < 8) fail('synthv1 representative dense synth should expose dense menu banks');
  validateDenseMenuGeometry(synthv1?.model, 'synthv1');
  if (columnsFor(layout.synthMatrixSection, layout.synthDenseColumn) < 3) {
    fail('minimum synth matrix section should fit at least three dense knob columns');
  }
  if (columnsFor(synthSurfaceWidthAt(1440) - 64, layout.synthMatrixSection, 12) < 2) {
    fail('wide desktop synth surface should show at least two matrix sections per row');
  }

  const tapEq = requireModel(models, 'tap-eq');
  const tapEqRack = tapEq?.model.sections.find(section => section.panel === 'rack-strip');
  if (!tapEqRack) fail('tap-eq representative EQ should use a rack strip');
  if ((tapEq?.counts.fader ?? 0) !== 8 || (tapEq?.counts.knob ?? 0) !== 8) {
    fail('tap-eq representative EQ should render gains as faders and frequencies as knobs');
  }
  if (columnsFor(layout.rackCardMin - 32, layout.rackColumn) < 4) {
    fail('minimum rack card should fit at least four EQ/drawbar columns');
  }

  const setbfree = requireModel(models, 'setbfree');
  if (setbfree?.model.layout !== 'drawbar') fail('setbfree representative organ should use drawbar layout');
  if ((setbfree?.counts.fader ?? 0) < 9) fail('setbfree drawbar bank should expose nine faders');
  if (columnsFor(synthSurfaceWidthAt(1280) - 64, layout.rackColumn) < 6) {
    fail('desktop synth surface should fit a readable drawbar bank');
  }

  const geonkick = requireModel(models, 'geonkick');
  if (geonkick?.model.layout !== 'canvas') fail('geonkick representative envelope editor should keep canvas layout');

  const padthv1 = requireModel(models, 'padthv1');
  validateDenseMenuGeometry(padthv1?.model, 'padthv1');

  const wadspaSynth = requireModel(models, 'wadspa_synth');
  if (wadspaSynth?.model.sectionColumns !== 2) {
    fail('wadspa_synth representative sparse instrument should pack into two columns');
  }

  const stringMachine = requireModel(models, 'string-machine');
  if (stringMachine?.model.layout === 'drawbar') fail('string-machine representative synth should not become a drawbar organ');

  if (columnsFor(312, layout.synthDenseColumn) < 3) {
    fail('mobile synth controls should still fit at least three dense knob columns without horizontal overflow');
  }
}

function validateSectionGeometry(entry, model, section) {
  const column = sectionColumnWidth(model, section);
  for (const field of section.fields) {
    const needed = widgetMinimumWidth(field, section);
    const available = column * widgetColumnSpan(field, section);
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

function widgetMinimumWidth(field, section) {
  if (field.widget === 'knob') return layout.knobHit + 8;
  if (field.widget === 'fader') return layout.faderHit + 6;
  if (field.widget === 'menu') return section.density === 'medium' || section.density === 'dense' ? layout.denseMenuMin : 64;
  if (field.widget === 'toggle') return 42;
  if (field.widget === 'slider') return 90;
  return 0;
}

function widgetColumnSpan(field, section) {
  if (field.widget === 'slider') return layout.sliderSpan;
  if (field.widget === 'menu' && (section.density === 'medium' || section.density === 'dense')) return layout.denseMenuSpan;
  return 1;
}

function validateDenseMenuGeometry(model, id) {
  if (!model) return;
  const denseMenus = model.sections.flatMap(section => (
    section.density === 'medium' || section.density === 'dense'
      ? section.fields.filter(field => field.widget === 'menu').map(field => ({ field, section }))
      : []
  ));
  if (denseMenus.length === 0) return;
  const minWidth = Math.min(...denseMenus.map(({ section }) => sectionColumnWidth(model, section) * layout.denseMenuSpan));
  if (minWidth < layout.denseMenuMin) {
    fail(`${id}: dense menu cells should reserve at least ${layout.denseMenuMin}px, got ${minWidth}px`);
  }
}

function cssNumber(pattern, label) {
  const match = html.match(pattern);
  if (!match) {
    fail(`missing CSS number: ${label}`);
    return 0;
  }
  return Number(match[1]);
}

function cssClamp(pattern, label) {
  const match = html.match(pattern);
  if (!match) {
    fail(`missing CSS clamp: ${label}`);
    return { min: 0, vw: 0, max: 0 };
  }
  return { min: Number(match[1]), vw: Number(match[2]), max: Number(match[3]) };
}

function columnsFor(width, columnWidth, gap = 5) {
  return Math.max(1, Math.floor((width + gap) / (columnWidth + gap)));
}

function synthSurfaceWidthAt(viewportWidth) {
  return Math.min(layout.synthSurface.max, Math.max(layout.synthSurface.min, viewportWidth * layout.synthSurface.vw / 100));
}

function requireModel(models, id) {
  const model = models.get(id);
  if (!model) fail(`${id}: missing representative UI model`);
  return model;
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

function hasNativeTabbedPanels(hint) {
  return Boolean(hint?.nativeLayouts?.includes('tabbed-panel'));
}

function hasCanvasSourceEvidence(hint) {
  return Boolean(hint?.sourceFiles?.some(file => (
    /canvas|graph|EnvelopeUI|OscilGen|widget_(?:wave|env)|samplv1widget_(?:env|wave)|geonkick_lv2_wasm|WolfShaperPlugin/i.test(file)
      && !/DSPFilters/i.test(file)
  )));
}
