import { execSync } from 'child_process';
import { existsSync } from 'fs';

function findEmcc() {
    const candidates = [
        process.env.EMCC,
        `${process.env.HOME}/emsdk/upstream/emscripten/emcc`,
    ].filter(Boolean);

    for (const p of candidates) {
        if (existsSync(p)) return p;
    }

    try {
        execSync('which emcc', { encoding: 'utf8' });
        return 'emcc';
    } catch {
        throw new Error(
            'emcc not found. Run: source ~/emsdk/emsdk_env.sh\n' +
            'Or set the EMCC environment variable to the full path.'
        );
    }
}

export function compilePlugin({
    sources,       // string[] — .c files to compile
    outJs,         // string   — output .js path
    exportedFns,   // string[] — EXPORTED_FUNCTIONS list
    includeFlags,  // string[] — extra -I flags
    defines,       // string[] — extra -D flags
    exportName,    // string   — factory function name
}) {
    const emcc = findEmcc();

    const exported = JSON.stringify(exportedFns);
    const flags = [
        '-O3',
        '-s WASM=1',
        '-s MODULARIZE=1',
        `-s EXPORT_NAME='${exportName}'`,
        '-s EXPORT_ES6=1',
        "-s ENVIRONMENT='node,worker'",
        `-s EXPORTED_FUNCTIONS='${exported}'`,
        "-s EXPORTED_RUNTIME_METHODS='[\"HEAPF32\"]'",
        '-s ALLOW_MEMORY_GROWTH=0',
        '-DBIQUAD_TYPE=double',  // safe default: prevents float32 precision loss at low freqs
        '-lm',
        ...includeFlags.map(f => `-I"${f}"`),
        ...defines.map(d => `-D${d}`),
    ];

    const srcList = sources.map(s => `"${s}"`).join(' ');
    const cmd = `"${emcc}" ${srcList} ${flags.join(' ')} -o "${outJs}"`;

    try {
        execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
        throw new Error(`emcc compilation failed:\n${e.stderr || e.message}`);
    }
}
