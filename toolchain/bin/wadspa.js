#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, resolve, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { inspectPlugin } from '../src/inspect.js';
import { generateShim, exportedFunctions, generateProcessor } from '../src/shim.js';
import { generateLv2Shim, lv2ExportedFunctions, generateLv2Processor, parseLv2Ttl } from '../src/shim-lv2.js';
import { compilePlugin } from '../src/compile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function usage() {
    console.log(`
wadspa build <plugin-dir> [options]       Compile a LADSPA plugin to WASM
wadspa build-lv2 <plugin-dir> [options]  Compile an LV2 plugin to WASM

Options:
  --out <dir>        Output directory (default: <plugin-dir>/dist)
  --name <name>      npm package name (default: @wadspa/<label>)
  --include <dir>    Extra include directory (repeatable)
  --define <D>       Extra preprocessor define (repeatable)
  --sources <files>  Comma-separated .c/.cpp source files (build-lv2 only: default all in plugin-dir)
`);
    process.exit(1);
}

const args = process.argv.slice(2);
const cmd  = args[0];

if (cmd === 'build-lv2' && args[1]) {
    await buildLv2(args);
    process.exit(0);
}

if (args[0] !== 'build' || !args[1]) usage();

const pluginDir = resolve(args[1]);
if (!existsSync(pluginDir)) {
    console.error(`Plugin directory not found: ${pluginDir}`);
    process.exit(1);
}

// Parse flags
const opts = { includes: [], defines: [], sources: null, out: null, name: null };
for (let i = 2; i < args.length; i++) {
    if      (args[i] === '--out')     opts.out     = resolve(args[++i]);
    else if (args[i] === '--name')    opts.name    = args[++i];
    else if (args[i] === '--include') opts.includes.push(resolve(args[++i]));
    else if (args[i] === '--define')  opts.defines.push(args[++i]);
    else if (args[i] === '--sources') opts.sources = args[++i].split(',').map(s => resolve(pluginDir, s.trim()));
    else { console.error(`Unknown option: ${args[i]}`); usage(); }
}

const SHIM_NAMES = new Set(['shim.c', '_wadspa_shim.c']);

// Auto-detect sources (exclude any hand-written or generated shim files)
const sourceFiles = opts.sources ?? readdirSync(pluginDir)
    .filter(f => f.endsWith('.c') && !SHIM_NAMES.has(f))
    .map(f => join(pluginDir, f));

if (sourceFiles.length === 0) {
    console.error('No .c source files found. Use --sources to specify them.');
    process.exit(1);
}

// Step 1: inspect
console.log('→ Inspecting plugin...');
const descriptor = inspectPlugin(pluginDir, sourceFiles, [
    pluginDir,
    ...opts.includes,
]);
console.log(`  ${descriptor.name} (id=${descriptor.id}, ${descriptor.ports.length} ports)`);
descriptor.ports.forEach(p =>
    console.log(`  [${p.index}] ${p.dir} ${p.type.padEnd(7)} ${p.name}${p.type === 'control' ? ` (${p.min ?? '?'}..${p.max ?? '?'}, default=${p.default})` : ''}`)
);

// Step 2: generate shim
console.log('→ Generating shim.c...');
const shimSrc  = generateShim(descriptor);
const shimPath = join(pluginDir, '_wadspa_shim.c');
writeFileSync(shimPath, shimSrc);

// Step 3: compile
const outDir = opts.out ?? join(pluginDir, 'dist');
mkdirSync(outDir, { recursive: true });
const label      = descriptor.label;
const exportName = 'create' + label.replace(/[^a-zA-Z0-9]/g, '_') + 'Plugin';
const outJs      = join(outDir, label + '.js');

console.log('→ Compiling to WASM...');
compilePlugin({
    sources:      [...sourceFiles, shimPath],
    outJs,
    exportedFns:  exportedFunctions(descriptor),
    includeFlags: [pluginDir, ...opts.includes],
    defines:      opts.defines,
    exportName,
});
console.log(`  ${label}.js  (${Math.round(readFileSync(outJs).length / 1024)}KB)`);
console.log(`  ${label}.wasm  (${Math.round(readFileSync(outJs.replace('.js', '.wasm')).length / 1024)}KB)`);

// Step 4: emit package artifacts
const pkgName = opts.name ?? `@wadspa/${label}`;
const meta = {
    id:          descriptor.id,
    label:       descriptor.label,
    name:        descriptor.name,
    maker:       descriptor.maker,
    exportName,
    ports:       descriptor.ports,
};

// processor.js: static-import AudioWorklet processor (works in Chrome + Safari)
writeFileSync(join(outDir, 'processor.js'), generateProcessor(descriptor, label));

// index.js: re-exports the factory + exposes URLs for @wadspa/core
const indexJs = `\
export { default } from './${label}.js';
export const meta         = ${JSON.stringify(meta, null, 2)};
export const jsUrl        = new URL('./${label}.js',    import.meta.url).href;
export const wasmUrl      = new URL('./${label}.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',   import.meta.url).href;
`;
writeFileSync(join(outDir, 'index.js'), indexJs);

writeFileSync(join(outDir, 'package.json'), JSON.stringify({
    name:    pkgName,
    version: '0.1.0',
    type:    'module',
    main:    './index.js',
    exports: { '.': './index.js' },
}, null, 2));

console.log(`→ Package written to ${outDir}`);
console.log(`  ${pkgName}`);

// ─────────────────────────────────────────────────────────────────────────────
// build-lv2 subcommand
// ─────────────────────────────────────────────────────────────────────────────

async function buildLv2(args) {
    const pluginDir = resolve(args[1]);
    if (!existsSync(pluginDir)) {
        console.error(`Plugin directory not found: ${pluginDir}`);
        process.exit(1);
    }

    const lv2Opts = { includes: [], defines: [], sources: null, out: null, name: null };
    for (let i = 2; i < args.length; i++) {
        if      (args[i] === '--out')     lv2Opts.out     = resolve(args[++i]);
        else if (args[i] === '--name')    lv2Opts.name    = args[++i];
        else if (args[i] === '--include') lv2Opts.includes.push(resolve(args[++i]));
        else if (args[i] === '--define')  lv2Opts.defines.push(args[++i]);
        else if (args[i] === '--sources') lv2Opts.sources = args[++i].split(',').map(s => resolve(pluginDir, s.trim()));
        else { console.error(`Unknown option: ${args[i]}`); usage(); }
    }

    // Step 1: parse TTL
    console.log('→ Parsing LV2 manifest...');
    const lv2Desc = parseLv2Ttl(pluginDir);
    const lv2Label = lv2Desc.label.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    console.log(`  ${lv2Desc.label} (${lv2Desc.ports.length} ports)`);
    lv2Desc.ports.forEach(p =>
        console.log(`  [${p.index}] ${p.dir} ${p.type.padEnd(7)} ${p.name}`)
    );

    // Step 2: generate LV2 shim
    console.log('→ Generating LV2 shim.c...');
    const lv2ShimSrc  = generateLv2Shim(lv2Desc);
    const lv2ShimPath = join(pluginDir, '_wadspa_lv2_shim.c');
    writeFileSync(lv2ShimPath, lv2ShimSrc);

    // Step 3: compile
    const lv2OutDir = lv2Opts.out ?? join(pluginDir, 'dist');
    mkdirSync(lv2OutDir, { recursive: true });
    const lv2OutJs = join(lv2OutDir, lv2Label + '.js');

    const SHIM_NAMES_LV2 = new Set(['_wadspa_lv2_shim.c', '_wadspa_shim.c']);
    const lv2Sources = lv2Opts.sources ?? readdirSync(pluginDir)
        .filter(f => (f.endsWith('.c') || f.endsWith('.cpp')) && !SHIM_NAMES_LV2.has(f))
        .map(f => join(pluginDir, f));

    const lv2ExportName = 'create' + lv2Label + 'Plugin';

    console.log('→ Compiling LV2 plugin to WASM...');
    compilePlugin({
        sources:      [...lv2Sources, lv2ShimPath],
        outJs:        lv2OutJs,
        exportedFns:  lv2ExportedFunctions(lv2Desc),
        includeFlags: [pluginDir, ...lv2Opts.includes],
        defines:      lv2Opts.defines,
        exportName:   lv2ExportName,
    });
    console.log(`  ${lv2Label}.js   (${Math.round(readFileSync(lv2OutJs).length / 1024)}KB)`);
    console.log(`  ${lv2Label}.wasm (${Math.round(readFileSync(lv2OutJs.replace('.js', '.wasm')).length / 1024)}KB)`);

    // Step 4: emit package
    const lv2PkgName = lv2Opts.name ?? `@wadspa/${lv2Label.toLowerCase()}`;
    const lv2Meta = { uri: lv2Desc.uri, label: lv2Label, name: lv2Desc.label, exportName: lv2ExportName, ports: lv2Desc.ports };

    writeFileSync(join(lv2OutDir, 'processor.js'), generateLv2Processor(lv2Desc, lv2Label));

    const lv2IndexJs = `\
export { default } from './${lv2Label}.js';
export const meta         = ${JSON.stringify(lv2Meta, null, 2)};
export const wasmUrl      = new URL('./${lv2Label}.wasm',  import.meta.url).href;
export const processorUrl = new URL('./processor.js',      import.meta.url).href;
`;
    writeFileSync(join(lv2OutDir, 'index.js'), lv2IndexJs);
    writeFileSync(join(lv2OutDir, 'package.json'), JSON.stringify({
        name: lv2PkgName, version: '0.1.0', type: 'module',
        main: './index.js', exports: { '.': './index.js' },
    }, null, 2));

    console.log(`→ Package written to ${lv2OutDir}`);
    console.log(`  ${lv2PkgName}`);
}
