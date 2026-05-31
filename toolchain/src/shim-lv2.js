/**
 * LV2 shim generator for wadspa.
 *
 * Generates a C shim that:
 *  - Implements a minimal LV2 host (URID map, atom sequence for MIDI)
 *  - Exposes shim_init, shim_run, shim_midi_*, shim_set_*, shim_input_buf_*, shim_output_buf_*
 *
 * The descriptor is produced by parseLv2Ttl() from the plugin's .ttl file,
 * since LV2 port metadata lives in Turtle RDF, not in the compiled binary.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// ──────────────────────────────────────────────────────────────────────────
// TTL port extractor
// A lightweight regex-based parser for the common LV2 port declaration pattern.
// Handles the subset used by the instruments we target (not a full Turtle parser).
// ──────────────────────────────────────────────────────────────────────────

export function parseLv2Ttl(pluginDir) {
    // Find the manifest.ttl, then follow it to the plugin .ttl
    const manifestPath = join(pluginDir, 'manifest.ttl');
    const manifestSrc  = readFileSync(manifestPath, 'utf8');

    // Build prefix map (@prefix short: <uri> .)
    const prefixes = {};
    const prefixRe = /@prefix\s+(\w+):\s+<([^>]+)>/g;
    let pm;
    while ((pm = prefixRe.exec(manifestSrc)) !== null) prefixes[pm[1]] = pm[2];

    // Extract plugin URI — angle-bracket form first, then prefixed form (e.g. mda:DX10)
    const pluginMatch = manifestSrc.match(/<([^>]+)>\s+a\s+lv2:Plugin/);
    const ttlMatch    = manifestSrc.match(/rdfs:seeAlso\s+<([^>]+\.ttl)>/);
    if (!ttlMatch) throw new Error('Could not find rdfs:seeAlso TTL reference in manifest.ttl');

    let pluginUri;
    if (pluginMatch) {
        pluginUri = pluginMatch[1];
    } else {
        const pfxMatch = manifestSrc.match(/(\w+):(\S+)\s+a\s+lv2:Plugin/);
        if (pfxMatch && prefixes[pfxMatch[1]]) {
            pluginUri = prefixes[pfxMatch[1]] + pfxMatch[2];
        } else {
            throw new Error('Could not parse plugin URI from manifest.ttl');
        }
    }
    const ttlPath   = join(pluginDir, ttlMatch[1]);
    const ttlSrc    = readFileSync(ttlPath, 'utf8');

    // Some bundle files also describe the overall project before the plugin.
    // Prefer the last doap:name so the plugin name wins over the project name.
    const labelMatches = [...ttlSrc.matchAll(/doap:name\s+"([^"]+)"/g)];
    const label        = labelMatches.length > 0
        ? labelMatches[labelMatches.length - 1][1]
        : pluginUri.split('/').pop();

    // Extract ports — match ALL [...] blocks in the file; parsePortBlock
    // returns null for blocks that don't contain lv2:index, so non-port
    // blocks are safely ignored. This handles the `lv2:port [...] , [...]`
    // multi-port Turtle syntax where only the first block follows lv2:port.
    const ports = [];
    const portBlockRe = /\[([^\]]+)\]/gs;
    let portMatch;
    while ((portMatch = portBlockRe.exec(ttlSrc)) !== null) {
        const block = portMatch[1];
        const port  = parsePortBlock(block);
        if (port) ports.push(port);
    }

    ports.sort((a, b) => a.index - b.index);

    return { uri: pluginUri, label, ports };
}

function parsePortBlock(block) {
    const indexMatch = block.match(/lv2:index\s+(\d+)/);
    if (!indexMatch) return null;

    const index  = parseInt(indexMatch[1], 10);
    const symbol = (block.match(/lv2:symbol\s+"([^"]+)"/) || [])[1] || `port_${index}`;
    const name   = (block.match(/lv2:name\s+"([^"]+)"/)   || [])[1] || symbol;

    // Direction
    const isInput  = /\ba\s+lv2:InputPort\b/.test(block)  || /lv2:InputPort\b/.test(block);
    const isOutput = /\ba\s+lv2:OutputPort\b/.test(block) || /lv2:OutputPort\b/.test(block);
    const dir      = isOutput ? 'output' : 'input';

    // Type
    const isMidi    = /atom:supports\s+midi:MidiEvent/.test(block) || /midi:MidiEvent/.test(block)
                   || /atom:supports\s+<[^>]*MidiEvent>/.test(block);
    const isAudio   = /\ba\s+lv2:AudioPort\b/.test(block) || /lv2:AudioPort\b/.test(block);
    const isControl = /\ba\s+lv2:ControlPort\b/.test(block) || /lv2:ControlPort\b/.test(block);
    const isAtom    = /\ba\s+atom:AtomPort\b/.test(block)  || /atom:AtomPort\b/.test(block);

    let type = 'control';
    if (isAudio) type = 'audio';
    if (isMidi || isAtom) type = isInput && isMidi ? 'midi' : 'atom';

    // Control range
    const min = parseFloat((block.match(/lv2:minimum\s+([\d.eE+\-]+)/) || [])[1]);
    const max = parseFloat((block.match(/lv2:maximum\s+([\d.eE+\-]+)/) || [])[1]);
    const def = parseFloat((block.match(/lv2:default\s+([\d.eE+\-]+)/)  || [])[1]);

    return {
        index, symbol, name, dir, type,
        min:  isNaN(min) ? null : min,
        max:  isNaN(max) ? null : max,
        default: isNaN(def) ? null : def,
    };
}

// ──────────────────────────────────────────────────────────────────────────
// Shim generator
// ──────────────────────────────────────────────────────────────────────────

function floatLit(n) {
    if (n == null) return '0.0f';
    const s = String(Number(n));
    return (s.includes('.') || s.includes('e')) ? s + 'f' : s + '.0f';
}

export function generateLv2Shim(descriptor) {
    const { ports } = descriptor;

    const audioIn   = ports.filter(p => p.type === 'audio'   && p.dir === 'input');
    const audioOut  = ports.filter(p => p.type === 'audio'   && p.dir === 'output');
    const ctrlIn    = ports.filter(p => p.type === 'control' && p.dir === 'input');
    const ctrlOut   = ports.filter(p => p.type === 'control' && p.dir === 'output');
    const midiIn    = ports.filter(p => p.type === 'midi'    && p.dir === 'input');
    const atomOut   = ports.filter(p => p.type === 'atom'    && p.dir === 'output');

    const lines = [];
    lines.push('#include <stdlib.h>');
    lines.push('#include <stdint.h>');
    lines.push('#include <string.h>');
    lines.push('#include "lv2.h"');
    lines.push('#include "lv2/atom/atom.h"');
    lines.push('#include "lv2/urid/urid.h"');
    lines.push('#include "lv2/midi/midi.h"');
    lines.push('#include <emscripten.h>');
    lines.push('');
    lines.push('#define BLOCK_SIZE   128');
    lines.push('#define MIDI_BUF_SIZE 4096');
    lines.push('');

    // URID map
    lines.push('/* Minimal URID map — sequential integer IDs for URI strings */');
    lines.push('static char *g_urid_uris[512];');
    lines.push('static uint32_t g_urid_count = 0;');
    lines.push('');
    lines.push('static LV2_URID urid_map_fn(LV2_URID_Map_Handle h, const char *uri) {');
    lines.push('    for (uint32_t i = 0; i < g_urid_count; i++)');
    lines.push('        if (strcmp(g_urid_uris[i], uri) == 0) return i + 1;');
    lines.push('    g_urid_uris[g_urid_count] = strdup(uri);');
    lines.push('    return ++g_urid_count;');
    lines.push('}');
    lines.push('');
    lines.push('static LV2_URID_Map   g_map_iface   = { NULL, urid_map_fn };');
    lines.push('static LV2_Feature    g_map_feature  = { LV2_URID__map, &g_map_iface };');
    lines.push('static const LV2_Feature *g_features[] = { &g_map_feature, NULL };');
    lines.push('');

    // Audio buffers
    for (const p of audioIn)  lines.push(`static float g_in_${p.symbol}[BLOCK_SIZE];`);
    for (const p of audioOut) lines.push(`static float g_out_${p.symbol}[BLOCK_SIZE];`);

    // Control scalars
    for (const p of ctrlIn)  lines.push(`static float g_ctrl_${p.symbol} = ${floatLit(p.default)};`);
    for (const p of ctrlOut) lines.push(`static float g_ctrl_${p.symbol} = 0.0f;`);

    // Output atom buffers (notify ports, etc.) — plugin writes into these
    for (const p of atomOut) lines.push(`static uint8_t g_atom_out_${p.symbol}[MIDI_BUF_SIZE];`);

    // MIDI atom buffer
    if (midiIn.length > 0) {
        lines.push('');
        lines.push('static uint8_t g_midi_buf[MIDI_BUF_SIZE];');
        lines.push('static LV2_Atom_Sequence *g_midi_seq = (LV2_Atom_Sequence *)g_midi_buf;');
        lines.push('static LV2_URID g_urid_midi_event;');
        lines.push('static LV2_URID g_urid_atom_chunk;');
        lines.push('static LV2_URID g_urid_atom_sequence;');
    }

    // Plugin handle
    lines.push('');
    lines.push('static const LV2_Descriptor *g_desc   = NULL;');
    lines.push('static LV2_Handle            g_handle = NULL;');
    lines.push('');

    // Forward declaration so shim_init can call shim_midi_clear before it is defined
    if (midiIn.length > 0) {
        lines.push('void shim_midi_clear(void);');
        lines.push('');
    }

    // shim_init
    lines.push('EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {');
    lines.push('    g_desc   = lv2_descriptor(0);');
    lines.push('    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);');

    if (midiIn.length > 0) {
        lines.push('    g_urid_midi_event   = urid_map_fn(NULL, LV2_MIDI__MidiEvent);');
        lines.push('    g_urid_atom_chunk   = urid_map_fn(NULL, LV2_ATOM__Chunk);');
        lines.push('    g_urid_atom_sequence = urid_map_fn(NULL, LV2_ATOM__Sequence);');
    }

    for (const p of ports) {
        const sym = p.symbol;
        if (p.type === 'audio' && p.dir === 'input')    lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_in_${sym});`);
        if (p.type === 'audio' && p.dir === 'output')   lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_out_${sym});`);
        if (p.type === 'control')                         lines.push(`    g_desc->connect_port(g_handle, ${p.index}, &g_ctrl_${sym});`);
        if (p.type === 'midi' && p.dir === 'input')      lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_midi_seq);`);
        if (p.type === 'atom' && p.dir === 'output')      lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_atom_out_${p.symbol});`);
    }

    lines.push('    if (g_desc->activate) g_desc->activate(g_handle);');
    if (midiIn.length > 0) lines.push('    shim_midi_clear();');
    lines.push('}');
    lines.push('');

    // MIDI helpers
    if (midiIn.length > 0) {
        lines.push('EMSCRIPTEN_KEEPALIVE void shim_midi_clear() {');
        lines.push('    g_midi_seq->atom.type = g_urid_atom_sequence;');
        lines.push('    g_midi_seq->atom.size = sizeof(LV2_Atom_Sequence_Body);');
        lines.push('    g_midi_seq->body.unit = 0;');
        lines.push('    g_midi_seq->body.pad  = 0;');
        lines.push('}');
        lines.push('');
        lines.push('static void push_midi(const uint8_t *data, uint32_t size) {');
        lines.push('    uint32_t body_off = g_midi_seq->atom.size - sizeof(LV2_Atom_Sequence_Body);');
        lines.push('    uint8_t *end = (uint8_t *)(g_midi_seq + 1) + body_off;');
        lines.push('    uint32_t event_total = sizeof(LV2_Atom_Event) + size;');
        lines.push('    uint32_t padded = (event_total + 7u) & ~7u;');
        lines.push('    if (end + padded > g_midi_buf + MIDI_BUF_SIZE) return;');
        lines.push('    LV2_Atom_Event *ev = (LV2_Atom_Event *)end;');
        lines.push('    ev->time.frames = 0;');
        lines.push('    ev->body.type   = g_urid_midi_event;');
        lines.push('    ev->body.size   = size;');
        lines.push('    memcpy(ev + 1, data, size);');
        lines.push('    g_midi_seq->atom.size += padded;');
        lines.push('}');
        lines.push('');
        lines.push('EMSCRIPTEN_KEEPALIVE void shim_midi_note_on(uint8_t ch, uint8_t note, uint8_t vel)');
        lines.push('    { uint8_t m[3] = {(uint8_t)(0x90|ch), note, vel}; push_midi(m, 3); }');
        lines.push('');
        lines.push('EMSCRIPTEN_KEEPALIVE void shim_midi_note_off(uint8_t ch, uint8_t note)');
        lines.push('    { uint8_t m[3] = {(uint8_t)(0x80|ch), note, 0}; push_midi(m, 3); }');
        lines.push('');
        lines.push('EMSCRIPTEN_KEEPALIVE void shim_midi_cc(uint8_t ch, uint8_t cc, uint8_t val)');
        lines.push('    { uint8_t m[3] = {(uint8_t)(0xB0|ch), cc, val}; push_midi(m, 3); }');
        lines.push('');
        lines.push('EMSCRIPTEN_KEEPALIVE void shim_midi_pitch_bend(uint8_t ch, int16_t bend) {');
        lines.push('    uint16_t u = (uint16_t)(bend + 8192);');
        lines.push('    uint8_t m[3] = {(uint8_t)(0xE0|ch), (uint8_t)(u & 0x7F), (uint8_t)(u >> 7)};');
        lines.push('    push_midi(m, 3);');
        lines.push('}');
        lines.push('');
    }

    // Audio buffer accessors
    for (const p of audioIn)  lines.push(`EMSCRIPTEN_KEEPALIVE float *shim_input_buf_${p.symbol}()  { return g_in_${p.symbol}; }`);
    for (const p of audioOut) lines.push(`EMSCRIPTEN_KEEPALIVE float *shim_output_buf_${p.symbol}() { return g_out_${p.symbol}; }`);

    // Control setters/getters
    for (const p of ctrlIn) {
        lines.push(`EMSCRIPTEN_KEEPALIVE void  shim_set_${p.symbol}(float v) { g_ctrl_${p.symbol} = v; }`);
        lines.push(`EMSCRIPTEN_KEEPALIVE float shim_get_${p.symbol}()        { return g_ctrl_${p.symbol}; }`);
    }

    // shim_run
    lines.push('');
    lines.push('EMSCRIPTEN_KEEPALIVE void shim_run(unsigned long count) {');
    lines.push('    g_desc->run(g_handle, count);');
    if (midiIn.length > 0) lines.push('    shim_midi_clear();');
    lines.push('}');
    lines.push('');

    return lines.join('\n');
}

// Exported function list for emcc's EXPORTED_FUNCTIONS flag
export function lv2ExportedFunctions(descriptor) {
    const { ports } = descriptor;
    const fns = ['_shim_init', '_shim_run'];

    for (const p of ports.filter(p => p.type === 'audio' && p.dir === 'input'))
        fns.push(`_shim_input_buf_${p.symbol}`);
    for (const p of ports.filter(p => p.type === 'audio' && p.dir === 'output'))
        fns.push(`_shim_output_buf_${p.symbol}`);
    for (const p of ports.filter(p => p.type === 'control' && p.dir === 'input')) {
        fns.push(`_shim_set_${p.symbol}`, `_shim_get_${p.symbol}`);
    }

    if (ports.some(p => p.type === 'midi' && p.dir === 'input')) {
        fns.push('_shim_midi_clear', '_shim_midi_note_on', '_shim_midi_note_off',
                 '_shim_midi_cc', '_shim_midi_pitch_bend');
    }

    return fns;
}

// Processor.js for LV2 instruments — adds MIDI message handling
export function generateLv2Processor(descriptor, label) {
    const { ports } = descriptor;
    const audioIn   = ports.filter(p => p.type === 'audio' && p.dir === 'input');
    const audioOut  = ports.filter(p => p.type === 'audio' && p.dir === 'output');
    const ctrlIn    = ports.filter(p => p.type === 'control' && p.dir === 'input');
    const hasMidi   = ports.some(p => p.type === 'midi' && p.dir === 'input');

    const exportName = 'create' + label.replace(/[^a-zA-Z0-9]/g, '_') + 'Plugin';

    const inBufs   = audioIn.map(p  => `_shim_input_buf_${p.symbol}`);
    const outBufs  = audioOut.map(p => `_shim_output_buf_${p.symbol}`);
    const setterMap = Object.fromEntries(ctrlIn.map(p => [p.symbol, `_shim_set_${p.symbol}`]));

    const stereoOut = audioOut.length === 2;
    const stereoIn  = stereoOut && audioIn.length === 2;

    let inputCopies, outputCopies;
    if (stereoIn) {
        inputCopies = [
            `        const _cL = inputs[0]?.[0]; if (_cL && _cL.length) mod.HEAPF32.set(_cL, inPtrs[0]);`,
            `        const _cR = inputs[0]?.[1]; if (_cR && _cR.length) mod.HEAPF32.set(_cR, inPtrs[1]);`,
        ].join('\n');
    } else if (stereoOut) {
        inputCopies = audioIn.length > 0
            ? `        const _c0 = inputs[0]?.[0]; if (_c0 && _c0.length) mod.HEAPF32.set(_c0, inPtrs[0]);`
            : '';
    } else {
        inputCopies = audioIn.map((_, i) =>
            `        const _c${i} = inputs[${i}]?.[0]; if (_c${i} && _c${i}.length) mod.HEAPF32.set(_c${i}, inPtrs[${i}]);`
        ).join('\n');
    }

    if (stereoOut) {
        // Two separate mono outputs, merged into stereo by core.js via ChannelMergerNode.
        // Avoids outputChannelCount:[2] which Safari does not reliably honour.
        outputCopies = [
            `        outputs[0][0].set(mod.HEAPF32.subarray(outPtrs[0], outPtrs[0] + 128));`,
            `        outputs[1][0].set(mod.HEAPF32.subarray(outPtrs[1], outPtrs[1] + 128));`,
        ].join('\n');
    } else {
        outputCopies = audioOut.map((_, i) =>
            `        outputs[${i}][0].set(mod.HEAPF32.subarray(outPtrs[${i}], outPtrs[${i}] + 128));`
        ).join('\n');
    }

    const midiHandler = hasMidi ? `
            } else if (data.type === 'midi') {
                if (!mod) return;
                const { status, data1, data2 } = data;
                const type = status & 0xF0;
                const ch   = status & 0x0F;
                if      (type === 0x90 && data2 > 0) mod._shim_midi_note_on(ch, data1, data2);
                else if (type === 0x80 || (type === 0x90 && data2 === 0)) mod._shim_midi_note_off(ch, data1);
                else if (type === 0xB0) mod._shim_midi_cc(ch, data1, data2);
                else if (type === 0xE0) mod._shim_midi_pitch_bend(ch, ((data2 << 7) | data1) - 8192);` : '';

    return `import ${exportName} from './${label}.js';

let mod = null;
const inPtrs  = [${inBufs.map(() => '0').join(', ')}];
const outPtrs = [${outBufs.map(() => '0').join(', ')}];
const SETTERS = ${JSON.stringify(setterMap)};

class WadspProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = async ({ data }) => {
            if (data.type === 'setup') {
                try {
                    mod = await ${exportName}({ wasmBinary: data.wasm, locateFile: (p, d) => d + p });
                    mod._shim_init(sampleRate);
                    ${inBufs.map((fn, i)  => `inPtrs[${i}]  = mod.${fn}() >> 2;`).join('\n                    ')}
                    ${outBufs.map((fn, i) => `outPtrs[${i}] = mod.${fn}() >> 2;`).join('\n                    ')}
                    this.port.postMessage({ type: 'ready' });
                } catch (e) {
                    this.port.postMessage({ type: 'error', message: e.message });
                }${midiHandler}
            } else if (data.type === 'set') {
                if (mod) { const fn = SETTERS[data.symbol]; if (fn) mod[fn](data.value); }
            }
        };
    }

    process(inputs, outputs) {
        if (!mod) return true;
${inputCopies}
        mod._shim_run(128);
${outputCopies}
        return true;
    }
}

registerProcessor('wadspa-${label}', WadspProcessor);
`;
}
