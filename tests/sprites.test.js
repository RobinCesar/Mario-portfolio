import { readFileSync } from 'node:fs';
import { test, assert } from './harness.js';

const base = new URL('../', import.meta.url);
const svg = readFileSync(new URL('assets/sprites.svg', base), 'utf8');
const html = readFileSync(new URL('index.html', base), 'utf8');

function definedIds() {
  const ids = new Set();
  for (const match of svg.matchAll(/<symbol[^>]*\sid="([^"]+)"/g)) ids.add(match[1]);
  return ids;
}

function referencedIds() {
  const ids = new Set();
  for (const match of html.matchAll(/href="assets\/sprites\.svg#([^"]+)"/g)) ids.add(match[1]);
  return ids;
}

test('sprites: every id referenced by index.html is defined', () => {
  const defined = definedIds();
  const referenced = referencedIds();
  assert(referenced.size > 0, 'no sprite references found in index.html');
  for (const id of referenced) {
    assert(defined.has(id), `sprites.svg is missing symbol #${id}`);
  }
});

// Symbols swapped in at runtime rather than written into the markup. Each one
// is verified against its owning script below, so this cannot become a dumping
// ground for art nothing uses.
const RUNTIME_ONLY = {
  'sprite-shyguy': 'scripts/parallax.js',
  'sprite-star': 'scripts/cherries.js',
  'sprite-player-walk-a': 'scripts/player.js',
  'sprite-player-walk-b': 'scripts/player.js',
  'sprite-player-jump': 'scripts/player.js',
};

test('sprites: no unused symbols accumulate', () => {
  const referenced = referencedIds();
  for (const id of definedIds()) {
    assert(
      referenced.has(id) || id in RUNTIME_ONLY,
      `sprites.svg defines unused symbol #${id}`,
    );
  }
});

test('sprites: runtime-injected symbols really are referenced by a script', () => {
  for (const [id, file] of Object.entries(RUNTIME_ONLY)) {
    const source = readFileSync(new URL(file, base), 'utf8');
    // player.js builds its frame ids from frameFor(), so accept either a
    // literal reference or the bare frame name appearing in the source.
    assert(
      source.includes(`#${id}`) || source.includes(`'${id}'`),
      `${file} no longer references ${id}`,
    );
  }
});

test('sprites: the player has all four animation frames', () => {
  const defined = definedIds();
  for (const frame of ['idle', 'walk-a', 'walk-b', 'jump']) {
    assert(defined.has(`sprite-player-${frame}`), `missing player frame: ${frame}`);
  }
});

test('sprites: art renders with hard pixel edges', () => {
  const symbols = svg.match(/<symbol[\s\S]*?<\/symbol>/g) || [];
  assert(symbols.length >= 12, `expected at least 12 symbols, found ${symbols.length}`);
  for (const symbol of symbols) {
    assert(
      symbol.includes('shape-rendering="crispEdges"'),
      'a symbol is missing shape-rendering="crispEdges"',
    );
  }
});
