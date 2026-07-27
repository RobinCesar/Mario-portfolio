import { readFileSync } from 'node:fs';
import { test, assert } from './harness.js';

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');

function token(name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  assert(match, `token --${name} not found in tokens.css`);
  return match[1];
}

function channelToLinear(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = channelToLinear((n >> 16) & 255);
  const g = channelToLinear((n >> 8) & 255);
  const b = channelToLinear(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

test('contrast: body text on sand meets WCAG AA', () => {
  const ratio = contrast(token('ink'), token('sand'));
  assert(ratio >= 4.5, `--ink on --sand is ${ratio.toFixed(2)}:1, need 4.5`);
});

test('contrast: title screen text on open sky meets WCAG AA', () => {
  // The title section is full-bleed with no panel behind it, so its heading
  // and subtitle sit directly on --sky.
  const ratio = contrast(token('ink'), token('sky'));
  assert(ratio >= 4.5, `--ink on --sky is ${ratio.toFixed(2)}:1, need 4.5`);
});

test('contrast: text on raised inner cards meets WCAG AA', () => {
  // Boss card and education plaques use --panel-raised, not --sand.
  const ratio = contrast(token('ink'), token('panel-raised'));
  assert(ratio >= 4.5, `--ink on --panel-raised is ${ratio.toFixed(2)}:1, need 4.5`);
});

test('contrast: HUD text on its dark bar meets WCAG AA', () => {
  const ratio = contrast(token('paper'), token('ink'));
  assert(ratio >= 4.5, `--paper on --ink is ${ratio.toFixed(2)}:1, need 4.5`);
});

test('contrast: Subspace body text meets WCAG AA', () => {
  const ratio = contrast(token('paper'), token('subspace-bg'));
  assert(ratio >= 4.5, `--paper on --subspace-bg is ${ratio.toFixed(2)}:1, need 4.5`);
});

test('contrast: Subspace accent meets the 3:1 UI component floor', () => {
  const ratio = contrast(token('accent'), token('subspace-bg'));
  assert(ratio >= 3, `--accent on --subspace-bg is ${ratio.toFixed(2)}:1, need 3`);
});

test('contrast: accent is too dim for body text, so it must stay borders-only', () => {
  // Documents why --accent is never used as a text colour. If someone raises
  // its lightness enough to pass 4.5:1 this fails and the rule can be revisited.
  const ratio = contrast(token('accent'), token('subspace-bg'));
  assert(ratio < 4.5, 'accent now passes AA for text — update the spec rule');
});
