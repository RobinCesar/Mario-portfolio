import { test, assertEqual } from './harness.js';
import { pullProgress, isPulled, PULL_THRESHOLD_PX } from '../scripts/veggies.js';

test('veggies: dragging downward does not pull', () => {
  assertEqual(pullProgress(100, 140), 0, 'downward drag');
  assertEqual(pullProgress(100, 100), 0, 'no movement');
});

test('veggies: dragging upward accumulates progress', () => {
  // Screen Y decreases as the pointer moves up.
  assertEqual(pullProgress(100, 100 - PULL_THRESHOLD_PX / 2), 0.5, 'half pull');
});

test('veggies: reaching the threshold completes the pull', () => {
  assertEqual(pullProgress(100, 100 - PULL_THRESHOLD_PX), 1, 'full pull');
});

test('veggies: progress is clamped at 1', () => {
  assertEqual(pullProgress(100, -500), 1, 'over-pull clamped');
});

test('veggies: isPulled only at full progress', () => {
  assertEqual(isPulled(0.99), false, 'not quite');
  assertEqual(isPulled(1), true, 'complete');
});
