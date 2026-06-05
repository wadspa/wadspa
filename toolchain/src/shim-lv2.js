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
    function extractPortsFromSrc(src) {
        for (const block of bracketBlocks(stripTtlLineComments(src))) {
            const port  = parsePortBlock(block);
            if (port) ports.push(port);
        }
    }
    extractPortsFromSrc(ttlSrc);

    // If the primary TTL has no audio ports, scan other .ttl files.
    // Some plugins (e.g. fil4) split port definitions across multiple TTL files that
    // are designed to be concatenated — the common ports file ends with an open bracket
    // that the variant file continues. Parse them as a single concatenated document.
    const hasAudio = ports.some(p => p.type === 'audio');
    if (!hasAudio) {
        const extraFiles = readdirSync(pluginDir)
            .filter(f => f.endsWith('.ttl') && f !== 'manifest.ttl' && join(pluginDir, f) !== ttlPath)
            .sort();
        const combined = extraFiles.map(f => {
            try { return readFileSync(join(pluginDir, f), 'utf8'); } catch { return ''; }
        }).join('\n');
        extractPortsFromSrc(combined);
    }

    ports.sort((a, b) => a.index - b.index);

    // Deduplicate by index — when multiple TTL variants define the same port index
    // (e.g. fil4 has separate mono.ttl and stereo.ttl), keep only the first occurrence.
    const seen = new Set();
    const uniquePorts = ports.filter(p => {
        if (seen.has(p.index)) return false;
        seen.add(p.index);
        return true;
    });

    return { uri: pluginUri, label, ports: uniquePorts };
}

function bracketBlocks(src) {
    const blocks = [];
    let depth = 0;
    let start = -1;
    let quote = null;
    let escaped = false;

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];

        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (ch === '\\') {
                escaped = true;
            } else if (ch === quote) {
                quote = null;
            }
            continue;
        }

        if (ch === '"' || ch === "'") {
            quote = ch;
            continue;
        }

        if (ch === '[') {
            if (depth === 0) start = i + 1;
            depth++;
        } else if (ch === ']' && depth > 0) {
            depth--;
            if (depth === 0 && start >= 0) {
                blocks.push(src.slice(start, i));
                start = -1;
            }
        }
    }

    return blocks;
}

function stripTtlLineComments(src) {
    let out = '';
    let quote = null;
    let inIri = false;
    let escaped = false;

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];

        if (quote) {
            out += ch;
            if (escaped) {
                escaped = false;
            } else if (ch === '\\') {
                escaped = true;
            } else if (ch === quote) {
                quote = null;
            }
            continue;
        }

        if (inIri) {
            out += ch;
            if (ch === '>') inIri = false;
            continue;
        }

        if (ch === '"' || ch === "'") {
            quote = ch;
            out += ch;
            continue;
        }

        if (ch === '<') {
            inIri = true;
            out += ch;
            continue;
        }

        if (ch === '#') {
            while (i < src.length && src[i] !== '\n') i++;
            if (i < src.length) out += src[i];
            continue;
        }

        out += ch;
    }

    return out;
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
    const isCv      = /\ba\s+lv2:CVPort\b/.test(block) || /lv2:CVPort\b/.test(block);
    const isAtom    = /\ba\s+atom:AtomPort\b/.test(block)  || /atom:AtomPort\b/.test(block);
    // Old LV2 event port API (pre-atom, used by plugins from ~2008-2013)
    const isLegacyEvent = /\ba\s+ev:EventPort\b/.test(block) || /ev:EventPort\b/.test(block)
                       || /\ba\s+<[^>]*EventPort>/.test(block);
    const isLegacyMidi  = isLegacyEvent && (
        /ev:supportsEvent\s+<[^>]*MidiEvent>/.test(block) ||
        /ev:supportsEvent\s+midi:MidiEvent/.test(block) ||
        isLegacyEvent // event ports are almost always MIDI in practice
    );

    let type = 'control';
    if (isAudio) type = 'audio';
    if (isMidi || isAtom) type = isInput && isMidi ? 'midi' : 'atom';
    if (isLegacyMidi && isInput) type = 'midi';   // treat as midi, flagged legacy below

    // Control range
    const min = parseFloat((block.match(/lv2:minimum\s+([\d.eE+\-]+)/) || [])[1]);
    const max = parseFloat((block.match(/lv2:maximum\s+([\d.eE+\-]+)/) || [])[1]);
    const def = parseFloat((block.match(/lv2:default\s+([\d.eE+\-]+)/)  || [])[1]);
    const sampleRate = hasPortProperty(block, 'sampleRate') || /\blv2:sampleRate\b/.test(block);
    const integer = hasPortProperty(block, 'integer') || /\blv2:integer\b/.test(block);
    const enumeration = hasPortProperty(block, 'enumeration') || /\blv2:enumeration\b/.test(block);
    const toggled = hasPortProperty(block, 'toggled') || /\blv2:toggled\b/.test(block);
    const logarithmic = hasPortProperty(block, 'logarithmic');
    const scalePoints = parseScalePoints(block);
    const scaleValues = scalePoints
        .map(point => point.value)
        .filter(Number.isFinite);
    const resolvedMin = isNaN(min) && scaleValues.length > 0 ? Math.min(...scaleValues) : min;
    const resolvedMax = isNaN(max) && scaleValues.length > 0 ? Math.max(...scaleValues) : max;

    return {
        index, symbol, name, dir, type,
        legacy: isLegacyEvent,   // true → old LV2 event API (not atom)
        cv: isCv,
        min:  isNaN(resolvedMin) ? null : resolvedMin,
        max:  isNaN(resolvedMax) ? null : resolvedMax,
        default: isNaN(def) ? null : def,
        ...(sampleRate && { sampleRate: true }),
        ...(integer && { integer: true }),
        ...(enumeration && { enumeration: true }),
        ...(toggled && { toggled: true }),
        ...(logarithmic && { logarithmic: true }),
        ...(scalePoints.length > 0 && { scalePoints }),
    };
}

function hasPortProperty(block, name) {
    return new RegExp(`(?:pprop:|pprops:|port-props#)${name}\\b`).test(block);
}

function parseScalePoints(block) {
    const points = [];
    const scalePointRe = /lv2:scalePoint\s+\[([\s\S]*?)\]\s*;?/g;
    let match;
    while ((match = scalePointRe.exec(block)) !== null) {
        const point = match[1];
        const valueMatch = point.match(/rdf:value\s+([\d.eE+\-]+)/);
        if (!valueMatch) continue;
        const value = parseFloat(valueMatch[1]);
        if (isNaN(value)) continue;
        const quotedLabel = point.match(/rdfs:label\s+"([^"]*)"/);
        const bareLabel = point.match(/rdfs:label\s+([^;\]]+)/);
        const label = (quotedLabel?.[1] ?? bareLabel?.[1] ?? String(value)).trim();
        points.push({ label, value });
    }
    return points.sort((a, b) => a.value - b.value);
}

// ──────────────────────────────────────────────────────────────────────────
// Shim generator
// ──────────────────────────────────────────────────────────────────────────

function floatLit(n) {
    if (n == null) return '0.0f';
    const s = String(Number(n));
    return (s.includes('.') || s.includes('e')) ? s + 'f' : s + '.0f';
}

export function generateLv2Shim(descriptor, extraExports = [], extraFeatures = []) {
    const { ports } = descriptor;

    const audioIn   = ports.filter(p => p.type === 'audio'   && p.dir === 'input');
    const audioOut  = ports.filter(p => p.type === 'audio'   && p.dir === 'output');
    const ctrlIn    = ports.filter(p => p.type === 'control' && p.dir === 'input');
    const ctrlOut   = ports.filter(p => p.type === 'control' && p.dir === 'output');
    const cvIn      = ctrlIn.filter(p => p.cv);
    const midiIn    = ports.filter(p => p.type === 'midi'    && p.dir === 'input');
    const atomIn    = ports.filter(p => p.type === 'atom'    && p.dir === 'input');
    const atomOut   = ports.filter(p => p.type === 'atom'    && p.dir === 'output');

    const usesLegacyMidi = midiIn.some(p => p.legacy);

    const lines = [];
    lines.push('#include <stdlib.h>');
    lines.push('#include <stdint.h>');
    lines.push('#include <string.h>');
    lines.push('#include "lv2.h"');
    if (!usesLegacyMidi) {
        lines.push('#include "lv2/atom/atom.h"');
        lines.push('#include "lv2/urid/urid.h"');
        lines.push('#include "lv2/midi/midi.h"');
    } else {
        // Old LV2 event API requires different headers
        lines.push('#include "lv2/urid/urid.h"');
        lines.push('#include "lv2/midi/midi.h"');
        lines.push('#pragma GCC diagnostic push');
        lines.push('#pragma GCC diagnostic ignored "-Wdeprecated-declarations"');
        lines.push('#include "lv2/lv2plug.in/ns/ext/event/event.h"');
        lines.push('#include "lv2/lv2plug.in/ns/ext/event/event-helpers.h"');
        lines.push('#include "lv2/lv2plug.in/ns/ext/uri-map/uri-map.h"');
        lines.push('#pragma GCC diagnostic pop');
    }
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
    lines.push('');
    // Options feature — required by DPF-based plugins (ZAM, etc.)
    // Inlined definitions avoid header-path fragility across plugin bundles.
    lines.push('#ifndef LV2_OPTIONS_H');
    lines.push('#define LV2_OPTIONS_H');
    lines.push('typedef enum { LV2_OPTIONS_INSTANCE=0,LV2_OPTIONS_RESOURCE,LV2_OPTIONS_BLANK,LV2_OPTIONS_PORT } LV2_Options_Context;');
    lines.push('typedef struct { LV2_Options_Context context; uint32_t subject; LV2_URID key; uint32_t size; LV2_URID type; const void *value; } LV2_Options_Option;');
    lines.push('#endif');
    lines.push('#ifndef LV2_OPTIONS__options');
    lines.push('#define LV2_OPTIONS__options "http://lv2plug.in/ns/ext/options#options"');
    lines.push('#endif');
    lines.push('#ifndef LV2_BUF_SIZE__nominalBlockLength');
    lines.push('#define LV2_BUF_SIZE__nominalBlockLength "http://lv2plug.in/ns/ext/buf-size#nominalBlockLength"');
    lines.push('#endif');
    lines.push('#ifndef LV2_BUF_SIZE__maxBlockLength');
    lines.push('#define LV2_BUF_SIZE__maxBlockLength "http://lv2plug.in/ns/ext/buf-size#maxBlockLength"');
    lines.push('#endif');
    lines.push('static LV2_URID g_opt_urid_nom;');
    lines.push('static LV2_URID g_opt_urid_max;');
    lines.push('static LV2_URID g_opt_urid_int;');
    lines.push('static int32_t  g_opt_block_size = BLOCK_SIZE;');
    lines.push('static LV2_Options_Option g_options[3];');
    lines.push('static LV2_Feature g_opt_feature = { LV2_OPTIONS__options, g_options };');
    if (usesLegacyMidi) {
        // Old uri-map feature: same map, extra "map context" argument ignored
        lines.push('#pragma GCC diagnostic push');
        lines.push('#pragma GCC diagnostic ignored "-Wdeprecated-declarations"');
        lines.push('static uint32_t old_uri_to_id(LV2_URI_Map_Callback_Data h, const char *m, const char *uri)');
        lines.push('    { (void)h; (void)m; return urid_map_fn(NULL, uri); }');
        lines.push('static LV2_URI_Map_Feature g_uri_map_data = { NULL, old_uri_to_id };');
        lines.push('static LV2_Feature g_uri_map_feature = { LV2_URI_MAP_URI, &g_uri_map_data };');
        lines.push('static uint32_t noop_evt_rc(LV2_Event_Callback_Data h, LV2_Event *ev) { (void)h; (void)ev; return 1; }');
        lines.push('static LV2_Event_Feature g_evt_feature_data = { NULL, noop_evt_rc, noop_evt_rc };');
        lines.push('static LV2_Feature g_evt_feature = { "http://lv2plug.in/ns/ext/event", &g_evt_feature_data };');
        lines.push('#pragma GCC diagnostic pop');
        lines.push('static const LV2_Feature *g_features[] = { &g_map_feature, &g_opt_feature, &g_uri_map_feature, &g_evt_feature, NULL };');
    } else if (extraFeatures.includes('worker')) {
        // Some DPF plugins (WANT_STATE=1) require LV2_Worker_Schedule.
        // Inline the minimal worker types (no lv2/worker.h needed in sysroot).
        lines.push('/* Inlined LV2 Worker types */');
        lines.push('#define LV2_WORKER__schedule "http://lv2plug.in/ns/ext/worker#schedule"');
        lines.push('typedef enum { LV2_WORKER_SUCCESS=0, LV2_WORKER_ERR_UNKNOWN=1 } LV2_Worker_Status;');
        lines.push('typedef void* LV2_Worker_Schedule_Handle;');
        lines.push('typedef LV2_Worker_Status (*LV2_Worker_Schedule_Func)(LV2_Worker_Schedule_Handle, uint32_t, const void*);');
        lines.push('typedef struct { LV2_Worker_Schedule_Handle handle; LV2_Worker_Schedule_Func schedule_work; } LV2_Worker_Schedule;');
        lines.push('static LV2_Worker_Status noop_worker_schedule(LV2_Worker_Schedule_Handle h, uint32_t sz, const void *d)');
        lines.push('    { (void)h; (void)sz; (void)d; return LV2_WORKER_SUCCESS; }');
        lines.push('static LV2_Worker_Schedule g_worker_sched = { NULL, noop_worker_schedule };');
        lines.push('static LV2_Feature g_worker_feature = { LV2_WORKER__schedule, &g_worker_sched };');
        lines.push('static const LV2_Feature *g_features[] = { &g_map_feature, &g_opt_feature, &g_worker_feature, NULL };');
    } else {
        lines.push('static const LV2_Feature *g_features[] = { &g_map_feature, &g_opt_feature, NULL };');
    }
    lines.push('');

    // Audio buffers
    for (const p of audioIn)  lines.push(`static float g_in_${p.symbol}[BLOCK_SIZE];`);
    for (const p of audioOut) lines.push(`static float g_out_${p.symbol}[BLOCK_SIZE];`);

    // Control scalars
    for (const p of ctrlIn)  lines.push(`static float g_ctrl_${p.symbol} = ${floatLit(p.default)};`);
    for (const p of ctrlOut) lines.push(`static float g_ctrl_${p.symbol} = 0.0f;`);
    for (const p of cvIn)    lines.push(`static float g_cv_${p.symbol}[BLOCK_SIZE];`);

    // Output atom buffers — plugin writes into these; size is set before each run
    for (const p of atomOut) lines.push(`static uint8_t g_atom_out_${p.symbol}[MIDI_BUF_SIZE];`);
    // Input atom buffers — non-MIDI control/notify inputs need a valid empty sequence
    for (const p of atomIn)  lines.push(`static uint8_t g_atom_in_${p.symbol}[MIDI_BUF_SIZE];`);

    // MIDI buffer — atom sequence (new API) or event buffer (legacy API)
    if (midiIn.length > 0) {
        lines.push('');
        if (usesLegacyMidi) {
            lines.push('#pragma GCC diagnostic push');
            lines.push('#pragma GCC diagnostic ignored "-Wdeprecated-declarations"');
            lines.push('/* Old LV2 event buffer: header + inline data region */');
            lines.push('static uint8_t g_legacy_evt_mem[sizeof(LV2_Event_Buffer) + MIDI_BUF_SIZE];');
            lines.push('static LV2_Event_Buffer *g_legacy_evt = (LV2_Event_Buffer *)g_legacy_evt_mem;');
            lines.push('static LV2_URID g_legacy_midi_urid;');
            lines.push('#pragma GCC diagnostic pop');
        } else {
            lines.push('static uint8_t g_midi_buf[MIDI_BUF_SIZE];');
            lines.push('static LV2_Atom_Sequence *g_midi_seq = (LV2_Atom_Sequence *)g_midi_buf;');
            lines.push('static LV2_URID g_urid_midi_event;');
            lines.push('static LV2_URID g_urid_atom_chunk;');
            lines.push('static LV2_URID g_urid_atom_sequence;');
        }
    }

    // Plugin handle
    lines.push('');
    lines.push('static const LV2_Descriptor *g_desc   = NULL;');
    lines.push('LV2_Handle                   g_handle = NULL;');
    lines.push('');

    // Forward declaration so shim_init can call shim_midi_clear before it is defined
    if (midiIn.length > 0) {
        lines.push('void shim_midi_clear(void);');
        lines.push('');
    }

    // shim_init
    lines.push('EMSCRIPTEN_KEEPALIVE void shim_init(unsigned long sample_rate) {');
    // Fill options array before instantiate so DPF-based plugins can read block size
    lines.push('    g_opt_urid_nom = urid_map_fn(NULL, LV2_BUF_SIZE__nominalBlockLength);');
    lines.push('    g_opt_urid_max = urid_map_fn(NULL, LV2_BUF_SIZE__maxBlockLength);');
    lines.push('    g_opt_urid_int = urid_map_fn(NULL, "http://lv2plug.in/ns/ext/atom#Int");');
    lines.push('    g_options[0].context=LV2_OPTIONS_INSTANCE; g_options[0].subject=0;');
    lines.push('    g_options[0].key=g_opt_urid_nom; g_options[0].size=sizeof(int32_t);');
    lines.push('    g_options[0].type=g_opt_urid_int; g_options[0].value=&g_opt_block_size;');
    lines.push('    g_options[1].context=LV2_OPTIONS_INSTANCE; g_options[1].subject=0;');
    lines.push('    g_options[1].key=g_opt_urid_max; g_options[1].size=sizeof(int32_t);');
    lines.push('    g_options[1].type=g_opt_urid_int; g_options[1].value=&g_opt_block_size;');
    lines.push('    g_options[2].key=0; g_options[2].value=NULL;');
    // Find descriptor by URI (some plugins register multiple at different indices)
    lines.push(`    { const char *_uri = "${descriptor.uri}";`);
    lines.push('      for (int _i = 0; ; _i++) {');
    lines.push('          g_desc = lv2_descriptor(_i);');
    lines.push('          if (!g_desc || strcmp(g_desc->URI, _uri) == 0) break;');
    lines.push('      }');
    lines.push('    }');
    lines.push('    g_handle = g_desc->instantiate(g_desc, (double)sample_rate, "", g_features);');

    if (midiIn.length > 0) {
        if (usesLegacyMidi) {
            lines.push('#pragma GCC diagnostic push');
            lines.push('#pragma GCC diagnostic ignored "-Wdeprecated-declarations"');
            lines.push('    g_legacy_midi_urid = urid_map_fn(NULL, LV2_MIDI__MidiEvent);');
            lines.push('    g_legacy_evt->capacity = MIDI_BUF_SIZE;');
            lines.push('    lv2_event_buffer_reset(g_legacy_evt, LV2_EVENT_AUDIO_STAMP,');
            lines.push('        (uint8_t *)(g_legacy_evt + 1));');
            lines.push('#pragma GCC diagnostic pop');
        } else {
            lines.push('    g_urid_midi_event   = urid_map_fn(NULL, LV2_MIDI__MidiEvent);');
            lines.push('    g_urid_atom_chunk   = urid_map_fn(NULL, LV2_ATOM__Chunk);');
            lines.push('    g_urid_atom_sequence = urid_map_fn(NULL, LV2_ATOM__Sequence);');
        }
    }

    for (const p of ports) {
        const sym = p.symbol;
        if (p.type === 'audio' && p.dir === 'input')    lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_in_${sym});`);
        if (p.type === 'audio' && p.dir === 'output')   lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_out_${sym});`);
        if (p.type === 'control' && p.cv && p.dir === 'input') lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_cv_${sym});`);
        else if (p.type === 'control')                         lines.push(`    g_desc->connect_port(g_handle, ${p.index}, &g_ctrl_${sym});`);
        if (p.type === 'midi' && p.dir === 'input') {
            if (p.legacy) {
                lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_legacy_evt);`);
            } else {
                lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_midi_seq);`);
            }
        }
        if (p.type === 'atom' && p.dir === 'output') lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_atom_out_${p.symbol});`);
        if (p.type === 'atom' && p.dir === 'input')  lines.push(`    g_desc->connect_port(g_handle, ${p.index}, g_atom_in_${p.symbol});`);
    }
    // Initialize input atom buffers as empty sequences (URID 0 is acceptable for non-MIDI)
    for (const p of atomIn) {
        lines.push(`    { uint32_t *_a = (uint32_t*)g_atom_in_${p.symbol};`);
        lines.push(`      _a[0] = sizeof(uint64_t); /* atom.size = body size (empty sequence body) */`);
        lines.push(`      _a[1] = 0; /* atom.type = 0 (no URID needed for empty input) */`);
        lines.push(`      _a[2] = 0; _a[3] = 0; /* sequence body: unit=0, pad=0 */`);
        lines.push(`    }`);
    }

    lines.push('    if (g_desc->activate) g_desc->activate(g_handle);');
    if (midiIn.length > 0) lines.push('    shim_midi_clear();');
    if (extraFeatures.includes('worker')) {
        // Call into the DPF LV2 backend to register the instance for state bridge.
        lines.push('    { extern void wadspa_register_plugin_lv2(LV2_Handle); wadspa_register_plugin_lv2(g_handle); }');
    }
    lines.push('}');
    lines.push('');

    // MIDI helpers
    if (midiIn.length > 0) {
        if (usesLegacyMidi) {
            lines.push('#pragma GCC diagnostic push');
            lines.push('#pragma GCC diagnostic ignored "-Wdeprecated-declarations"');
            lines.push('EMSCRIPTEN_KEEPALIVE void shim_midi_clear() {');
            lines.push('    lv2_event_buffer_reset(g_legacy_evt, LV2_EVENT_AUDIO_STAMP,');
            lines.push('        (uint8_t *)(g_legacy_evt + 1));');
            lines.push('}');
            lines.push('');
            lines.push('static void push_midi(const uint8_t *data, uint32_t size) {');
            lines.push('    uint32_t padded = ((uint32_t)sizeof(LV2_Event) + size + 7u) & ~7u;');
            lines.push('    if (g_legacy_evt->size + padded > MIDI_BUF_SIZE) return;');
            lines.push('    LV2_Event *ev = (LV2_Event *)((uint8_t *)(g_legacy_evt + 1) + g_legacy_evt->size);');
            lines.push('    ev->frames    = 0;');
            lines.push('    ev->subframes = 0;');
            lines.push('    ev->type      = (uint16_t)g_legacy_midi_urid;');
            lines.push('    ev->size      = (uint16_t)size;');
            lines.push('    memcpy(ev + 1, data, size);');
            lines.push('    g_legacy_evt->size += padded;');
            lines.push('    g_legacy_evt->event_count++;');
            lines.push('}');
            lines.push('#pragma GCC diagnostic pop');
        } else {
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
        }
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
        lines.push('EMSCRIPTEN_KEEPALIVE void shim_midi_poly_pressure(uint8_t ch, uint8_t note, uint8_t val)');
        lines.push('    { uint8_t m[3] = {(uint8_t)(0xA0|ch), note, val}; push_midi(m, 3); }');
        lines.push('');
        lines.push('EMSCRIPTEN_KEEPALIVE void shim_midi_channel_pressure(uint8_t ch, uint8_t val)');
        lines.push('    { uint8_t m[2] = {(uint8_t)(0xD0|ch), val}; push_midi(m, 2); }');
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
    for (const p of cvIn) {
        lines.push(`    for (unsigned long _i = 0; _i < count && _i < BLOCK_SIZE; _i++) g_cv_${p.symbol}[_i] = g_ctrl_${p.symbol};`);
    }
    // Set output atom buffer capacities so plugins know how much space they can use
    for (const p of atomOut) {
        lines.push(`    *(uint32_t*)g_atom_out_${p.symbol} = MIDI_BUF_SIZE - 8; /* atom.size = capacity */`);
    }
    lines.push('    g_desc->run(g_handle, count);');
    if (midiIn.length > 0) lines.push('    shim_midi_clear();');
    lines.push('}');
    lines.push('');

    return lines.join('\n');
}

// Exported function list for emcc's EXPORTED_FUNCTIONS flag
export function lv2ExportedFunctions(descriptor, extraExports = []) {
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
                 '_shim_midi_cc', '_shim_midi_poly_pressure',
                 '_shim_midi_channel_pressure', '_shim_midi_pitch_bend');
    }

    for (const fn of extraExports) {
        if (!fns.includes(fn)) fns.push(fn);
    }

    return fns;
}

// Processor.js for LV2 instruments — adds MIDI message handling
export function generateLv2Processor(descriptor, label, extraFeatures = []) {
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
        if (audioIn.length === 0) {
            inputCopies = '';
        } else if (audioIn.length === 1) {
            inputCopies = `        const _c0 = inputs[0]?.[0]; if (_c0 && _c0.length) mod.HEAPF32.set(_c0, inPtrs[0]);`;
        } else {
            // L/R are ports 0 and 1, read from the single stereo worklet input (inputs[0][0] and inputs[0][1]).
            // Any further ports (sidechain, etc.) come from separate unconnected worklet inputs.
            const lines = [
                `        const _cL = inputs[0]?.[0]; if (_cL && _cL.length) mod.HEAPF32.set(_cL, inPtrs[0]);`,
                `        const _cR = inputs[0]?.[1]; if (_cR && _cR.length) mod.HEAPF32.set(_cR, inPtrs[1]);`,
            ];
            for (let i = 2; i < audioIn.length; i++) {
                lines.push(`        const _c${i} = inputs[${i}]?.[0]; if (_c${i} && _c${i}.length) mod.HEAPF32.set(_c${i}, inPtrs[${i}]);`);
            }
            inputCopies = lines.join('\n');
        }
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
                else if (type === 0xA0 && mod._shim_midi_poly_pressure) mod._shim_midi_poly_pressure(ch, data1, data2);
                else if (type === 0xB0) mod._shim_midi_cc(ch, data1, data2);
                else if (type === 0xD0 && mod._shim_midi_channel_pressure) mod._shim_midi_channel_pressure(ch, data1);
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
            } else if (data.type === 'loadSample') {
                if (!mod) return;
                const pcm = new Float32Array(data.buffer);
                const ptr = mod._malloc(pcm.byteLength);
                mod.HEAPF32.set(pcm, ptr >> 2);
                if (typeof mod._shim_sample_set_pcm === 'function')
                    mod._shim_sample_set_pcm(ptr, pcm.length, data.srate);
                if (typeof mod._shim_load_sample === 'function')
                    mod._shim_load_sample();
                mod._free(ptr);
                this.port.postMessage({ type: 'sampleloaded' });
            } else if (data.type === 'loadPad') {
                if (!mod || typeof mod._shim_load_pad !== 'function') return;
                const pcm = new Float32Array(data.buffer);
                const ptr = mod._malloc(pcm.byteLength);
                mod.HEAPF32.set(pcm, ptr >> 2);
                mod._shim_load_pad(data.note, ptr, pcm.length, data.srate);
                mod._free(ptr);
                this.port.postMessage({ type: 'padloaded', note: data.note });
            } else if (data.type === 'set') {
                if (mod) { const fn = SETTERS[data.symbol]; if (fn) mod[fn](data.value); }${extraFeatures.includes('worker') ? `
            } else if (data.type === 'setState') {
                if (!mod || typeof mod._shim_set_plugin_state !== 'function') return;
                const enc = new TextEncoder();
                const kb = enc.encode(data.key + '\\0'), vb = enc.encode(data.value + '\\0');
                const kp = mod._malloc(kb.length), vp = mod._malloc(vb.length);
                mod.HEAPU8.set(kb, kp); mod.HEAPU8.set(vb, vp);
                mod._shim_set_plugin_state(kp, vp);
                mod._free(kp); mod._free(vp);` : ''}
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
