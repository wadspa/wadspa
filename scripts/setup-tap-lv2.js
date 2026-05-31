#!/usr/bin/env node
/**
 * Setup script for tap-lv2 — Tom's Audio Processing LV2 plugin collection.
 *
 * Each subdirectory is an independent LV2 plugin with its own manifest.ttl
 * and C source files. This script iterates all plugin dirs, copies sources
 * and TTL to plugins/tap-<name>/, patches manifest binary extension, and
 * registers each in lv2.json.
 */

import {
    copyFileSync, mkdirSync, writeFileSync, existsSync,
    readFileSync, readdirSync, statSync,
} from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { readLv2Registry, writeLv2Registry } from './lib/lv2-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, 'tap-lv2');

if (!existsSync(REPO)) {
    console.error(`Source not found: ${REPO} — run fetch-sources.js first`);
    process.exit(1);
}

const registry = readLv2Registry(ROOT);

// Subdirectories that are LV2 plugin directories (have manifest.ttl + .c source)
const pluginDirs = readdirSync(REPO).filter(name => {
    const dir = join(REPO, name);
    return statSync(dir).isDirectory()
        && existsSync(join(dir, 'manifest.ttl'))
        && readdirSync(dir).some(f => f.endsWith('.c'));
});

let succeeded = 0, failed = 0;

for (const dirName of pluginDirs) {
    const srcDir = join(REPO, dirName);
    const id     = `tap-${dirName}`;
    const out    = join(ROOT, 'plugins', id);
    mkdirSync(out, { recursive: true });

    // ── Copy all .c / .h files ────────────────────────────────────────────
    const sources = [];
    for (const f of readdirSync(srcDir)) {
        if (f.endsWith('.c') || f.endsWith('.h')) {
            copyFileSync(join(srcDir, f), join(out, f));
            if (f.endsWith('.c')) sources.push(f);
        }
    }
    // Copy shared TAP utilities (tap_utils.h, etc.) — used by most plugins
    const utilsDir = join(REPO, 'utils');
    if (existsSync(utilsDir)) {
        for (const f of readdirSync(utilsDir)) {
            if (f.endsWith('.h') || f.endsWith('.c')) {
                const dest = join(out, f);
                if (!existsSync(dest)) copyFileSync(join(utilsDir, f), dest);
            }
        }
    }

    if (sources.length === 0) {
        console.warn(`  ⚠ ${id} — no .c files found, skipping`);
        failed++;
        continue;
    }

    // ── Copy and patch TTL files ─────────────────────────────────────────
    for (const f of readdirSync(srcDir)) {
        if (!f.endsWith('.ttl') || f === 'modgui.ttl') continue;
        let ttl = readFileSync(join(srcDir, f), 'utf8');
        if (f === 'manifest.ttl') {
            // Replace .so with .wasm and strip modgui.ttl reference
            ttl = ttl
                .replace(/\.so>/g, '.wasm>')
                .replace(/,\s*<modgui\.ttl>/g, '')
                .replace(/<modgui\.ttl>,?\s*/g, '');
        }
        writeFileSync(join(out, f), ttl);
    }

    // ── Update lv2.json ──────────────────────────────────────────────────
    const entry = {
        id,
        description: `TAP ${dirName} (LV2)`,
        category: 'Effects',
        sources,
    };
    const existing = registry.findIndex(e => e.id === id);
    if (existing >= 0) registry[existing] = entry;
    else registry.push(entry);

    console.log(`  ✓ ${id} (${sources.join(', ')})`);
    succeeded++;
}

writeLv2Registry(ROOT, registry);
console.log(`\n✓ tap-lv2 setup: ${succeeded} plugins   ✗ ${failed} skipped`);
console.log('  Run: node scripts/build-instruments.js --only tap-reverb');
