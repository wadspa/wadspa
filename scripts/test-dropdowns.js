#!/usr/bin/env node
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'docs/index.html'), 'utf8');
const core = readFileSync(join(ROOT, 'docs/core.js'), 'utf8');
const instruments = JSON.parse(readFileSync(join(ROOT, 'docs/instruments.json'), 'utf8'));
const effects = JSON.parse(readFileSync(join(ROOT, 'docs/plugins/catalog.json'), 'utf8'));
const uiHints = JSON.parse(readFileSync(join(ROOT, 'docs/ui-hints.json'), 'utf8'));

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertIncludes(haystack, needle, message) {
  assert(haystack.includes(needle), message);
}

function assertMatches(pattern, message) {
  assert(pattern.test(html), message);
}

function duplicateIds(entries) {
  const seen = new Set();
  const duplicates = new Set();
  for (const entry of entries) {
    if (seen.has(entry.id)) duplicates.add(entry.id);
    seen.add(entry.id);
  }
  return [...duplicates];
}

function missingField(entries, field) {
  return entries.filter(entry => !entry[field]).map(entry => entry.id ?? entry.name ?? '<unknown>');
}

function malformedCanvasEditors(entries) {
  const bad = [];
  for (const entry of entries) {
    for (const editor of entry.canvasEditors ?? []) {
      if (!editor.key || !editor.name || !Array.isArray(editor.defaultPoints) || editor.defaultPoints.length < 2) {
        bad.push(`${entry.id}/${editor.key ?? '<missing-key>'}`);
        continue;
      }
      for (const point of editor.defaultPoints) {
        if (!Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))) {
          bad.push(`${entry.id}/${editor.key}`);
          break;
        }
      }
    }
  }
  return bad;
}

function functionBody(name) {
  const start = html.indexOf(`function ${name}(`);
  assert(start !== -1, `${name}() exists`);
  if (start === -1) return '';

  const firstBrace = html.indexOf('{', start);
  let depth = 0;
  for (let i = firstBrace; i < html.length; i += 1) {
    const ch = html[i];
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) return html.slice(firstBrace + 1, i);
  }
  fail(`${name}() has a balanced body`);
  return '';
}

assert(Array.isArray(instruments) && instruments.length > 0, 'instrument catalog is not empty');
assert(Array.isArray(effects) && effects.length > 0, 'effect catalog is not empty');
assert(duplicateIds(instruments).length === 0, 'instrument ids are unique');
assert(duplicateIds(effects).length === 0, 'effect ids are unique');
assert(missingField(instruments, 'id').length === 0, 'every instrument has an id');
assert(missingField(instruments, 'name').length === 0, 'every instrument has a name');
assert(missingField(instruments, 'license').length === 0, 'every instrument has a license for the dropdown');
assert(missingField(effects, 'id').length === 0, 'every effect has an id');
assert(missingField(effects, 'name').length === 0, 'every effect has a name');
assert(missingField(effects, 'category').length === 0, 'every effect has a category for dropdown grouping');
assert(missingField(effects, 'license').length === 0, 'every effect has a license for the dropdown');
assert(malformedCanvasEditors(instruments).length === 0, 'instrument canvas editors have key/name/default points');

assertIncludes(html, '<button id="instrument-btn">', 'instrument dropdown button exists');
assertIncludes(html, '<div id="instrument-dropdown">', 'instrument dropdown container exists');
assertIncludes(html, '<h2 id="chain-title">effects / plugins chain</h2>', 'effect chain heading has a countable title node');
assertIncludes(html, '<button id="add-btn">', 'effect dropdown button exists');
assertMatches(/<div\b[^>]*\bid="dropdown"[^>]*>/, 'effect dropdown container exists');
assertMatches(/#instrument-dropdown\.open\s*\{\s*display:\s*block;\s*\}/, 'instrument dropdown open class makes it visible');
assertMatches(/\.dropdown\.open\s*\{\s*display:\s*block;\s*\}/, 'effect dropdown open class makes it visible');
assertIncludes(html, '--dropdown-width: 365px;', 'shared dropdown width token exists');
assertMatches(/#instrument-dropdown\s*\{[\s\S]*width:\s*var\(--dropdown-width\);[\s\S]*max-width:\s*calc\(100vw - 1rem\);[\s\S]*max-height:\s*60vh;[\s\S]*overflow-y:\s*auto;/, 'instrument dropdown uses the shared size and scroll behavior');
assertMatches(/\.dropdown\s*\{[\s\S]*width:\s*var\(--dropdown-width\);[\s\S]*max-width:\s*calc\(100vw - 1rem\);[\s\S]*max-height:\s*60vh;[\s\S]*overflow-y:\s*auto;/, 'effect dropdown uses the shared size and scroll behavior');

assertIncludes(html, 'function setPluginMenuItemContent(item, plugin)', 'shared dropdown item renderer exists');
assertIncludes(html, "import { WADSPA_UI_MODEL, createWadspaUiModel } from './ui-model.js", 'wadspa UI model is imported');
assertIncludes(html, "await fetch('./ui-hints.json'", 'native UI hints are loaded by the browser page');
assertIncludes(html, 'function renderPluginControls(container, node, plugin, options = {})', 'shared model-driven control renderer exists');
assertIncludes(html, "wrap.dataset.uiModel = WADSPA_UI_MODEL.schema;", 'control renderer stamps the UI model schema into the DOM');
assertIncludes(html, 'const model = createWadspaUiModel(plugin, {', 'control renderer builds a wadspa UI model per plugin');
assertIncludes(html, "row.dataset.widget = field.widget;", 'model widget type is exposed on each control row');
assertIncludes(html, 'syncControlVisual(control);', 'knob and fader visuals are synchronized with control values');
assertIncludes(html, 'function buildCanvasEditors(container, node, plugin)', 'instrument canvas editor renderer exists');
assertIncludes(html, 'function buildCurveCanvas(container, node, editor)', 'generic editable curve canvas exists');
assertIncludes(html, 'node.setPluginState(editor.key, normalizedPointsToState(pts));', 'canvas editors write state into the plugin');
assertIncludes(html, 'canvas.setPointerCapture?.(e.pointerId);', 'canvas editors capture pointer drags');
assertIncludes(html, 'canvas.releasePointerCapture?.(e.pointerId);', 'canvas editors release pointer drags');
assertIncludes(html, 'const R = 14 * SIZE / getRect().width;', 'canvas editors use a forgiving point hit target');
assertIncludes(html, 'if (e.button !== 2 && pts.length < maxPoints)', 'canvas editors add a point on normal click-drag');
assertIncludes(html, 'buildCanvasEditors(ctrls, node, inst);', 'instrument controls render canvas editors');
assertIncludes(html, "name.className = 'item-name';", 'dropdown item renderer keeps a selectable name span');
assertIncludes(html, "badge.className = 'license-badge';", 'dropdown item renderer keeps a license badge');
assertIncludes(html, 'item.appendChild(name);', 'dropdown item name remains inside the clickable row');
assertIncludes(html, 'item.appendChild(badge);', 'dropdown item badge remains inside the clickable row');
assertIncludes(html, "document.getElementById('chain-title').textContent = EFFECTS.length", 'effect chain heading shows the supported effect count');
assert(uiHints.schema === 'wadspa-ui-hints-v1', 'UI hints use the wadspa UI hint schema');
assert(Object.keys(uiHints.plugins ?? {}).length >= instruments.length + effects.length - 2, 'UI hints cover nearly the entire catalog');
assertIncludes(html, 'id="midi-connect-btn"', 'MIDI connect button exists');
assertIncludes(html, 'id="midi-status-lbl"', 'MIDI status label exists');
assertIncludes(html, 'navigator.requestMIDIAccess({ sysex: false })', 'Web MIDI access is requested without sysex');
assertIncludes(html, 'input.onmidimessage = handleMidiMessage;', 'MIDI inputs are bound to the message handler');
assertIncludes(html, 'midiAccess.onstatechange = handleMidiStateChange;', 'MIDI device changes rebind inputs');
assertIncludes(html, 'synth?.midi(status, data1, data2);', 'MIDI channel messages are forwarded to the active synth');
assertIncludes(html, 'synth?.midi(0x80 | channel, data1, 0);', 'MIDI note-off and zero-velocity note-on are normalized');
assertIncludes(html, 'ctx?.resume();', 'MIDI input resumes the audio context');
assertIncludes(html, 'releaseMidiNotes(synth);', 'instrument switching releases held MIDI notes');
assertIncludes(html, '.midi-dot.loaded', 'MIDI connection status has a visible connected state');

const effectDropdown = functionBody('buildDropdown');
assertIncludes(effectDropdown, "const dd = document.getElementById('dropdown');", 'effect dropdown targets #dropdown');
assertIncludes(effectDropdown, 'const categories = [...new Set(EFFECTS.map(e => e.category))]', 'effect dropdown is generated from the effect catalog');
assertIncludes(effectDropdown, 'count.textContent = `${EFFECTS.length} supported effects/plugins`;', 'effect dropdown shows the supported effect/plugin count');
assertIncludes(effectDropdown, "item.className = 'dropdown-item';", 'effect rows use the selectable dropdown-item class');
assertIncludes(effectDropdown, 'item.dataset.effect = eff.id;', 'effect rows expose stable data-effect ids');
assertIncludes(effectDropdown, 'setPluginMenuItemContent(item, eff);', 'effect rows render name and license badge');
assertIncludes(effectDropdown, "item.addEventListener('click', () => addEffect(eff));", 'effect rows call addEffect when selected');
assertIncludes(effectDropdown, 'dd.appendChild(item);', 'effect rows are appended to the menu');
assertIncludes(html, 'function effectButtonLabel()', 'effect button label helper exists');
assertIncludes(effectDropdown, 'document.getElementById(\'add-btn\').textContent = effectButtonLabel();', 'effect dropdown uses the counted button label');

const instrumentDropdown = functionBody('buildInstrumentDropdown');
assertIncludes(instrumentDropdown, "const dd = document.getElementById('instrument-dropdown');", 'instrument dropdown targets #instrument-dropdown');
assertIncludes(instrumentDropdown, 'count.textContent = `${INSTRUMENTS.length} supported instruments`;', 'instrument dropdown shows the supported instrument count');
assertIncludes(instrumentDropdown, 'for (const inst of INSTRUMENTS)', 'instrument dropdown is generated from the instrument catalog');
assertIncludes(instrumentDropdown, "item.className = 'inst-item' + (inst === activeInstrument ? ' active' : '');", 'instrument rows use the selectable inst-item class');
assertIncludes(instrumentDropdown, 'item.dataset.inst = inst.id;', 'instrument rows expose stable data-inst ids');
assertIncludes(instrumentDropdown, 'setPluginMenuItemContent(item, inst);', 'instrument rows render name and license badge');
assertIncludes(instrumentDropdown, "item.addEventListener('click', e => {", 'instrument rows register a click handler');
assertIncludes(instrumentDropdown, 'e.stopPropagation();', 'instrument row clicks do not immediately close through the document handler');
assertIncludes(instrumentDropdown, "document.getElementById('instrument-dropdown').classList.remove('open');", 'instrument selection closes the menu');
assertIncludes(instrumentDropdown, 'switchInstrument(inst);', 'instrument selection switches the synth');
assertIncludes(instrumentDropdown, 'dd.appendChild(item);', 'instrument rows are appended to the menu');
assertIncludes(html, 'function instrumentButtonLabel()', 'instrument button label helper exists');
assertIncludes(instrumentDropdown, 'btn.textContent = instrumentButtonLabel();', 'instrument dropdown uses the counted button label');

const switchInstrument = functionBody('switchInstrument');
assertIncludes(switchInstrument, "document.getElementById('instrument-btn').textContent = instrumentButtonLabel();", 'instrument selection preserves the supported count in the button');

assertIncludes(core, 'const assetVersion = Date.now().toString(36);', 'runtime creates a per-page asset cache version');
assertIncludes(core, 'function cacheBustedUrl(url)', 'runtime has a cache-busted asset URL helper');
assertIncludes(core, "resolved.searchParams.set('wadspa_v', assetVersion);", 'runtime appends the cache version to plugin assets');
assertIncludes(core, "fetch(cacheBustedUrl(wasmUrl), { cache: 'no-cache' })", 'runtime fetches fresh WASM assets');
assertIncludes(core, 'const loadedWorkletModules = new WeakMap();', 'runtime tracks loaded worklet modules per audio context');
assertIncludes(core, 'await ctx.audioWorklet.addModule(workletUrl);', 'runtime loads the cache-busted worklet URL');

const geonkick = instruments.find(entry => entry.id === 'geonkick');
assert(Boolean(geonkick?.canvasEditors?.some(editor => editor.key === 'kick_amp_env')), 'geonkick exposes an amp envelope canvas editor');
assert(Boolean(geonkick?.canvasEditors?.some(editor => editor.key === 'osc_pitch_env')), 'geonkick exposes a pitch envelope canvas editor');

assertIncludes(html, "document.getElementById('add-btn').addEventListener('click', e => {", 'effect dropdown button has a click handler');
assertIncludes(html, "document.getElementById('dropdown').classList.toggle('open');", 'effect dropdown button toggles the open state');
assertIncludes(html, "function closeDropdown() { document.getElementById('dropdown').classList.remove('open'); }", 'effect dropdown can close');
assertIncludes(html, "document.getElementById('instrument-btn').addEventListener('click', e => {", 'instrument dropdown button has a click handler');
assertIncludes(html, "document.getElementById('instrument-dropdown').classList.toggle('open');", 'instrument dropdown button toggles the open state');
assertIncludes(html, "document.getElementById('instrument-dropdown').classList.remove('open');", 'instrument dropdown can close');

if (failures > 0) {
  console.error(`dropdown UI wiring failed: ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}

console.log(`dropdown UI wiring ok (${instruments.length} instruments, ${effects.length} effects)`);
