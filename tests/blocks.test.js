import { test, assertEqual } from './harness.js';
import { punchCount, doorSpriteId, CHERRY_PUNCH_THRESHOLD } from '../scripts/blocks.js';

test('blocks: punches accumulate', () => {
  assertEqual(punchCount(0), 1, 'first punch');
  assertEqual(punchCount(1), 2, 'second punch');
});

test('blocks: the cherry appears on the third punch', () => {
  assertEqual(CHERRY_PUNCH_THRESHOLD, 3, 'threshold');
  assertEqual(punchCount(2), CHERRY_PUNCH_THRESHOLD, 'third punch hits threshold');
});

test('blocks: punching past the threshold keeps counting without error', () => {
  assertEqual(punchCount(9), 10, 'tenth punch');
});

test('doors: the sprite tracks the open state', () => {
  assertEqual(doorSpriteId(true), 'sprite-door-open', 'open door');
  assertEqual(doorSpriteId(false), 'sprite-door', 'shut door');
});
