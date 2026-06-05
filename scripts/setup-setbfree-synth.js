#!/usr/bin/env node
/**
 * Setup script for the setBfree tonewheel organ instrument.
 *
 * Upstream b_synth exposes most performance controls through MIDI/atom UI
 * messages rather than LV2 ControlPorts. For the browser build we keep the
 * stock LV2 DSP wrapper, then add a small set of real ControlPorts that call
 * setBfree's own MIDI control-function layer. That gives wadspa sliders a
 * real audio contract the generic slider sweep can verify.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, 'setBfree');
const OUT = join(ROOT, 'plugins', 'setbfree');

if (!existsSync(REPO)) {
    console.error(`Source not found: ${REPO} - run fetch-sources.js first`);
    process.exit(1);
}

const controlPorts = [
    { symbol: 'upper_drawbar_16',  name: 'Upper Drawbar 16',     midi: 'upper.drawbar16',  min: 0, max: 8, def: 8, integer: true,  mode: 'drawbar' },
    { symbol: 'upper_drawbar_513', name: 'Upper Drawbar 5 1/3',  midi: 'upper.drawbar513', min: 0, max: 8, def: 8, integer: true,  mode: 'drawbar' },
    { symbol: 'upper_drawbar_8',   name: 'Upper Drawbar 8',      midi: 'upper.drawbar8',   min: 0, max: 8, def: 6, integer: true,  mode: 'drawbar' },
    { symbol: 'upper_drawbar_4',   name: 'Upper Drawbar 4',      midi: 'upper.drawbar4',   min: 0, max: 8, def: 0, integer: true,  mode: 'drawbar' },
    { symbol: 'upper_drawbar_223', name: 'Upper Drawbar 2 2/3',  midi: 'upper.drawbar223', min: 0, max: 8, def: 0, integer: true,  mode: 'drawbar' },
    { symbol: 'upper_drawbar_2',   name: 'Upper Drawbar 2',      midi: 'upper.drawbar2',   min: 0, max: 8, def: 0, integer: true,  mode: 'drawbar' },
    { symbol: 'upper_drawbar_135', name: 'Upper Drawbar 1 3/5',  midi: 'upper.drawbar135', min: 0, max: 8, def: 0, integer: true,  mode: 'drawbar' },
    { symbol: 'upper_drawbar_113', name: 'Upper Drawbar 1 1/3',  midi: 'upper.drawbar113', min: 0, max: 8, def: 0, integer: true,  mode: 'drawbar' },
    { symbol: 'upper_drawbar_1',   name: 'Upper Drawbar 1',      midi: 'upper.drawbar1',   min: 0, max: 8, def: 0, integer: true,  mode: 'drawbar' },
    { symbol: 'swell',             name: 'Swell Pedal',          midi: 'swellpedal1',      min: 0, max: 1, def: 1, logarithmic: false, mode: 'unit' },
    { symbol: 'reverb_mix',        name: 'Reverb Mix',           midi: 'reverb.mix',       min: 0, max: 1, def: 0.1, mode: 'unit' },
    { symbol: 'overdrive_enable',  name: 'Overdrive Enable',     midi: 'overdrive.enable', min: 0, max: 1, def: 1, integer: true, toggled: true, mode: 'toggle' },
    { symbol: 'overdrive_drive',   name: 'Overdrive Drive',      midi: 'overdrive.inputgain',  min: 0, max: 1, def: 0.36, mode: 'unit' },
    { symbol: 'overdrive_output',  name: 'Overdrive Output',     midi: 'overdrive.outputgain', min: 0, max: 1, def: 0.08, mode: 'unit' },
    { symbol: 'overdrive_tone',    name: 'Overdrive Tone',       midi: 'overdrive.character',  min: 0, max: 1, def: 0.53, mode: 'unit' },
];

const copyGroups = {
    'b_synth': ['lv2.c', 'uris.h', 'midnam_lv2.h'],
    'src': [
        'cfgParser.c', 'cfgParser.h',
        'defaultpgm.h',
        'global_inst.h',
        'main.h',
        'memstream.h',
        'midi.c', 'midi.h', 'midi_types.h',
        'midnam.c',
        'pgmParser.c', 'pgmParser.h',
        'program.c', 'program.h',
        'state.c', 'state.h',
        'tonegen.c', 'tonegen.h',
        'vibrato.c', 'vibrato.h',
    ],
    'b_whirl': ['eqcomp.c', 'eqcomp.h', 'whirl.c', 'whirl.h'],
    'b_overdrive': ['overdrive.c', 'overdrive.h'],
    'b_reverb': ['reverb.c', 'reverb.h'],
};

for (const [subdir, files] of Object.entries(copyGroups)) {
    mkdirSync(join(OUT, subdir), { recursive: true });
    for (const file of files) {
        copyFileSync(join(REPO, subdir, file), join(OUT, subdir, file));
    }
}

writeTtl();
patchLv2Wrapper();
writeCompat();
registerPlugin();

console.log('setBfree organ setup complete');
console.log('Run: node scripts/build-instruments.js --only setbfree');

function writeTtl() {
    const ttlControls = controlPorts.map((port, index) => ttlControlBlock(port, 4 + index)).join(' ,\n');

    let ttl = readFileSync(join(REPO, 'b_synth', 'b_synth.ttl.in'), 'utf8')
        .replace(/@VERSION@/g, '')
        .replace(/@MODBRAND@/g, '')
        .replace(/@MODLABEL@/g, '');
    ttl = ttl.replace(
        '@prefix pprop: <http://lv2plug.in/ns/ext/port-props#> .',
        '@prefix pprop: <http://lv2plug.in/ns/ext/port-props#> .'
    );
    if (!ttl.includes('@prefix pprop:')) {
        ttl = ttl.replace(
            '@prefix pg:    <http://lv2plug.in/ns/ext/port-groups#> .',
            '@prefix pg:    <http://lv2plug.in/ns/ext/port-groups#> .\n@prefix pprop: <http://lv2plug.in/ns/ext/port-props#> .'
        );
    }
    ttl = ttl.replace(/\n\t\];\n\t\n\t\n\trdfs:comment/, `\n\t] ,\n${ttlControls}\n\t;\n\t\n\t\n\trdfs:comment`);
    writeFileSync(join(OUT, 'b_synth.ttl'), ttl);

    const manifest = readFileSync(join(REPO, 'b_synth', 'manifest.ttl.in'), 'utf8')
        .replace(/@LV2NAME@/g, 'b_synth')
        .replace(/@LIB_EXT@/g, '.wasm')
        .replace(/@MODGUITTL@/g, '');
    writeFileSync(join(OUT, 'manifest.ttl'), manifest);
}

function ttlControlBlock(port, index) {
    const props = [];
    if (port.integer) props.push('pprop:integer');
    if (port.toggled) props.push('pprop:toggled');
    if (port.logarithmic) props.push('pprop:logarithmic');
    const propLine = props.length > 0 ? `\n\t\tlv2:portProperty ${props.join(' , ')} ;` : '';
    return `\t[
\t\ta lv2:InputPort, lv2:ControlPort ;
\t\tlv2:index ${index} ;
\t\tlv2:symbol "${port.symbol}" ;
\t\tlv2:name "${port.name}" ;
\t\tlv2:minimum ${port.min} ;
\t\tlv2:maximum ${port.max} ;
\t\tlv2:default ${port.def} ;${propLine}
\t]`;
}

function patchLv2Wrapper() {
    const lv2Path = join(OUT, 'b_synth', 'lv2.c');
    let src = readFileSync(lv2Path, 'utf8');

    src = src.replace(
        `#include "vibrato.h"\n`,
        `#include "vibrato.h"\n\n#ifndef VERSION\n#define VERSION "0.8.0-wasm"\n#endif\n`
    );

    src = src.replace(
        `typedef enum {
\tB3S_MIDIIN = 0,
\tB3S_MIDIOUT,
\tB3S_OUTL,
\tB3S_OUTR
} PortIndex;`,
        `typedef enum {
\tB3S_MIDIIN = 0,
\tB3S_MIDIOUT,
\tB3S_OUTL,
\tB3S_OUTR,
\tB3S_FIRST_CONTROL
} PortIndex;

#define SETBFREE_CONTROL_COUNT ${controlPorts.length}`
    );

    src = src.replace(
        `\tLV2_Atom_Sequence*       midiout;
\tfloat*                   outL;
\tfloat*                   outR;`,
        `\tLV2_Atom_Sequence*       midiout;
\tfloat*                   outL;
\tfloat*                   outR;
\tfloat*                   control_ports[SETBFREE_CONTROL_COUNT];
\tfloat                    last_controls[SETBFREE_CONTROL_COUNT];
\tshort                    controls_initialized;
\tshort                    midi_controls_dirty;`
    );

    src = src.replace(
        `\tB3S* b3s   = (B3S*)arg;
\tb3s->dirty = true;`,
        `\tB3S* b3s   = (B3S*)arg;
\tb3s->dirty = true;
\tb3s->midi_controls_dirty = 1;`
    );

    src = src.replace(
        `\tsetControlFunctionCallback (b3s->inst->midicfg, mctl_cb, b3s);
\tinitSynth (b3s->inst, rate);`,
        `\tsetControlFunctionCallback (b3s->inst->midicfg, mctl_cb, b3s);
\tinitSynth (b3s->inst, rate);
\tb3s->controls_initialized = 0;
\tb3s->midi_controls_dirty = 0;`
    );

    src = src.replace(
        `static void
connect_port (LV2_Handle instance,
              uint32_t   port,
              void*      data)
{`,
        `${controlPatchCode()}

static void
connect_port (LV2_Handle instance,
              uint32_t   port,
              void*      data)
{`
    );

    src = src.replace(
        `\tB3S* b3s = (B3S*)instance;

\tswitch ((PortIndex)port) {`,
        `\tB3S* b3s = (B3S*)instance;
\tif (port >= B3S_FIRST_CONTROL && port < B3S_FIRST_CONTROL + SETBFREE_CONTROL_COUNT) {
\t\tb3s->control_ports[port - B3S_FIRST_CONTROL] = (float*)data;
\t\treturn;
\t}

\tswitch ((PortIndex)port) {`
    );

    src = src.replace(
        `\tB3S*   b3s = (B3S*)instance;
\tfloat* audio[2];
\tb3s->dirty = false;`,
        `\tB3S*   b3s = (B3S*)instance;
\tfloat* audio[2];
\tb3s->dirty = false;
\tsetbfree_apply_control_ports (b3s, !b3s->controls_initialized || b3s->midi_controls_dirty);
\tb3s->controls_initialized = 1;
\tb3s->midi_controls_dirty = 0;`
    );

    writeFileSync(lv2Path, src);
}

function controlPatchCode() {
    const table = controlPorts.map(port =>
        `\t{ "${port.midi}", ${floatLiteral(port.def)}, ${modeEnum(port.mode)} }`
    ).join(',\n');

    return `typedef enum {
\tSETBFREE_CTRL_DRAWBAR = 0,
\tSETBFREE_CTRL_UNIT,
\tSETBFREE_CTRL_TOGGLE
} SetBfreeControlMode;

typedef struct {
\tconst char* midi_name;
\tfloat       default_value;
\tSetBfreeControlMode mode;
} SetBfreeControl;

static const SetBfreeControl setbfree_controls[SETBFREE_CONTROL_COUNT] = {
${table}
};

static unsigned char
setbfree_control_to_midi (float value, SetBfreeControlMode mode)
{
\tif (!isfinite (value)) {
\t\tvalue = 0.0f;
\t}
\tif (mode == SETBFREE_CTRL_DRAWBAR) {
\t\tif (value < 0.0f) value = 0.0f;
\t\tif (value > 8.0f) value = 8.0f;
\t\treturn (unsigned char)lrintf (((8.0f - value) * 127.0f) / 8.0f);
\t}
\tif (mode == SETBFREE_CTRL_TOGGLE) {
\t\treturn value >= 0.5f ? 127 : 0;
\t}
\tif (value < 0.0f) value = 0.0f;
\tif (value > 1.0f) value = 1.0f;
\treturn (unsigned char)lrintf (value * 127.0f);
}

static void
setbfree_apply_control_ports (B3S* b3s, int force)
{
\tif (!b3s || !b3s->inst || !b3s->inst->midicfg) {
\t\treturn;
\t}
\tfor (int i = 0; i < SETBFREE_CONTROL_COUNT; ++i) {
\t\tfloat value = b3s->control_ports[i] ? *b3s->control_ports[i] : setbfree_controls[i].default_value;
\t\tif (force || fabsf (value - b3s->last_controls[i]) > 0.0001f) {
\t\t\tcallMIDIControlFunction (
\t\t\t    b3s->inst->midicfg,
\t\t\t    setbfree_controls[i].midi_name,
\t\t\t    setbfree_control_to_midi (value, setbfree_controls[i].mode));
\t\t\tb3s->last_controls[i] = value;
\t\t\tb3s->dirty = true;
\t\t}
\t}
}`;
}

function modeEnum(mode) {
    if (mode === 'drawbar') return 'SETBFREE_CTRL_DRAWBAR';
    if (mode === 'toggle') return 'SETBFREE_CTRL_TOGGLE';
    return 'SETBFREE_CTRL_UNIT';
}

function floatLiteral(value) {
    const text = Number(value).toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    return `${text.includes('.') ? text : `${text}.0`}f`;
}

function writeCompat() {
    writeFileSync(join(OUT, 'wadspa_worker_compat.c'), `#include "lv2.h"

void wadspa_register_plugin_lv2(LV2_Handle handle)
{
    (void)handle;
}
`);
}

function registerPlugin() {
    const entry = {
        id: 'setbfree',
        description: 'setBfree - MIDI-controlled Hammond B3 tonewheel organ instrument',
        category: 'Instruments',
        sources: [
            'b_synth/lv2.c',
            'src/midi.c',
            'src/cfgParser.c',
            'src/program.c',
            'src/vibrato.c',
            'src/state.c',
            'src/tonegen.c',
            'src/pgmParser.c',
            'src/midnam.c',
            'b_whirl/eqcomp.c',
            'b_whirl/whirl.c',
            'b_overdrive/overdrive.c',
            'b_reverb/reverb.c',
            'wadspa_worker_compat.c',
        ],
        includes: [
            'plugins/setbfree/b_synth',
            'plugins/setbfree/src',
            'plugins/setbfree/b_whirl',
            'plugins/setbfree/b_overdrive',
            'plugins/setbfree/b_reverb',
        ],
        defines: [
            'HAVE_LV2_1_18_6',
            'LV2SYNTH',
        ],
        extraFeatures: ['worker'],
    };

    const registry = readLv2Registry(ROOT);
    const existing = registry.findIndex(item => item.id === 'setbfree');
    if (existing >= 0) registry[existing] = entry;
    else registry.push(entry);
    writeLv2Registry(ROOT, registry);
}
