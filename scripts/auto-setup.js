#!/usr/bin/env node
/**
 * auto-setup.js — Generic LV2-to-WASM setup for any plugin repo.
 *
 * Usage:
 *   node scripts/auto-setup.js <repo-dir> [options]
 *
 * Options:
 *   --id <id>          Plugin ID (defaults to repo directory name)
 *   --bundle <dir>     Specific bundle subdirectory to use (auto-detected otherwise)
 *   --dry-run          Print what would be done without building
 *   --max-attempts <n> Max compile retry attempts (default: 8)
 *
 * The script:
 *   1. Finds all manifest.ttl files in the repo
 *   2. Detects source files (from dir listing, CMakeLists, Makefile)
 *   3. Detects Qt usage → adds toolchain/qt-stub
 *   4. Iteratively retries compilation, applying fixes for each error class
 *   5. On success, copies bundle to plugins/<id>/ and registers in lv2.json
 */

import { execSync, spawnSync } from 'child_process';
import {
    existsSync, mkdirSync, readdirSync, readFileSync,
    writeFileSync, cpSync, statSync,
} from 'fs';
import { join, dirname, basename, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const QT_STUB   = join(ROOT, 'toolchain', 'qt-stub');

// ── CLI ───────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const repoArg   = args.find(a => !a.startsWith('--'));
const idArg     = args.includes('--id')          ? args[args.indexOf('--id') + 1]          : null;
const bundleArg = args.includes('--bundle')      ? args[args.indexOf('--bundle') + 1]      : null;
const dryRun    = args.includes('--dry-run');
const maxAttempts = args.includes('--max-attempts')
    ? parseInt(args[args.indexOf('--max-attempts') + 1], 10) : 8;

if (!repoArg) {
    console.error('Usage: node scripts/auto-setup.js <repo-dir> [--id <id>] [--dry-run]');
    process.exit(1);
}

const repoDir = resolve(repoArg);
if (!existsSync(repoDir)) {
    console.error(`Repo directory not found: ${repoDir}`);
    process.exit(1);
}

const pluginId = idArg || basename(repoDir).replace(/\.lv2$/, '').replace(/[^a-zA-Z0-9_-]/g, '-');
console.log(`\n── auto-setup: ${pluginId} ${'─'.repeat(Math.max(0, 44 - pluginId.length))}`);
console.log(`   repo:  ${repoDir}`);

// ── Step 1: Find manifest.ttl files ──────────────────────────────────────
function findFiles(dir, predicate, maxDepth = 5, depth = 0) {
    if (depth > maxDepth || !existsSync(dir)) return [];
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = join(dir, entry.name);
        if (entry.isFile() && predicate(entry.name, full)) results.push(full);
        else if (entry.isDirectory()) results.push(...findFiles(full, predicate, maxDepth, depth + 1));
    }
    return results;
}

// Also generate manifest.ttl from .ttl.in templates if needed
function resolveManifestTtlIn(templatePath) {
    const src = readFileSync(templatePath, 'utf8');
    // Replace build-system placeholders: @LIB_EXT@ → .wasm (wadspa uses a JS wrapper)
    // and @BUNDLE_PATH@ / @INSTALL_PREFIX@ → '.'
    const out = src
        .replace(/@LIB_EXT@/g, '.wasm')
        .replace(/@BUNDLE_PATH@/g, '.')
        .replace(/@INSTALL_PREFIX@/g, '.')
        .replace(/@[A-Z_]+@/g, '.');         // any remaining substitutions
    const dest = templatePath.replace(/\.in$/, '');
    writeFileSync(dest, out);
    return dest;
}

let manifests = bundleArg
    ? [join(repoDir, bundleArg, 'manifest.ttl')].filter(existsSync)
    : findFiles(repoDir, n => n === 'manifest.ttl');

// Fall back to .ttl.in templates
if (manifests.length === 0) {
    const templates = findFiles(repoDir, n => n === 'manifest.ttl.in');
    for (const t of templates) manifests.push(resolveManifestTtlIn(t));
}

if (manifests.length === 0) {
    console.error('   ✗ No manifest.ttl or manifest.ttl.in found in repo. Is this an LV2 plugin?');
    process.exit(1);
}

// Pick the best manifest: prefer the one with lv2:Plugin directly
function scoreManifest(path) {
    const src = readFileSync(path, 'utf8');
    if (/lv2:Plugin/.test(src) && /rdfs:seeAlso/.test(src)) return 2;
    if (/lv2:Plugin/.test(src)) return 1;
    return 0;
}
manifests.sort((a, b) => scoreManifest(b) - scoreManifest(a));
const manifestPath = manifests[0];
const bundleDir    = dirname(manifestPath);
console.log(`   bundle: ${relative(ROOT, bundleDir)}`);

// ── Step 2: Discover source files ────────────────────────────────────────

function isCpp(name) { return /\.(c|cc|cpp|cxx)$/i.test(name); }

// Check if a file can plausibly be a plugin source (not a test, demo, UI, standalone, tools)
const SKIP_PATTERNS = [
    /\btest\b/i, /\bdemo\b/i, /\bstandalone\b/i, /\bmain\b/i,
    /\bui\b/i,   /\bgui\b/i,  /\btools?\b/i,     /\bexample/i,
    /^pugl/i,    /^robtk/i,   /\bjack/i,          /\balsa/i,
];
function isSkippable(name) { return SKIP_PATTERNS.some(r => r.test(name)); }

// Read CMakeLists.txt to extract target sources
function parseCmakeSources(dir) {
    const cmakePath = join(dir, 'CMakeLists.txt');
    if (!existsSync(cmakePath)) return [];
    const src = readFileSync(cmakePath, 'utf8');
    const files = [];
    // Match add_library / add_executable source lists
    const blockRe = /(?:add_library|add_executable)\s*\([^)]+\s([\s\S]*?)\)/g;
    let m;
    while ((m = blockRe.exec(src)) !== null) {
        const tokens = m[1].split(/\s+/).filter(t => isCpp(t));
        files.push(...tokens);
    }
    return [...new Set(files)];
}

// Read Makefile to extract common source variables
function parseMakeSources(dir) {
    const mf = join(dir, 'Makefile');
    if (!existsSync(mf)) return [];
    const src = readFileSync(mf, 'utf8');
    const files = [];
    const varRe = /^(?:SRCS?|SOURCES?|OBJ|OBJECTS?)\s*[+:?]?=\s*(.*(?:\\\n.*)*)$/mg;
    let m;
    while ((m = varRe.exec(src)) !== null) {
        const val = m[1].replace(/\\\n/g, ' ');
        const tokens = val.split(/\s+/).map(t => t.replace(/\.o$/, '.c')).filter(isCpp);
        files.push(...tokens);
    }
    return [...new Set(files)];
}

// Collect all .c/.cpp in a directory (non-recursive)
function listCppInDir(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).filter(n => isCpp(n) && !isSkippable(n)).map(n => join(dir, n));
}

// Build candidate source list
function discoverSources(bundleDir, repoDir) {
    const candidates = new Set();

    // 1. CMake sources from bundle dir or repo root
    for (const d of [bundleDir, repoDir]) {
        for (const f of parseCmakeSources(d)) {
            const full = existsSync(join(bundleDir, f)) ? join(bundleDir, f)
                       : existsSync(join(repoDir, f))   ? join(repoDir, f) : null;
            if (full) candidates.add(full);
        }
    }

    // 2. Makefile sources from bundle dir
    for (const f of parseMakeSources(bundleDir)) {
        const full = join(bundleDir, f);
        if (existsSync(full)) candidates.add(full);
    }

    // 3. All .c/.cpp in bundle dir
    for (const f of listCppInDir(bundleDir)) candidates.add(f);

    // 4. If bundle dir != repo root, also check parent dirs up 2 levels
    let d = dirname(bundleDir);
    for (let i = 0; i < 2 && d !== repoDir && d !== dirname(repoDir); i++, d = dirname(d)) {
        for (const f of listCppInDir(d)) candidates.add(f);
    }

    // 5. If still empty, check repo root
    if (candidates.size === 0) {
        for (const f of listCppInDir(repoDir)) candidates.add(f);
    }

    // Filter: skip things that look like UI or standalone apps
    const filtered = [...candidates].filter(f => {
        const name = basename(f);
        return !isSkippable(name);
    });

    return filtered;
}

let sourcePaths = discoverSources(bundleDir, repoDir);
console.log(`   sources discovered: ${sourcePaths.length} files`);
for (const f of sourcePaths) console.log(`     ${relative(ROOT, f)}`);

if (sourcePaths.length === 0) {
    console.error('   ✗ No source files found. Add a setup script for this plugin.');
    process.exit(1);
}

// ── Step 3: Detect Qt usage ───────────────────────────────────────────────
function usesQt(files) {
    const qtRe = /^\s*#include\s+[<"]Q[A-Za-z]/m;
    return files.some(f => {
        try { return qtRe.test(readFileSync(f, 'utf8')); } catch { return false; }
    });
}

// Also scan headers in the same dirs
function collectHeaders(files) {
    const dirs = new Set(files.map(dirname));
    const headers = [];
    for (const d of dirs) {
        if (!existsSync(d)) continue;
        for (const n of readdirSync(d)) {
            if (/\.(h|hh|hpp|hxx)$/i.test(n)) headers.push(join(d, n));
        }
    }
    return headers;
}

const allSrcAndHeaders = [...sourcePaths, ...collectHeaders(sourcePaths)];
const needsQt = usesQt(allSrcAndHeaders);
if (needsQt) console.log('   Qt usage detected → will include toolchain/qt-stub');

// ── Step 4: Detect all include directories needed ─────────────────────────
function collectIncludeDirs(files) {
    const dirs = new Set();
    // Always include: bundle dir, repo root
    dirs.add(bundleDir);
    dirs.add(repoDir);
    // Include dirs one level below repo root (src/, include/, common/, etc.)
    for (const sub of readdirSync(repoDir, { withFileTypes: true })) {
        if (sub.isDirectory() && !sub.name.startsWith('.')) {
            const d = join(repoDir, sub.name);
            // Add if it contains header files
            if (readdirSync(d).some(n => /\.(h|hh|hpp)$/.test(n))) {
                dirs.add(d);
            }
        }
    }
    return [...dirs];
}

let includeDirs = collectIncludeDirs(sourcePaths);
if (needsQt) includeDirs = [QT_STUB, ...includeDirs];

// LV2 system headers
const LV2_INCLUDE = ['/opt/homebrew/include', '/usr/local/include', '/usr/include']
    .find(p => existsSync(join(p, 'lv2.h')));
if (LV2_INCLUDE) includeDirs.push(LV2_INCLUDE);

// ── Step 5: Set up plugin directory ──────────────────────────────────────
const pluginDir = join(ROOT, 'plugins', pluginId);
mkdirSync(pluginDir, { recursive: true });

// Copy all TTL files from bundle
for (const f of readdirSync(bundleDir)) {
    if (/\.ttl$/i.test(f)) {
        writeFileSync(join(pluginDir, f), readFileSync(join(bundleDir, f)));
    }
}
// Copy source files
for (const f of sourcePaths) {
    const dest = join(pluginDir, basename(f));
    writeFileSync(dest, readFileSync(f));
}
// Copy headers from all include dirs (those that are source dirs)
const headerDirs = new Set([bundleDir, repoDir, ...sourcePaths.map(dirname)]);
for (const d of headerDirs) {
    if (!existsSync(d)) continue;
    for (const n of readdirSync(d)) {
        if (/\.(h|hh|hpp|hxx)$/i.test(n)) {
            const dest = join(pluginDir, n);
            if (!existsSync(dest)) writeFileSync(dest, readFileSync(join(d, n)));
        }
    }
}

// ── Step 6: Iterative compilation with error fixing ───────────────────────
if (dryRun) {
    console.log('\n   [dry-run] Would attempt compilation with:');
    console.log(`   sources: ${sourcePaths.map(f => basename(f)).join(', ')}`);
    console.log(`   includes: ${includeDirs.join(', ')}`);
    process.exit(0);
}

function buildCmd(sources, includes, extraFlags = []) {
    const srcList = sources.map(f => basename(f)).join(',');
    const incFlags = includes.map(d => `--include "${d}"`).join(' ');
    const flags = extraFlags.join(' ');
    return `wadspa build-lv2 "${pluginDir}" --sources "${srcList}" ${incFlags} ${flags}`;
}

function tryCompile(sources, includes, extraFlags = []) {
    const cmd = buildCmd(sources, includes, extraFlags);
    const result = spawnSync('sh', ['-c', cmd], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    const output = (result.stdout || '') + (result.stderr || '');
    return { ok: result.status === 0, output };
}

// Parse error message to extract fix hints
function analyzeErrors(output) {
    const fixes = [];

    // Missing header file: 'fatal error: 'Foo.h' file not found'
    const missingHeaders = [...output.matchAll(/fatal error: '([^']+\.h[h]?)' file not found/g)]
        .map(m => m[1]);
    for (const h of missingHeaders) {
        // Search in repo for this header
        const found = findFiles(repoDir, n => n === h || n === basename(h));
        for (const f of found) {
            fixes.push({ type: 'add_include', dir: dirname(f) });
        }
    }

    // Undefined symbol: try adding more source files
    const undefinedSymbols = [...output.matchAll(/undefined symbol:\s+(\S+)/g)].map(m => m[1]);
    if (undefinedSymbols.length > 0) {
        fixes.push({ type: 'hint_undefined', symbols: undefinedSymbols });
    }

    // Qt-related error: add qt-stub if not already added
    if (/Q[A-Z][A-Za-z]+/.test(output) && !output.includes('qt-stub')) {
        fixes.push({ type: 'add_qt_stub' });
    }

    return fixes;
}

function applyFixes(fixes, sources, includes) {
    let changed = false;
    for (const fix of fixes) {
        if (fix.type === 'add_include' && !includes.includes(fix.dir)) {
            console.log(`   + include: ${fix.dir}`);
            includes.push(fix.dir);
            // Also copy any headers from the new dir into pluginDir
            for (const n of readdirSync(fix.dir)) {
                if (/\.(h|hh|hpp)$/i.test(n)) {
                    const dest = join(pluginDir, n);
                    if (!existsSync(dest)) writeFileSync(dest, readFileSync(join(fix.dir, n)));
                }
            }
            changed = true;
        }
        if (fix.type === 'add_qt_stub' && !includes.includes(QT_STUB)) {
            console.log(`   + Qt stub`);
            includes.unshift(QT_STUB);
            changed = true;
        }
    }
    return changed;
}

console.log('\n   Compiling...');
let currentSources = [...sourcePaths];
let currentIncludes = [...includeDirs];
let success = false;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { ok, output } = tryCompile(currentSources, currentIncludes);
    if (ok) {
        success = true;
        console.log(`   ✓ Compiled on attempt ${attempt}`);
        break;
    }

    // Show first error line
    const firstErr = output.split('\n').find(l => /error:/.test(l)) || '';
    console.log(`   ✗ Attempt ${attempt}: ${firstErr.trim().substring(0, 100)}`);

    if (attempt === maxAttempts) break;

    const fixes = analyzeErrors(output);
    if (fixes.length === 0) {
        // No auto-fixes available; dump the full error for diagnosis
        console.log('\n   Cannot auto-fix. Full error output:');
        console.log(output.split('\n').filter(l => /error:/.test(l)).slice(0, 20).join('\n'));
        break;
    }

    const changed = applyFixes(fixes, currentSources, currentIncludes);
    if (!changed) {
        console.log('   No new fixes available, stopping retries.');
        console.log(output.split('\n').filter(l => /error:/.test(l)).slice(0, 10).join('\n'));
        break;
    }
}

if (!success) {
    console.error(`\n   ✗ auto-setup failed for ${pluginId}. Manual setup script required.`);
    console.error(`   See: ${relative(ROOT, pluginDir)}`);
    process.exit(1);
}

// ── Step 7: Register in lv2.json ─────────────────────────────────────────
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const registry = readLv2Registry(ROOT);
const existing = registry.findIndex(e => e.id === pluginId);

// Parse the manifest to get a description
let description = pluginId;
try {
    const ttl = readFileSync(join(pluginDir, 'manifest.ttl'), 'utf8');
    const nameMatch = ttl.match(/doap:name\s+"([^"]+)"/);
    if (nameMatch) description = nameMatch[1];
} catch {}

const entry = {
    id: pluginId,
    description,
    category: 'Instruments',
    ...(needsQt ? { includes: ['toolchain/qt-stub'] } : {}),
    sources: currentSources.map(f => basename(f)),
};

if (existing >= 0) {
    registry[existing] = entry;
    console.log(`\n   ✓ Updated lv2.json entry for ${pluginId}`);
} else {
    registry.push(entry);
    console.log(`\n   ✓ Added lv2.json entry for ${pluginId}`);
}
writeLv2Registry(ROOT, registry);

console.log(`\n   Done. Plugin dist: ${relative(ROOT, join(pluginDir, 'dist'))}`);
