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

test('sprites: no unused symbols accumulate', () => {
  const referenced = referencedIds();
  // Shy Guy is injected by parallax.js and Star by the cherries.js Starman
  // banner, so neither appears in the static markup. Anything else unused is
  // dead weight and should be deleted.
  const runtimeOnly = new Set(['sprite-shyguy', 'sprite-star']);
  for (const id of definedIds()) {
    assert(
      referenced.has(id) || runtimeOnly.has(id),
      `sprites.svg defines unused symbol #${id}`,
    );
  }
});

test('sprites: runtime-injected symbols really are referenced by a script', () => {
  // Guards the whitelist above from becoming a dumping ground.
  for (const [id, file] of [
    ['sprite-shyguy', 'scripts/parallax.js'],
    ['sprite-star', 'scripts/cherries.js'],
  ]) {
    const source = readFileSync(new URL(file, base), 'utf8');
    assert(source.includes(`#${id}`), `${file} no longer references #${id}`);
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
