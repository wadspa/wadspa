#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');

const instruments = readJson(join(DOCS, 'instruments.json'), []);
const effects = readJson(join(DOCS, 'plugins/catalog.json'), []);
const entries = [...instruments, ...effects].sort((a, b) => a.id.localeCompare(b.id));

const SOURCE_DIRS = {
  adlplug: ['plugins/adlplug'],
  casynth: ['plugins/casynth', 'infamous-plugins/src/casynth'],
  chowkick: ['plugins/chowkick', 'distrho-ports/ports-juce6.1/chow'],
  dexed: ['plugins/dexed', 'distrho-ports/ports-juce5/dexed'],
  drumkv1: ['plugins/drumkv1'],
  helm: ['plugins/helm', 'helm/src/common', 'helm/src/editor'],
  'juce-opl': ['plugins/juce-opl', 'distrho-ports/ports-juce5/juce-opl/source'],
  obxd: ['plugins/obxd', 'distrho-ports/ports-juce5/obxd/source/Gui'],
  padthv1: ['plugins/padthv1'],
  samplv1: ['plugins/samplv1'],
  setbfree: ['plugins/setbfree', 'setBfree/b_synth', 'setBfree/ui'],
  'setBfree-overdrive': ['plugins/setBfree-overdrive', 'setBfree/b_overdrive'],
  'setBfree-reverb': ['plugins/setBfree-reverb', 'setBfree/b_reverb'],
  'string-machine': ['plugins/string-machine', 'string-machine/plugins/string-machine', 'string-machine/resources/ui'],
  synthv1: ['plugins/synthv1'],
  zynaddsubfx: ['plugins/zynaddsubfx', 'zynaddsubfx/src/UI', 'zynaddsubfx/doc/images'],
};

const SKIP_DIRS = new Set([
  '.git',
  'build',
  'builds',
  'cmake-build',
  'dist',
  'dpf',
  'dpf_full',
  'JuceLibraryCode',
  'node_modules',
]);

const output = {
  schema: 'wadspa-ui-hints-v1',
  plugins: {},
};

for (const entry of entries) {
  const dirs = candidateDirs(entry);
  const hint = scanEntry(entry, dirs);
  if (hasHint(hint)) output.plugins[entry.id] = hint;
}

writeFileSync(join(DOCS, 'ui-hints.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`ui hints written (${Object.keys(output.plugins).length}/${entries.length} plugins)`);

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function candidateDirs(entry) {
  const dirs = new Set([`plugins/${entry.id}`]);
  if (entry.id.startsWith('tap-')) dirs.add(`tap-lv2/${entry.id.replace(/^tap-/, '')}`);
  for (const dir of SOURCE_DIRS[entry.id] ?? []) dirs.add(dir);
  return [...dirs]
    .map(dir => join(ROOT, dir))
    .filter(dir => existsSync(dir) && statSync(dir).isDirectory());
}

function scanEntry(entry, dirs) {
  const hint = {
    brand: null,
    label: null,
    modgui: {},
    sourceKinds: new Set(),
    nativeUiTypes: new Set(),
    assets: new Set(),
    nativeLayouts: new Set(),
    nativeWidgets: {
      knobs: 0,
      sliders: 0,
      switches: 0,
      menus: 0,
      panels: 0,
      tabs: 0,
      canvases: 0,
      meters: 0,
    },
    sourceFiles: new Set(),
  };

  for (const dir of dirs) {
    for (const file of walk(dir, 4)) {
      const rel = relative(ROOT, file);
      const base = file.split('/').pop() ?? file;
      const lower = rel.toLowerCase();

      if (lower.includes('/modgui/') || lower.endsWith('/modgui.ttl')) {
        hint.sourceKinds.add('modgui');
      }
      if (isUiSourceFile(base, lower)) {
        hint.sourceFiles.add(rel);
      }

      if (/\.(png|jpg|jpeg|svg|html|css)$/i.test(base)) {
        collectAssetHints(hint, base);
        continue;
      }

      if (!/\.(ttl|cpp|cc|cxx|c|h|hpp|hh|xml|fl)$/i.test(base)) continue;
      if (lower.endsWith('.ttl')) {
        hint.sourceKinds.add('lv2-metadata');
      }
      let text = '';
      try {
        text = readFileSync(file, 'utf8');
      } catch {
        continue;
      }

      collectTextHints(hint, text, rel);
    }
  }

  const nativeLayouts = nativeLayoutsForHint(hint);
  const nativeWidgets = compactCounts(hint.nativeWidgets);
  const normalized = {
    ...(hint.brand ? { brand: hint.brand } : {}),
    ...(hint.label ? { label: hint.label } : {}),
    ...(Object.keys(hint.modgui).length > 0 ? { modgui: hint.modgui } : {}),
    sourceKinds: [...hint.sourceKinds].sort(),
    nativeUiTypes: [...hint.nativeUiTypes].sort(),
    assets: [...hint.assets].sort(),
    ...(nativeLayouts.length > 0 ? { nativeLayouts } : {}),
    ...(Object.keys(nativeWidgets).length > 0 ? { nativeWidgets } : {}),
    sourceFiles: [...hint.sourceFiles].sort().slice(0, 16),
  };

  if (normalized.sourceKinds.length === 0 && /Zam|ZaMulti|ZaMaxim/i.test(entry.id)) {
    normalized.sourceKinds.push('dpf-native-ui');
  }

  return normalized;
}

function collectAssetHints(hint, base) {
  const lower = base.toLowerCase();
  if (/knob|dial/.test(lower)) hint.assets.add('knob');
  if (/slider|fader/.test(lower)) hint.assets.add('slider');
  if (/switch|button|footswitch|toggle/.test(lower)) hint.assets.add('switch');
  if (/meter|led|light/.test(lower)) hint.assets.add('meter');
  if (/background|screenshot|thumbnail/.test(lower)) hint.assets.add('panel-art');
}

function collectTextHints(hint, text, rel) {
  const lowerRel = rel.toLowerCase();
  const hasCanvasEditor = hasCanvasEditorEvidence(text);
  collectNativeWidgetHints(hint, text, { hasCanvasEditor });

  if (hasCanvasEditor) {
    hint.assets.add('canvas-editor');
    hint.sourceFiles.add(rel);
  }

  for (const match of text.matchAll(/\b(?:mod|modgui):brand\s+"([^"]+)"/g)) {
    hint.brand ??= match[1];
    hint.sourceKinds.add(rel.includes('modgui') ? 'modgui' : 'lv2-mod-metadata');
  }
  for (const match of text.matchAll(/\b(?:mod|modgui):label\s+"([^"]+)"/g)) {
    hint.label ??= match[1];
    hint.sourceKinds.add(rel.includes('modgui') ? 'modgui' : 'lv2-mod-metadata');
  }
  for (const key of ['model', 'panel', 'color', 'knob']) {
    const pattern = new RegExp(`\\b(?:mod|modgui):${key}\\s+"([^"]+)"`, 'g');
    for (const match of text.matchAll(pattern)) {
      hint.modgui[key] ??= match[1];
      hint.sourceKinds.add('modgui');
      if (key === 'panel' && /slider|fader/i.test(match[1])) hint.assets.add('slider');
      if (key === 'panel' && /knob|dial/i.test(match[1])) hint.assets.add('knob');
      if (key === 'knob') hint.assets.add('knob');
    }
  }
  for (const match of text.matchAll(/\b(?:lv2ui|ui):([A-Za-z0-9_]+UI)\b/g)) {
    hint.nativeUiTypes.add(match[1]);
    hint.sourceKinds.add('lv2-native-ui');
  }
  if (/modgui:gui|modgui:resourcesDirectory|modgui:iconTemplate/.test(text)) {
    hint.sourceKinds.add('modgui');
  }
  if (/\bQWidget\b|\bQDialog\b|\bQApplication\b|\bQt::|Qt[456]UI/.test(text)) {
    hint.nativeUiTypes.add('QtUI');
    hint.sourceKinds.add('qt-native-ui');
  }
  if (/\bGTK\b|\bGtk\b|gtk_widget|GtkUI/.test(text)) {
    hint.nativeUiTypes.add('GtkUI');
    hint.sourceKinds.add('gtk-native-ui');
  }
  if (/\bFl_(?:Group|Tabs|Dial|Slider|Choice|Button)\b|\bFL\/Fl_/i.test(text)) {
    hint.nativeUiTypes.add('FLTKUI');
    hint.sourceKinds.add('fltk-native-ui');
  }
  if (/DISTRHO_UI|DistrhoUI|NanoVG|CairoUI|ExternalUI/.test(text)) {
    hint.nativeUiTypes.add('DPFUI');
    hint.sourceKinds.add('dpf-native-ui');
  }
  if (/mod-slider|button-type=["']slider|class=["'][^"']*slider/i.test(text)) hint.assets.add('slider');
  if (/mod-knob|button-type=["']knob|class=["'][^"']*(knob|dial)/i.test(text)) hint.assets.add('knob');
  if (/OBJ_DRAWBAR|drawbar/i.test(text)) hint.assets.add('drawbar');
  if (/OBJ_DIAL|\bdial\b|\bknob\b/i.test(text)) hint.assets.add('knob');
  if (/OBJ_SWITCH|\bswitch\b|\btoggle\b/i.test(text)) hint.assets.add('switch');
  if (/Graph\.hpp|lineEditor|graph\s*state|spline-based graph/i.test(text) && !lowerRel.includes('/dspfilters/')) {
    hint.assets.add('canvas-editor');
    hint.sourceFiles.add(rel);
  }
}

function collectNativeWidgetHints(hint, text, options = {}) {
  addMatches(hint.nativeWidgets, 'knobs', text, /\bQDial\b|\bFl_Dial\b|\bqsynthKnob\b|\bOBJ_DIAL\b|mod-knob|button-type=["']knob/gi);
  addMatches(hint.nativeWidgets, 'sliders', text, /\bQSlider\b|\bFl_Slider\b|\bGtkScale\b|gtk_scale|\buiSlider\b|add(?:Horizontal|Vertical)Slider|button-type=["']slider|mod-slider/gi);
  addMatches(hint.nativeWidgets, 'switches', text, /\bQCheckBox\b|\bGtkToggleButton\b|\bGtkSwitch\b|gtk_check_button|\bFl_(?:Check_)?Button\b|\bOBJ_SWITCH\b|footswitch/gi);
  addMatches(hint.nativeWidgets, 'menus', text, /\bQComboBox\b|\bGtkCombo\b|\bGtkMenu\b|\bFl_Choice\b|\buiMenu\b/gi);
  addMatches(hint.nativeWidgets, 'panels', text, /\bQGroupBox\b|\bGtkFrame\b|gtk_frame_new|\bFl_Group\b|add(?:Horizontal|Vertical)Box/gi);
  addMatches(hint.nativeWidgets, 'tabs', text, /\bQTabWidget\b|\bGtkNotebook\b|gtk_notebook|\bFl_Tabs\b|openTabBox/gi);
  if (options.hasCanvasEditor) hint.nativeWidgets.canvases += 1;
  addMatches(hint.nativeWidgets, 'meters', text, /\bmeter\b|\bled\b|LevelMeter|VU\s*Meter/gi);
}

function hasCanvasEditorEvidence(text) {
  return /\bcanvas\b[\s\S]{0,80}\b(?:edit|edits|editor|point|draw|drag|state|envelope|curve)\b/i.test(text)
    || /\b(?:edit|edits|editor|point|draw|drag|state|envelope|curve)\b[\s\S]{0,80}\bcanvas\b/i.test(text)
    || /\bspline-based graph\b/i.test(text)
    || /\b(?:curve|graph)\s+editor\b/i.test(text)
    || /\blineEditor\b|OscilGen|EnvelopeUI|widget_(?:wave|env)|QPainter[\s\S]{0,500}\b(?:wave|envelope|curve)\b/i.test(text);
}

function addMatches(counts, key, text, pattern) {
  counts[key] += [...text.matchAll(pattern)].length;
}

function nativeLayoutsForHint(hint) {
  const layouts = new Set(hint.nativeLayouts);
  const counts = hint.nativeWidgets;
  if (counts.panels > 0) layouts.add('grouped-panel');
  if (counts.tabs > 0) layouts.add('tabbed-panel');
  if (counts.canvases > 0 || hint.assets.has('canvas-editor')) layouts.add('canvas-editor');
  if (counts.knobs >= Math.max(4, counts.sliders * 2)) layouts.add('dial-bank');
  if (counts.sliders >= 6 && counts.sliders > counts.knobs) layouts.add('fader-strip');
  return [...layouts].sort();
}

function compactCounts(counts) {
  return Object.fromEntries(Object.entries(counts).filter(([, value]) => value > 0));
}

function isUiSourceFile(base, lower) {
  if (lower.includes('/dspfilters/')) return false;
  return /\b(gui|ui|layout|editor|view)\b/i.test(base)
    || /widget|knob|dial|slider|fader|switch|panel|palette|levelmeter|\bgraph\b|\bvu\b/i.test(base)
    || lower.endsWith('.fl')
    || lower.includes('/modgui/');
}

function* walk(dir, depth) {
  if (depth < 0) return;
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(path, depth - 1);
    } else {
      yield path;
    }
  }
}

function hasHint(hint) {
  return Boolean(hint.brand)
    || Boolean(hint.label)
    || Object.keys(hint.modgui ?? {}).length > 0
    || hint.sourceKinds.length > 0
    || hint.nativeUiTypes.length > 0
    || hint.assets.length > 0
    || (hint.nativeLayouts?.length ?? 0) > 0
    || Object.values(hint.nativeWidgets ?? {}).some(value => value > 0)
    || hint.sourceFiles.length > 0;
}
