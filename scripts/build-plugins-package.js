#!/usr/bin/env node

import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const DOCS_PLUGINS = join(DOCS, 'plugins');
const OUT = join(ROOT, 'packages', 'plugins');

const effects = readJson(join(DOCS_PLUGINS, 'catalog.json'));
const instruments = readJson(join(DOCS, 'instruments.json'));

cleanGeneratedPackageFiles();

writeJson(join(OUT, 'catalog.json'), effects);
writeJson(join(OUT, 'instruments.json'), instruments);
writeJsCatalog(join(OUT, 'catalog.js'), 'effects', effects);
writeJsCatalog(join(OUT, 'instruments.js'), 'instruments', instruments);
writeFileSync(join(OUT, 'LICENSES.md'), licensesMarkdown(instruments, effects));

copy(DOCS_PLUGINS, join(OUT, 'plugins'));

console.log(`@wadspa/plugins package built: ${instruments.length} instruments, ${effects.length} effects`);

function cleanGeneratedPackageFiles() {
    for (const name of [
        'catalog.js',
        'catalog.json',
        'instruments.js',
        'instruments.json',
        'LICENSES.md',
        'plugins',
        'soundfonts',
    ]) {
        rmSync(join(OUT, name), { recursive: true, force: true });
    }
    mkdirSync(OUT, { recursive: true });
}

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeJsCatalog(path, exportName, value) {
    writeFileSync(
        path,
        `const ${exportName} = ${JSON.stringify(value, null, 2)};\n\nexport { ${exportName} };\nexport default ${exportName};\n`
    );
}

function copy(src, dest) {
    const stat = statSync(src);
    if (stat.isDirectory()) {
        mkdirSync(dest, { recursive: true });
        for (const entry of readdirSync(src)) copy(join(src, entry), join(dest, entry));
        return;
    }
    writeFileSync(dest, readFileSync(src));
}

function licensesMarkdown(instrumentEntries, effectEntries) {
    const entries = [
        ...instrumentEntries.map(entry => ({ ...entry, type: 'instrument' })),
        ...effectEntries.map(entry => ({ ...entry, type: 'effect' })),
    ];
    const licenseCounts = new Map();
    for (const entry of entries) {
        const license = entry.license || 'UNKNOWN';
        licenseCounts.set(license, (licenseCounts.get(license) || 0) + 1);
    }

    const summaryRows = [...licenseCounts]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([license, count]) => `| ${md(license)} | ${count} |`)
        .join('\n');

    const pluginRows = entries
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(entry => `| \`${md(entry.id)}\` | ${md(entry.name || entry.label || entry.id)} | ${entry.type} | ${md(entry.license || 'UNKNOWN')} |`)
        .join('\n');

    return `# @wadspa/plugins License Summary

This npm package contains mixed-license browser builds of third-party LADSPA and LV2 plugins. The package-level license is therefore a pointer to this file, not a single SPDX grant for every bundled plugin.

## Counts

| License | Plugins |
|---|---:|
${summaryRows}

## Plugins

| ID | Name | Type | License |
|---|---|---|---|
${pluginRows}
`;
}

function md(value) {
    return String(value).replaceAll('|', '\\|');
}
