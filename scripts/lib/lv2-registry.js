import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const LV2_REGISTRY_FILE = 'lv2.json';
export const LEGACY_LV2_REGISTRY_FILE = 'instruments.json';

export function lv2RegistryPath(root) {
    const pluginsDir = join(root, 'plugins');
    const primary = join(pluginsDir, LV2_REGISTRY_FILE);
    const legacy = join(pluginsDir, LEGACY_LV2_REGISTRY_FILE);
    return existsSync(primary) ? primary : legacy;
}

export function readLv2Registry(root) {
    return JSON.parse(readFileSync(lv2RegistryPath(root), 'utf8'));
}

export function writeLv2Registry(root, entries) {
    writeFileSync(
        join(root, 'plugins', LV2_REGISTRY_FILE),
        `${JSON.stringify(entries, null, 2)}\n`
    );
}
