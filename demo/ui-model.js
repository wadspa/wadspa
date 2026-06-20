import {
  portUsesHz,
  scalePointOptions,
  usesMenuControl,
  visibleControlPorts,
} from './control-utils.js';

export const WADSPA_UI_MODEL = Object.freeze({
  schema: 'wadspa-ui-model-v1',
  widgets: Object.freeze(['knob', 'slider', 'fader', 'toggle', 'menu', 'canvas']),
  artDirection: Object.freeze({
    knobs: 'Default continuous synth/effect controls to rotary knobs, matching Qt/LV2 dial-heavy native UIs.',
    faders: 'Reserve vertical faders for EQ gain strips, drawbars, and true gain banks where scanning parallel levels matters.',
    menus: 'Use menus for enumerated mode/type/select controls, including integer controls with embedded numeric choice labels.',
    panels: 'Promote coherent signal blocks into panels when they have enough controls, dense controls, or native group-box/panel hints; keep one/two-control groups compact and cap sparse plugins at two balanced columns.',
    canvas: 'Use canvas layouts only for real editable curve/envelope/wave editors exposed by the web port.',
  }),
  panelRules: Object.freeze([
    'drawbar-bank: organ registrations and native drawbar banks',
    'parallel-fader-bank: EQ gains, drawbars, and repeated level strips',
    'dense-control-bank: very large control families that need matrix packing',
    'native-tabbed-panel: Qt/GTK/FLTK tab hints from source UI files',
    'native-grouped-panel: Qt/GTK/FLTK group/frame hints from source UI files',
    'signal-block: oscillator, filter, envelope, and modulation blocks',
    'program-block: preset, sample, and program controls',
    'compact-few-controls: one/two-control groups stay unframed',
  ]),
  sections: Object.freeze([
    'oscillators',
    'drawbars',
    'drum',
    'filter',
    'envelopes',
    'modulation',
    'equalizer',
    'dynamics',
    'drive',
    'space',
    'mixer',
    'playback',
    'tone',
  ]),
});

const SECTION_TITLES = {
  oscillators: 'oscillators',
  drawbars: 'drawbars',
  drum: 'drum',
  filter: 'filter',
  envelopes: 'envelopes',
  modulation: 'modulation',
  equalizer: 'equalizer',
  dynamics: 'dynamics',
  drive: 'drive',
  space: 'delay / reverb',
  mixer: 'mixer',
  playback: 'program / sample',
  tone: 'tone',
};

const SECTION_ORDER = new Map(WADSPA_UI_MODEL.sections.map((section, index) => [section, index]));

export function createWadspaUiModel(plugin, options = {}) {
  const hint = uiHintForPlugin(plugin, options.hints);
  const ports = options.ports ?? visibleControlPorts(plugin?.ports ?? []);
  const family = inferFamily(plugin, hint, options.target);
  const fields = ports.map((port, index) => {
    const section = sectionForPort(port, plugin, family, hint);
    const role = roleForPort(port, section);
    return {
      id: portId(port, index),
      port,
      portName: port.name,
      symbol: port.symbol ?? null,
      label: portLabel(port),
      section,
      role,
      widget: widgetForPort(port, section, role, ports, hint),
      priority: priorityForPort(port, section, index),
      options: scalePointOptions(port),
      unit: unitForPort(port),
    };
  });

  const layout = layoutForPlugin(plugin, family, fields, hint);
  const sections = sectionsForFields(fields, hint);

  return {
    schema: WADSPA_UI_MODEL.schema,
    pluginId: plugin?.id ?? null,
    pluginName: plugin?.name ?? plugin?.label ?? 'plugin',
    brand: hint?.brand ?? brandFromName(plugin?.name ?? plugin?.label ?? ''),
    label: hint?.label ?? plugin?.name ?? plugin?.label ?? 'plugin',
    category: plugin?.category ?? null,
    family,
    layout,
    sectionColumns: sectionColumnCountForLayout(layout, fields, sections),
    sourceHints: sourceHintsForModel(hint),
    fields,
    sections,
    canvasEditors: plugin?.canvasEditors ?? [],
  };
}

export function uiHintForPlugin(plugin, hints = {}) {
  if (!plugin) return {};
  return hints?.plugins?.[plugin.id] ?? hints?.[plugin.id] ?? {};
}

export function fieldByPortName(model, portName) {
  return model?.fields?.find(field => field.portName === portName) ?? null;
}

function sectionsForFields(fields, hint) {
  const grouped = new Map();
  for (const field of fields) {
    if (!grouped.has(field.section)) grouped.set(field.section, []);
    grouped.get(field.section).push(field);
  }
  return [...grouped.entries()]
    .sort((a, b) => (SECTION_ORDER.get(a[0]) ?? 99) - (SECTION_ORDER.get(b[0]) ?? 99))
    .map(([id, sectionFields]) => {
      const panel = panelForSection(id, sectionFields, hint);
      return {
        id,
        title: SECTION_TITLES[id] ?? id,
        panel: panel.type,
        panelReason: panel.reason,
        density: densityForFields(sectionFields),
        fields: sectionFields.sort((a, b) => a.priority - b.priority),
      };
    });
}

function inferFamily(plugin, hint, target) {
  const text = modelText(plugin, hint);
  if (target === 'instrument') return 'instrument';
  if (/instrument|synth|oscillator|organ|piano|drum|kick|midi/i.test(text)) return 'instrument';
  if (/equalizer|\beq\b|filter|shelf|band/i.test(text)) return 'tone-shaper';
  if (/compress|limiter|gate|dynamic|de[-_ ]?ess/i.test(text)) return 'dynamics';
  if (/delay|echo|reverb|chorus|flanger|phaser|vibrato|tremolo/i.test(text)) return 'time-modulation';
  if (/distort|drive|tube|saturat|clip|shaper/i.test(text)) return 'drive';
  return 'effect';
}

function layoutForPlugin(plugin, family, fields, hint) {
  if ((plugin?.canvasEditors?.length ?? 0) > 0) return 'canvas';
  if (fields.some(field => field.section === 'drawbars')) return 'drawbar';
  if (fields.length >= 80) return 'matrix';
  if (family === 'instrument') return 'instrument';
  if (family === 'tone-shaper' || fields.filter(field => field.section === 'equalizer').length >= 6) return 'rack';
  if (fields.length <= 4) return 'compact';
  return 'panel';
}

function sectionColumnCountForLayout(layout, fields, sections) {
  if (sections.length <= 1 || layout === 'rack' || layout === 'drawbar') return 1;
  if (layout === 'compact' || fields.length <= 9) return Math.min(sections.length, 2);
  return Math.min(sections.length, 3);
}

function sourceHintsForModel(hint) {
  return {
    sourceKinds: hint?.sourceKinds ?? [],
    nativeUiTypes: hint?.nativeUiTypes ?? [],
    assets: hint?.assets ?? [],
    nativeLayouts: hint?.nativeLayouts ?? [],
    nativeWidgets: hint?.nativeWidgets ?? {},
    modgui: hint?.modgui ?? null,
    sourceFiles: hint?.sourceFiles ?? [],
  };
}

function sectionForPort(port, plugin, family, hint) {
  const text = portText(port);
  const all = modelText(plugin, hint);

  const organLike = /drawbar|tonewheel|organ|setbfree/i.test(all);
  if (/drawbar|tonewheel/i.test(text)
    || (organLike && /(?:harmonic\s*(?:bar|level|mix)?|[0-9]'\s*(?:drawbar|level)?)/i.test(text))) {
    return 'drawbars';
  }
  if (/kick|drum|snare|hat|cymbal|tom|trigger|beatbox|velocity|accent/i.test(text) || /drum|kick/i.test(all)) {
    if (!/volume|gain|level|mix/i.test(text)) return 'drum';
  }
  if (/osc|operator|carrier|modulator|wave|wavetable|pulse|pwm|sync|unison|voice|detune|transpose|octave|semi|ratio/i.test(text)) {
    return 'oscillators';
  }
  if (/filter|cutoff|resonance|reso|\bq\b|pole|shelf|xover|crossover|vcf|dcf/i.test(text)) {
    if (!isEqPort(port)) return 'filter';
  }
  if (/attack|decay|sustain|release|hold|envelope|\badsr\b|\benv\b/i.test(text)) {
    return 'envelopes';
  }
  if (/lfo|mod|vibrato|tremolo|chorus|flanger|phaser|autopan|rate|depth|amount|slowdown/i.test(text)) {
    return 'modulation';
  }
  if (isEqPort(port) || /equalizer|\beq\b|band\s*\d|band\d/i.test(all)) {
    return 'equalizer';
  }
  if (/compress|limiter|gate|threshold|ratio|knee|makeup|sidechain|rms|peak|gain\s*reduction|de[-_ ]?ess|slew/i.test(text)) {
    return 'dynamics';
  }
  if (/drive|distort|tube|saturat|clip|fold|shape|warmth|degrade|bit|word|alias/i.test(text)) {
    return 'drive';
  }
  if (/delay|echo|reverb|room|size|damp|diffusion|feedback|wet|dry|mix|reflect|tail/i.test(text)) {
    return 'space';
  }
  if (/sample|soundfont|sf2|program|preset|bank|mode|model|algorithm|channel/i.test(text)) {
    return 'playback';
  }
  if (/gain|level|volume|pan|balance|width|stereo|input|output|master|dry|wet|mix/i.test(text)) {
    return 'mixer';
  }
  if (family === 'dynamics') return 'dynamics';
  if (family === 'time-modulation') return 'space';
  if (family === 'drive') return 'drive';
  return 'tone';
}

function roleForPort(port, section) {
  const text = portText(port);
  if (usesMenuControl(port)) return 'mode';
  if (port.toggled) return 'switch';
  if (portUsesHz(port)) return 'frequency';
  if (/attack|decay|sustain|release|hold/i.test(text)) return 'envelope';
  if (/gain|level|volume|boost|cut|threshold|makeup/i.test(text)) return 'level';
  if (/ratio|knee|q\b|bandwidth|\bbw\b|resonance|reso/i.test(text)) return 'shape';
  if (/rate|speed|time|delay|feedback|depth|amount|mix|wet|dry/i.test(text)) return 'motion';
  return section;
}

function widgetForPort(port, section, role, ports, hint) {
  if (usesMenuControl(port)) return 'menu';
  if (port.toggled) return 'toggle';
  if (section === 'drawbars' && /drawbar|harmonic|foot|[0-9]'/i.test(portText(port))) return 'fader';
  if (section === 'equalizer' && role === 'level' && isEqFaderBank(port, ports, hint)) return 'fader';
  if (/knobs/i.test(hint?.modgui?.panel ?? '')) return 'knob';
  if (role === 'envelope') return 'knob';
  if (role === 'frequency' || role === 'shape' || role === 'motion') return 'knob';
  if (section === 'mixer' && role === 'level' && isMixerFaderBank(port, ports)) return 'fader';
  if (/(?:sample|loop)\s*(?:start|end|position|offset)/i.test(portText(port))) return 'slider';
  return 'knob';
}

function isEqFaderBank(port, ports, hint) {
  const text = portText(port);
  if (!/gain|level|boost|cut/i.test(text)) return false;
  if (/freq|frequency|q\b|bandwidth|\bbw\b|resonance|reso/i.test(text)) return false;
  const eqGainPorts = ports.filter(other => isEqPort(other) && /gain|level|boost|cut/i.test(portText(other)));
  return eqGainPorts.length >= 3 || hint?.assets?.includes('slider') || /slider|fader/i.test(hint?.modgui?.panel ?? '');
}

function isMixerFaderBank(port, ports) {
  const text = portText(port);
  if (!/gain|level|volume|trim/i.test(text)) return false;
  const levelPorts = ports.filter(other => (
    !usesMenuControl(other)
      && !other.toggled
      && /gain|level|volume|trim/i.test(portText(other))
      && !/threshold|makeup|boost|cut/i.test(portText(other))
  ));
  return levelPorts.length >= 4;
}

function panelForSection(section, fields, hint) {
  if (section === 'drawbars') return panelDecision('drawbar-bank', 'drawbar-bank');
  if (section === 'equalizer' && fields.filter(field => field.widget === 'fader').length >= 6) {
    return panelDecision('rack-strip', 'parallel-fader-bank');
  }
  if (fields.length >= 18) return panelDecision('dense-bank', 'dense-control-bank');
  const nativeTabbed = hasNativeTabbedPanels(hint);
  const nativeGrouped = hasNativeGroupedPanels(hint);
  if (nativeGrouped && fields.length > 1) {
    const reason = nativeTabbed ? 'native-tabbed-panel' : 'native-grouped-panel';
    if (section === 'playback') return panelDecision('program-panel', reason);
    if (section === 'envelopes' || section === 'oscillators' || section === 'filter' || section === 'modulation') {
      return panelDecision('synth-panel', reason);
    }
    return panelDecision('control-panel', reason);
  }
  if (fields.length <= 2) return panelDecision('compact-panel', 'compact-few-controls');
  if (section === 'envelopes' || section === 'oscillators' || section === 'filter' || section === 'modulation') {
    return panelDecision('synth-panel', 'signal-block');
  }
  if (section === 'playback') return panelDecision('program-panel', 'program-block');
  return fields.length <= 3
    ? panelDecision('compact-panel', 'compact-few-controls')
    : panelDecision('control-panel', 'signal-block');
}

function panelDecision(type, reason) {
  return { type, reason };
}

function densityForFields(fields) {
  if (fields.length >= 24) return 'dense';
  if (fields.length >= 10) return 'medium';
  return 'open';
}

function priorityForPort(port, section, index) {
  const sectionBase = (SECTION_ORDER.get(section) ?? 99) * 1000;
  const text = portText(port);
  let roleBoost = 500;
  if (/gain|level|volume|mix|threshold|cutoff|freq|frequency/i.test(text)) roleBoost = 0;
  else if (/attack|decay|sustain|release|ratio|knee|feedback|depth|rate/i.test(text)) roleBoost = 100;
  else if (port.toggled || usesMenuControl(port)) roleBoost = 200;
  return sectionBase + roleBoost + index;
}

function unitForPort(port) {
  const text = portText(port);
  if (portUsesHz(port)) return 'Hz';
  if (/\bms\b|millisecond/i.test(text)) return 'ms';
  if (/\bbpm\b/i.test(text)) return 'bpm';
  if (/\bdb\b|gain|threshold|level|boost|cut/i.test(text)) return 'dB';
  if (/percent|%/i.test(text)) return '%';
  return null;
}

function isEqPort(port) {
  const text = portText(port);
  return /equalizer|\beq\b|band\s*\d|band\d|freq\d|gain\d|q\d|bandwidth|\bbw\b|low\s*shelf|high\s*shelf|shelf/i.test(text)
    && !/sidechain|gain\s*reduction|makeup|input|output|master/i.test(text);
}

function portId(port, index) {
  return String(port.symbol ?? port.name ?? index)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `control-${index}`;
}

function portLabel(port) {
  return String(port.name ?? port.symbol ?? 'control')
    .replace(/\s*\[[^\]]+\]\s*/g, ' ')
    .replace(/\s*\((?:dB|Hz|ms|sec|seconds?|bpm)\)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function brandFromName(name) {
  const match = String(name).match(/^(Zam|TAP|MDA|Calf|FOMP|setBfree|mda|so-|SO-|wadspa)/);
  return match ? match[1].replace(/^mda$/i, 'MDA') : null;
}

function modelText(plugin, hint) {
  return [
    plugin?.id,
    plugin?.label,
    plugin?.name,
    plugin?.description,
    plugin?.category,
    hint?.brand,
    hint?.label,
    ...(hint?.sourceKinds ?? []),
    ...(hint?.nativeUiTypes ?? []),
    ...(hint?.assets ?? []),
    ...(hint?.nativeLayouts ?? []),
  ].filter(Boolean).join(' ');
}

function portText(port) {
  return `${port?.name ?? ''} ${port?.symbol ?? ''}`;
}

function hasNativeGroupedPanels(hint) {
  return Boolean(hint?.nativeLayouts?.some(layout => layout === 'grouped-panel' || layout === 'tabbed-panel'));
}

function hasNativeTabbedPanels(hint) {
  return Boolean(hint?.nativeLayouts?.includes('tabbed-panel'));
}
