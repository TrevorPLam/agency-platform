#!/usr/bin/env node
/**
 * Rule sync check: ensures .cursor/rules/ and .windsurf/rules/ have the same
 * set of rule names (by basename). Exits 0 if in sync, 1 and prints diffs if not.
 * No dependencies; uses Node built-in fs and path.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CURSOR_DIR = path.join(ROOT, '.cursor', 'rules');
const WINDSURF_DIR = path.join(ROOT, '.windsurf', 'rules');

function getRuleNames(dir, ext) {
  if (!fs.existsSync(dir)) return new Set();
  return new Set(
    fs.readdirSync(dir)
      .filter((f) => f.endsWith(ext))
      .map((f) => path.basename(f, ext))
  );
}

const cursorNames = getRuleNames(CURSOR_DIR, '.mdc');
const windsurfNames = getRuleNames(WINDSURF_DIR, '.md');

const onlyCursor = [...cursorNames].filter((n) => !windsurfNames.has(n)).sort();
const onlyWindsurf = [...windsurfNames].filter((n) => !cursorNames.has(n)).sort();

if (onlyCursor.length === 0 && onlyWindsurf.length === 0) {
  console.log('OK: .cursor/rules and .windsurf/rules have the same 69 rule names.');
  process.exit(0);
}

console.error('Rule name parity check failed.\n');
if (onlyCursor.length) {
  console.error('Only in .cursor/rules/:', onlyCursor.join(', '));
}
if (onlyWindsurf.length) {
  console.error('Only in .windsurf/rules/:', onlyWindsurf.join(', '));
}
process.exit(1);
