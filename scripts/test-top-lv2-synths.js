#!/usr/bin/env node
/**
 * Support contract for the requested top LV2 synth/instrument targets.
 *
 * Default mode verifies the contract is honest:
 *   - exactly 20 targets are tracked
 *   - supported targets exist in the built browser instrument catalog
 *   - candidate targets have source repositories in sources.json
 *   - partial support is not counted as instrument support
 *
 * Strict mode additionally fails every candidate, so it can be used as the
 * backlog gate when moving the top-20 list from tracked to fully supported:
 *   node scripts/test-top-lv2-synths.js --strict
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const targets = readJson(join(ROOT, 'docs', 'top-lv2-synths.json'));
const sources = readJson(join(ROOT, 'sources.json'));
const registry = readLv2Registry(ROOT);
const instruments = readJson(join(ROOT, 'docs', 'instruments.json'));
const effects = readJson(join(ROOT, 'docs', 'plugins', 'catalog.json'));

const sourceIds = new Set(sources.map(entry => entry.id));
const sourcesById = new Map(sources.map(entry => [entry.id, entry]));
const setupTargetsById = new Map(sources.flatMap(source =>
    (source.targets ?? []).map(target => [target.id, { source, target }])
));
const registryById = new Map(registry.map(entry => [entry.id, entry]));
const instrumentsById = new Map(instruments.map(entry => [entry.id, entry]));
const effectsById = new Map(effects.map(entry => [entry.id, entry]));

const issues = [];
const supported = [];
const candidates = [];

if (!Array.isArray(targets)) {
    issues.push('docs/top-lv2-synths.json must be an array');
} else if (targets.length !== 20) {
    issues.push(`expected 20 top LV2 synth targets, found ${targets.length}`);
}

const seen = new Set();
for (const target of Array.isArray(targets) ? targets : []) {
    const label = target?.name ?? target?.id ?? '<unknown>';

    if (!target || typeof target !== 'object') {
        issues.push('target entry must be an object');
        continue;
    }

    if (!target.id || typeof target.id !== 'string') {
        issues.push(`${label}: missing string id`);
    } else if (seen.has(target.id)) {
        issues.push(`${label}: duplicate id ${target.id}`);
    } else {
        seen.add(target.id);
    }

    if (!target.name || typeof target.name !== 'string') {
        issues.push(`${target.id ?? label}: missing string name`);
    }

    const status = target.status;
    if (status !== 'supported' && status !== 'candidate') {
        issues.push(`${label}: status must be supported or candidate`);
        continue;
    }

    const targetSourceIds = target.sourceIds ?? [];
    if (!Array.isArray(targetSourceIds) || targetSourceIds.length === 0) {
        issues.push(`${label}: missing sourceIds`);
    } else {
        for (const sourceId of targetSourceIds) {
            if (!sourceIds.has(sourceId)) {
                issues.push(`${label}: sourceId ${sourceId} is not listed in sources.json`);
            }
        }
    }

    if (status === 'supported') {
        supported.push(target);
        validateSupportedTarget(target);
    } else {
        candidates.push(target);
        validateCandidateTarget(target);
    }
}

if (issues.length > 0) {
    console.log(`top LV2 synth support FAILED (${issues.length} issues)`);
    for (const issue of issues) console.log(`  - ${issue}`);
    process.exit(1);
}

const mode = strict ? 'strict' : 'tracking';
console.log(`top LV2 synth support ok (${mode}: ${supported.length} supported, ${candidates.length} candidates)`);

function validateSupportedTarget(target) {
    const catalogIds = target.catalogIds ?? [];
    if (!Array.isArray(catalogIds) || catalogIds.length === 0) {
        issues.push(`${target.name}: supported target must list catalogIds`);
        return;
    }

    for (const catalogId of catalogIds) {
        const instrument = instrumentsById.get(catalogId);
        const registryEntry = registryById.get(catalogId);
        if (!instrument) {
            issues.push(`${target.name}: supported catalogId ${catalogId} is missing from docs/instruments.json`);
            continue;
        }
        if (!registryEntry) {
            issues.push(`${target.name}: supported catalogId ${catalogId} is missing from plugins/lv2.json`);
        }
        if (!hasMidiInput(instrument)) {
            issues.push(`${target.name}: ${catalogId} is not a MIDI instrument in docs/instruments.json`);
        }
        if (!existsSync(join(ROOT, 'docs', 'plugins', catalogId, 'index.js'))) {
            issues.push(`${target.name}: ${catalogId} is missing built browser artifact docs/plugins/${catalogId}/index.js`);
        }
        validateRegistryBuildPath(target, catalogId, registryEntry);
    }

    validateSetupPath(target);

    for (const partialId of target.partialCatalogIds ?? []) {
        if (effectsById.has(partialId)) {
            issues.push(`${target.name}: supported target cannot rely on effect-only partial catalogId ${partialId}`);
        }
    }
}

function validateCandidateTarget(target) {
    if (!target.notes || typeof target.notes !== 'string') {
        issues.push(`${target.name}: candidate target must describe the remaining porting work in notes`);
    }
    validateStringList(target, 'blockers', 'candidate target must list current build blockers');
    validateStringList(target, 'nextSteps', 'candidate target must list next porting steps');

    const setupTarget = setupTargetsById.get(target.id);
    if (!setupTarget) {
        issues.push(`${target.name}: candidate target is missing from sources.json targets`);
    } else {
        if (!(target.sourceIds ?? []).includes(setupTarget.source.id)) {
            issues.push(`${target.name}: sources.json target belongs to ${setupTarget.source.id}, but top target lists ${target.sourceIds?.join(', ') || 'no sources'}`);
        }
        const sourceDir = join(ROOT, setupTarget.source.id);
        if (setupTarget.target.bundle && existsSync(sourceDir)) {
            const bundleDir = join(sourceDir, setupTarget.target.bundle);
            if (!existsSync(bundleDir)) {
                issues.push(`${target.name}: sources.json bundle ${setupTarget.target.bundle} does not exist in ${setupTarget.source.id}`);
            }
        }
    }

    for (const catalogId of target.catalogIds ?? []) {
        if (instrumentsById.has(catalogId)) {
            issues.push(`${target.name}: has built instrument catalogId ${catalogId} but is still marked candidate`);
        }
    }

    for (const partialId of target.partialCatalogIds ?? []) {
        if (!effectsById.has(partialId) && !instrumentsById.has(partialId)) {
            issues.push(`${target.name}: partialCatalogId ${partialId} is not packaged`);
        }
        if (instrumentsById.has(partialId)) {
            issues.push(`${target.name}: partialCatalogId ${partialId} is an instrument and should be catalogIds support`);
        }
    }

    if (strict) {
        issues.push(`${target.name}: tracked candidate, not yet built as a browser instrument`);
    }
}

function validateRegistryBuildPath(target, catalogId, registryEntry) {
    const pluginDir = join(ROOT, 'plugins', catalogId);
    if (!existsSync(pluginDir)) {
        issues.push(`${target.name}: ${catalogId} is missing plugin source directory plugins/${catalogId}`);
        return;
    }

    if (registryEntry.buildScript) {
        const scriptPath = join(ROOT, registryEntry.buildScript);
        if (!existsSync(scriptPath)) {
            issues.push(`${target.name}: ${catalogId} buildScript ${registryEntry.buildScript} does not exist`);
        }
        return;
    }

    const pluginSources = registryEntry.sources ?? [];
    if (!Array.isArray(pluginSources) || pluginSources.length === 0) {
        issues.push(`${target.name}: ${catalogId} must list sources or buildScript in plugins/lv2.json`);
        return;
    }

    for (const sourceFile of pluginSources) {
        if (!existsSync(join(pluginDir, sourceFile))) {
            issues.push(`${target.name}: ${catalogId} source ${sourceFile} is missing from plugins/${catalogId}`);
        }
    }
}

function validateSetupPath(target) {
    const catalogIds = new Set(target.catalogIds ?? []);
    const setupPaths = [];

    for (const sourceId of target.sourceIds ?? []) {
        const source = sourcesById.get(sourceId);
        if (!source) continue;

        if (source.setup) {
            setupPaths.push({ id: source.id, setup: source.setup });
        }

        for (const setupTarget of source.targets ?? []) {
            const matchesTarget = setupTarget.id === target.id || catalogIds.has(setupTarget.id);
            if (!matchesTarget) continue;

            if (setupTarget.setup) {
                setupPaths.push({ id: setupTarget.id, setup: setupTarget.setup });
            } else if (setupTarget.autoSetup !== false) {
                setupPaths.push({ id: setupTarget.id, setup: 'auto-setup.js' });
            }
        }
    }

    if (setupPaths.length === 0) {
        issues.push(`${target.name}: supported target is missing setup automation in sources.json`);
        return;
    }

    for (const setupPath of setupPaths) {
        const scriptName = setupPath.setup.endsWith('.js') ? setupPath.setup : `${setupPath.setup}.js`;
        if (!existsSync(join(ROOT, 'scripts', scriptName))) {
            issues.push(`${target.name}: setup script ${scriptName} for ${setupPath.id} does not exist`);
        }
    }
}

function validateStringList(target, field, message) {
    const value = target[field];
    if (!Array.isArray(value) || value.length === 0 || value.some(item => typeof item !== 'string' || item.trim() === '')) {
        issues.push(`${target.name}: ${message}`);
    }
}

function hasMidiInput(entry) {
    return (entry.ports ?? []).some(port => port.type === 'midi' && port.dir === 'input');
}

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}
