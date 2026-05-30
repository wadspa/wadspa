import { execSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');

// includeDirs: raw directory paths (not prefixed with -I)
export function inspectPlugin(pluginDir, pluginFiles, includeDirs = []) {
    const tmp = mkdtempSync(join(tmpdir(), 'wadspa-inspect-'));
    const inspectBin = join(tmp, 'inspect');
    const inspectSrc = join(TEMPLATES, 'inspect.c');

    try {
        const allIncludes = [pluginDir, ...includeDirs];
        const includes = [...new Set(allIncludes)].map(d => `-I"${d}"`).join(' ');
        const sources  = pluginFiles.map(f => `"${f}"`).join(' ');
        const cmd = `cc ${sources} "${inspectSrc}" ${includes} -lm -o "${inspectBin}" 2>&1`;

        try {
            execSync(cmd, { encoding: 'utf8' });
        } catch (e) {
            throw new Error(`Native compilation failed:\n${e.stdout || e.message}`);
        }

        const json = execSync(`"${inspectBin}"`, { encoding: 'utf8' });
        return JSON.parse(json);

    } finally {
        rmSync(tmp, { recursive: true, force: true });
    }
}
