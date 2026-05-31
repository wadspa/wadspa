#!/usr/bin/env node
/**
 * Scaffold wadspa plugin directories from the checked-out mda-lv2 tree.
 *
 * Usage:
 *   node scripts/setup-mda-lv2.js --list
 *   node scripts/setup-mda-lv2.js
 *   node scripts/setup-mda-lv2.js --only DX10,Delay --write-registry
 *   node scripts/setup-mda-lv2.js --all --write-registry
 *
 * Without --all or --only, this refreshes the MDA entries already present in
 * plugins/lv2.json. Use --write-registry to add/update registry entries.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MDA = join(ROOT, 'mda-lv2');
const PLUGINS = join(ROOT, 'plugins');
const URI_PREFIX = 'http://moddevices.com/plugins/mda/';

const LVZ_SHARED = [
    { src: join(MDA, 'lvz', 'wrapper.cpp'),     dst: '_wrapper.cpp' },
    { src: join(MDA, 'lvz', 'audioeffectx.h'),  dst: 'audioeffectx.h' },
    { src: join(MDA, 'lvz', 'AudioEffect.hpp'), dst: 'AudioEffect.hpp' },
    { src: join(MDA, 'src', 'lv2_programs.h'),  dst: 'lv2_programs.h' },
];

const DESCRIPTION_OVERRIDES = new Map([
    ['mda_BeatBox', 'Drum machine / beat generator'],
    ['mda_DX10', 'FM synthesizer, 8-voice polyphonic'],
    ['mda_EPiano', 'Electric piano (Rhodes/Wurlitzer style)'],
    ['mda_JX10', 'Virtual analog polysynth, 8-voice'],
    ['mda_Piano', 'Acoustic piano physical model'],
    ['mda_SubSynth', 'Sub-bass synthesizer'],
]);

const args = process.argv.slice(2);
const listOnly = args.includes('--list');
const selectAll = args.includes('--all');
const writeRegistry = args.includes('--write-registry');
const dryRun = args.includes('--dry-run');
const onlyValues = readListArgs('--only');

if (!existsSync(MDA)) {
    console.error('mda-lv2 not found. Run: git clone https://github.com/mod-audio/mda-lv2.git');
    process.exit(1);
}

const currentRegistry = readLv2Registry(ROOT);
const candidates = discoverMdaPlugins();

if (listOnly) {
    printCandidateList(candidates, currentRegistry);
    process.exit(0);
}

const selected = selectCandidates(candidates, currentRegistry);
if (selected.length === 0) {
    console.error('No MDA LV2 plugins selected.');
    console.error('Use --list to inspect candidates, --all for every available MDA plugin, or --only <id>.');
    process.exit(1);
}

for (const candidate of selected) {
    scaffoldCandidate(candidate);
}

if (writeRegistry) {
    const updated = updateRegistry(currentRegistry, selected);
    if (!dryRun) writeLv2Registry(ROOT, updated);
    console.log(`\nRegistry ${dryRun ? 'would update' : 'updated'}: plugins/lv2.json (${updated.length} LV2 plugins)`);
} else {
    console.log('\nRegistry unchanged. Re-run with --write-registry to update plugins/lv2.json.');
}

function readListArgs(flag) {
    const values = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === flag && args[i + 1]) {
            values.push(args[++i]);
        } else if (arg.startsWith(`${flag}=`)) {
            values.push(arg.slice(flag.length + 1));
        }
    }
    return values.flatMap(v => v.split(',')).map(v => v.trim()).filter(Boolean);
}

function discoverMdaPlugins() {
    const bundlesDir = join(MDA, 'bundles');
    return readdirSync(bundlesDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name.match(/^mod-mda-(.+)\.lv2$/)?.[1])
        .filter(Boolean)
        .map(mdaId => {
            const className = `mda${mdaId}`;
            const bundleDir = join(bundlesDir, `mod-mda-${mdaId}.lv2`);
            const pluginId = `mda_${mdaId}`;
            const wrapperFile = `mda_${mdaId}_lv2.cpp`;
            const sourceFile = `${className}.cpp`;
            const headerFile = `${className}.h`;
            const ttlFile = `${mdaId}.ttl`;
            return {
                mdaId,
                className,
                pluginId,
                wrapperFile,
                sourceFile,
                headerFile,
                ttlFile,
                bundleDir,
                pluginDir: join(PLUGINS, pluginId),
                manifestTemplate: join(bundleDir, 'manifest.ttl.in'),
                ttlPath: join(bundleDir, ttlFile),
                sourcePath: join(MDA, 'src', sourceFile),
                headerPath: join(MDA, 'src', headerFile),
                dataHeaderPath: join(MDA, 'src', `${className}Data.h`),
            };
        })
        .filter(candidate => {
            return existsSync(candidate.manifestTemplate)
                && existsSync(candidate.ttlPath)
                && existsSync(candidate.sourcePath)
                && existsSync(candidate.headerPath);
        })
        .sort((a, b) => a.mdaId.localeCompare(b.mdaId));
}

function printCandidateList(candidateList, registry) {
    const registered = new Set(registry.map(entry => entry.id));
    console.log('Available mda-lv2 plugins:');
    for (const candidate of candidateList) {
        const mark = registered.has(candidate.pluginId) ? '*' : ' ';
        console.log(` ${mark} ${candidate.mdaId.padEnd(10)} ${candidate.pluginId.padEnd(18)} ${candidate.className}`);
    }
    console.log('\n* already present in plugins/lv2.json');
}

function selectCandidates(candidateList, registry) {
    const byKey = new Map();
    for (const candidate of candidateList) {
        byKey.set(candidate.mdaId.toLowerCase(), candidate);
        byKey.set(candidate.pluginId.toLowerCase(), candidate);
    }

    if (onlyValues.length > 0) {
        const selected = [];
        for (const value of onlyValues) {
            const candidate = byKey.get(value.toLowerCase());
            if (!candidate) {
                console.error(`Unknown MDA LV2 plugin: ${value}`);
                process.exit(1);
            }
            if (!selected.includes(candidate)) selected.push(candidate);
        }
        return selected;
    }

    if (selectAll) return candidateList;

    const currentMdaIds = new Set(registry.map(entry => entry.id).filter(id => id.startsWith('mda_')));
    return candidateList.filter(candidate => currentMdaIds.has(candidate.pluginId));
}

function scaffoldCandidate(candidate) {
    console.log(`\n> ${candidate.pluginId}`);
    if (!dryRun) mkdirSync(candidate.pluginDir, { recursive: true });

    const manifest = readFileSync(candidate.manifestTemplate, 'utf8').replace(/@LIB_EXT@/g, '.so');
    write(candidate.pluginDir, 'manifest.ttl', manifest);
    console.log('  manifest.ttl');

    for (const entry of readdirSync(candidate.bundleDir, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.ttl')) {
            copy(join(candidate.bundleDir, entry.name), join(candidate.pluginDir, entry.name));
            console.log(`  ${entry.name}`);
        }
    }

    copy(candidate.sourcePath, join(candidate.pluginDir, candidate.sourceFile));
    copy(candidate.headerPath, join(candidate.pluginDir, candidate.headerFile));
    console.log(`  ${candidate.sourceFile}`);
    console.log(`  ${candidate.headerFile}`);

    if (existsSync(candidate.dataHeaderPath)) {
        const dataHeader = `${candidate.className}Data.h`;
        copy(candidate.dataHeaderPath, join(candidate.pluginDir, dataHeader));
        console.log(`  ${dataHeader}`);
    }

    for (const { src, dst } of LVZ_SHARED) {
        copy(src, join(candidate.pluginDir, dst));
    }
    console.log('  lvz shared files');

    const wrapperSrc = `\
// Auto-generated by setup-mda-lv2.js. Do not edit.
#define PLUGIN_CLASS      ${candidate.className}
#define URI_PREFIX        "${URI_PREFIX}"
#define PLUGIN_URI_SUFFIX "${candidate.mdaId}"
#define PLUGIN_HEADER     "${candidate.className}.h"
#include "_wrapper.cpp"
`;
    write(candidate.pluginDir, candidate.wrapperFile, wrapperSrc);
    console.log(`  ${candidate.wrapperFile}`);
}

function updateRegistry(registry, selected) {
    const selectedEntries = new Map(selected.map(candidate => [
        candidate.pluginId,
        registryEntryFor(candidate, registry.find(entry => entry.id === candidate.pluginId)),
    ]));
    const output = [];

    for (const entry of registry) {
        if (selectedEntries.has(entry.id)) {
            output.push(selectedEntries.get(entry.id));
            selectedEntries.delete(entry.id);
        } else if (!(selectAll && entry.id.startsWith('mda_'))) {
            output.push(entry);
        }
    }

    output.push(...selectedEntries.values());
    return output;
}

function registryEntryFor(candidate, previous) {
    return {
        ...(previous ?? {}),
        id: candidate.pluginId,
        description: previous?.description
            ?? DESCRIPTION_OVERRIDES.get(candidate.pluginId)
            ?? ttlDescription(candidate)
            ?? `MDA ${candidate.mdaId} LV2 plugin`,
        sources: [candidate.wrapperFile, candidate.sourceFile],
    };
}

function ttlDescription(candidate) {
    const ttl = readFileSync(candidate.ttlPath, 'utf8');
    const match = ttl.match(/rdfs:comment\s+"""([\s\S]*?)"""/);
    if (!match) return null;

    const firstParagraph = match[1]
        .trim()
        .split(/\n\s*\n/)[0]
        .replace(/\s+/g, ' ')
        .trim();
    if (!firstParagraph) return null;
    return firstParagraph.length > 160
        ? `${firstParagraph.slice(0, 157).trim()}...`
        : firstParagraph;
}

function copy(src, dest) {
    if (dryRun) return;
    writeFileSync(dest, readFileSync(src));
}

function write(dir, file, contents) {
    if (dryRun) return;
    writeFileSync(join(dir, file), contents);
}
