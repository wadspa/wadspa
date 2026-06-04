#!/usr/bin/env node
/**
 * Backwards-compatible alias for the control influence test.
 *
 * Usage:
 *   node scripts/test-controls.js [--only <id>] [--verbose]
 */

await import('./test-sliders.js');
