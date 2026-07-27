import { test, assertEqual } from './harness.js';
import { parallaxOffset } from '../scripts/parallax.js';

test('parallax: nothing moves at the top', () => {
  assertEqual(parallaxOffset(0, 0.5), 0, 'no scroll');
});

test('parallax: deeper layers move less', () => {
  const near = parallaxOffset(100, 0.5);
  const far = parallaxOffset(100, 0.1);
  assertEqual(near, 50, 'near layer');
  assertEqual(far, 10, 'far layer');
});

test('parallax: depth of zero pins a layer in place', () => {
  assertEqual(parallaxOffset(500, 0), 0, 'pinned layer');
});
