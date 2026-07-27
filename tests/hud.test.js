import { test, assertEqual } from './harness.js';
import { heartsForScroll } from '../scripts/hud.js';

test('hud: no hearts at the top of the page', () => {
  assertEqual(heartsForScroll(0), 0, 'fraction 0');
});

test('hud: hearts fill as the page scrolls', () => {
  assertEqual(heartsForScroll(0.34), 2, 'fraction 0.34');
  assertEqual(heartsForScroll(0.2), 1, 'fraction 0.2');
  assertEqual(heartsForScroll(0.7), 3, 'fraction 0.7');
});

test('hud: all three hearts at the bottom', () => {
  assertEqual(heartsForScroll(1), 3, 'fraction 1');
});

test('hud: out-of-range input is clamped', () => {
  assertEqual(heartsForScroll(-2), 0, 'negative fraction');
  assertEqual(heartsForScroll(5), 3, 'fraction above 1');
});
