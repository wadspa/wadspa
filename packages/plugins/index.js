import effects from './catalog.js';
import instruments from './instruments.js';

export { effects, instruments };

export const instrumentCount = instruments.length;
export const effectCount = effects.length;
export const pluginCount = instrumentCount + effectCount;

export const plugins = Object.freeze([
    ...instruments.map(entry => Object.freeze({ ...entry, type: 'instrument' })),
    ...effects.map(entry => Object.freeze({ ...entry, type: 'effect' })),
]);

const pluginsById = new Map(plugins.map(entry => [entry.id, entry]));

export function listPlugins(filters = {}) {
    return plugins.filter(entry => matchesFilters(entry, filters));
}

export function getPlugin(id) {
    return pluginsById.get(id) ?? null;
}

export function requirePlugin(id) {
    const entry = getPlugin(id);
    if (!entry) throw new Error(`Unknown wadspa plugin: ${id}`);
    return entry;
}

export function pluginAssetUrl(idOrEntry, fileName, options = {}) {
    const entry = resolveEntry(idOrEntry);
    const baseUrl = options.baseUrl ?? import.meta.url;
    const path = ['plugins', entry.id, fileName].map(encodePathSegment).join('/');
    return packageUrl(path, baseUrl);
}

export function pluginModule(idOrEntry, options = {}) {
    const entry = resolveEntry(idOrEntry);
    return {
        meta: entry,
        wasmUrl: pluginAssetUrl(entry, entry.wasmFile, options),
        processorUrl: pluginAssetUrl(entry, entry.processorFile ?? 'processor.js', options),
    };
}

export const getPluginModule = pluginModule;

export async function loadPluginById(ctx, idOrEntry, options = {}) {
    const loadPlugin = options.loadPlugin;
    if (typeof loadPlugin !== 'function') {
        throw new Error('loadPluginById requires { loadPlugin } from @wadspa/core');
    }
    return loadPlugin(ctx, pluginModule(idOrEntry, options));
}

function resolveEntry(idOrEntry) {
    if (idOrEntry && typeof idOrEntry === 'object') return idOrEntry;
    return requirePlugin(String(idOrEntry));
}

function matchesFilters(entry, filters) {
    if (filters.type && entry.type !== filters.type) return false;
    if (filters.category && entry.category !== filters.category) return false;
    if (filters.license && entry.license !== filters.license) return false;
    if (filters.midi === true && !entry.ports?.some(port => port.type === 'midi' && port.dir === 'input')) return false;
    if (filters.audioInput === true && !entry.ports?.some(port => port.type === 'audio' && port.dir === 'input')) return false;
    return true;
}

function packageUrl(path, baseUrl) {
    const root = String(baseUrl).endsWith('/') ? String(baseUrl) : new URL('.', baseUrl).href;
    return new URL(path, root).href;
}

function encodePathSegment(segment) {
    return encodeURIComponent(String(segment));
}
