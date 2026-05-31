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
    sources,                  // string[] — .c/.cpp files to compile
    outJs,                    // string   — output .js path
    exportedFns,              // string[] — EXPORTED_FUNCTIONS list
    includeFlags,             // string[] — extra -I flags
    defines,                  // string[] — extra -D flags
    exportName,               // string   — factory function name
    threads         = false,  // boolean  — enable pthreads (requires COOP/COEP headers)
    embedFiles      = [],     // string[] — "src@/virtual/path" pairs to embed in WASM FS
    allowMemoryGrowth = false,// boolean  — allow WASM heap to grow at runtime
}) {
    const emcc = findEmcc();

    const exported = JSON.stringify(exportedFns);
    const env = threads ? 'worker' : 'node,worker';
    const flags = [
        '-O3',
        '-s WASM=1',
        '-s MODULARIZE=1',
        `-s EXPORT_NAME='${exportName}'`,
        '-s EXPORT_ES6=1',
        `-s ENVIRONMENT='${env}'`,
        `-s EXPORTED_FUNCTIONS='${exported}'`,
        "-s EXPORTED_RUNTIME_METHODS='[\"HEAPF32\",\"FS\"]'",
        `-s ALLOW_MEMORY_GROWTH=${allowMemoryGrowth || threads ? 1 : 0}`,
        '-DBIQUAD_TYPE=double',
        '-lm',
        ...includeFlags.map(f => `-I"${f}"`),
        ...defines.map(d => `-D${d}`),
        ...embedFiles.map(f => `--embed-file "${f}"`),
        ...(threads ? [
            '-pthread',
            '-s PTHREAD_POOL_SIZE=4',
            '-s SHARED_MEMORY=1',
        ] : []),
    ];

    const srcList = sources.map(s => `"${s}"`).join(' ');
    const cmd = `"${emcc}" ${srcList} ${flags.join(' ')} -o "${outJs}"`;

    // Strip any active Python virtualenv — emcc requires Python 3.10+ and a
    // venv on an older Python will cause "requires python 3.10 or above" errors.
    const procEnv = { ...process.env };
    delete procEnv.VIRTUAL_ENV;
    delete procEnv.VIRTUAL_ENV_PROMPT;
    if (procEnv.PATH) {
        procEnv.PATH = procEnv.PATH.split(':').filter(p => !p.includes('/.venv/')).join(':');
    }

    try {
        execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: procEnv });
    } catch (e) {
        throw new Error(`emcc compilation failed:\n${e.stderr || e.message}`);
    }
}
