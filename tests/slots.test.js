import { test, assert, assertEqual } from './harness.js';
import { spinPlan, REEL_IDS } from '../scripts/slots.js';

test('slots: three reels in a fixed order', () => {
  assertEqual(REEL_IDS, ['email', 'linkedin', 'cv'], 'reel ids');
});

test('slots: reels always land on the real targets, whatever the random seed', () => {
  const seeds = [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1];
  for (const seed of seeds) {
    const plan = spinPlan(() => seed);
    assertEqual(plan.map((r) => r.id), REEL_IDS, `landing for seed ${seed}`);
  }
});

test('slots: reels stop left to right', () => {
  const plan = spinPlan(() => 0.5);
  for (let i = 1; i < plan.length; i += 1) {
    assert(
      plan[i].stopMs > plan[i - 1].stopMs,
      `reel ${i} should stop after reel ${i - 1}`,
    );
  }
});

test('slots: every reel stops within two seconds', () => {
  const plan = spinPlan(() => 1);
  for (const reel of plan) {
    assert(reel.stopMs <= 2000, `stopMs ${reel.stopMs} is too slow`);
  }
});
