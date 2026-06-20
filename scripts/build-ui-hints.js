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
    sourceKinds: new Set(),
    nativeUiTypes: new Set(),
    assets: new Set(),
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
      if (/\b(gui|ui|widget|layout|editor|view)\b/i.test(base) || lower.includes('/modgui/')) {
        hint.sourceFiles.add(rel);
      }

      if (/\.(png|jpg|jpeg|svg|html|css)$/i.test(base)) {
        collectAssetHints(hint, base);
        continue;
      }

      if (!/\.(ttl|cpp|cc|cxx|c|h|hpp|hh|xml|fl)$/i.test(base)) continue;
      let text = '';
      try {
        text = readFileSync(file, 'utf8');
      } catch {
        continue;
      }

      collectTextHints(hint, text, rel);
    }
  }

  const normalized = {
    ...(hint.brand ? { brand: hint.brand } : {}),
    ...(hint.label ? { label: hint.label } : {}),
    sourceKinds: [...hint.sourceKinds].sort(),
    nativeUiTypes: [...hint.nativeUiTypes].sort(),
    assets: [...hint.assets].sort(),
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
  for (const match of text.matchAll(/\b(?:mod|modgui):brand\s+"([^"]+)"/g)) {
    hint.brand ??= match[1];
    hint.sourceKinds.add(rel.includes('modgui') ? 'modgui' : 'lv2-mod-metadata');
  }
  for (const match of text.matchAll(/\b(?:mod|modgui):label\s+"([^"]+)"/g)) {
    hint.label ??= match[1];
    hint.sourceKinds.add(rel.includes('modgui') ? 'modgui' : 'lv2-mod-metadata');
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
  if (/DISTRHO_UI|DistrhoUI|NanoVG|CairoUI|ExternalUI/.test(text)) {
    hint.nativeUiTypes.add('DPFUI');
    hint.sourceKinds.add('dpf-native-ui');
  }
  if (/OBJ_DRAWBAR|drawbar/i.test(text)) hint.assets.add('drawbar');
  if (/OBJ_DIAL|\bdial\b|\bknob\b/i.test(text)) hint.assets.add('knob');
  if (/OBJ_SWITCH|\bswitch\b|\btoggle\b/i.test(text)) hint.assets.add('switch');
  if (/\bcanvas\b|\bwave\b|\bspline\b|\benvelope\b|OscilGen|EnvelopeUI/i.test(text)) {
    hint.assets.add('canvas-editor');
  }
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
    || hint.sourceKinds.length > 0
    || hint.nativeUiTypes.length > 0
    || hint.assets.length > 0
    || hint.sourceFiles.length > 0;
}
