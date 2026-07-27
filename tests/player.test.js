import { test, assert, assertEqual } from './harness.js';
import {
  stepPhysics, frameFor, overlaps, reachBox,
  GRAVITY, JUMP_VELOCITY, MOVE_SPEED, PLAYER_W, EDGE_MARGIN,
  REACH_UP, REACH_SIDE,
} from '../scripts/player.js';

const BOUNDS = { width: 1000 };
const IDLE = { left: false, right: false, jump: false, action: false };

// 400 sits inside the free-movement zone for a 1000px viewport, which spans
// [80, 876]. Outside it, movement converts to page scroll instead.
const START_X = 400;

function spawn(overrides = {}) {
  return { x: START_X, y: 0, vx: 0, vy: 0, grounded: true, facing: 1, ...overrides };
}

test('player: stands still with no input', () => {
  const next = stepPhysics(spawn(), IDLE, BOUNDS);
  assertEqual(next.x, START_X, 'x unchanged');
  assertEqual(next.y, 0, 'stays on the ground');
  assertEqual(next.grounded, true, 'still grounded');
});

test('player: walks right and left at move speed', () => {
  const right = stepPhysics(spawn(), { ...IDLE, right: true }, BOUNDS);
  assertEqual(right.x, START_X + MOVE_SPEED, 'moved right');
  assertEqual(right.facing, 1, 'faces right');

  const left = stepPhysics(spawn(), { ...IDLE, left: true }, BOUNDS);
  assertEqual(left.x, START_X - MOVE_SPEED, 'moved left');
  assertEqual(left.facing, -1, 'faces left');
});

test('player: holding both directions cancels out', () => {
  const next = stepPhysics(spawn(), { ...IDLE, left: true, right: true }, BOUNDS);
  assertEqual(next.x, START_X, 'no movement');
});

test('player: jumping leaves the ground and gravity brings it back', () => {
  let p = stepPhysics(spawn(), { ...IDLE, jump: true }, BOUNDS);
  assertEqual(p.grounded, false, 'airborne');
  assert(p.y > 0, `rose off the ground, y=${p.y}`);

  // Run the arc out; it must land rather than drift forever.
  let steps = 0;
  while (!p.grounded && steps < 500) {
    p = stepPhysics(p, IDLE, BOUNDS);
    steps += 1;
  }
  assertEqual(p.grounded, true, `landed after ${steps} steps`);
  assertEqual(p.y, 0, 'back on the ground');
  assert(steps < 200, `landed in reasonable time, took ${steps}`);
});

test('player: cannot double jump while airborne', () => {
  const airborne = spawn({ grounded: false, vy: -4, y: 30 });
  const next = stepPhysics(airborne, { ...IDLE, jump: true }, BOUNDS);
  assert(next.vy > airborne.vy, 'gravity applied, no new jump impulse');
  assert(next.vy !== JUMP_VELOCITY + GRAVITY, 'jump velocity was not reapplied');
});

test('player: walking into the right edge scrolls the page instead', () => {
  const rightEdge = BOUNDS.width * (1 - EDGE_MARGIN) - PLAYER_W;
  const next = stepPhysics(spawn({ x: rightEdge }), { ...IDLE, right: true }, BOUNDS);
  assert(next.scroll > 0, `page scrolls down, got ${next.scroll}`);
  assertEqual(next.x, rightEdge, 'character pinned at the edge');
});

test('player: walking into the left edge scrolls back up', () => {
  const leftEdge = BOUNDS.width * EDGE_MARGIN;
  const next = stepPhysics(spawn({ x: leftEdge }), { ...IDLE, left: true }, BOUNDS);
  assert(next.scroll < 0, `page scrolls up, got ${next.scroll}`);
  assertEqual(next.x, leftEdge, 'character pinned at the edge');
});

test('player: does not scroll while standing still at an edge', () => {
  const rightEdge = BOUNDS.width * (1 - EDGE_MARGIN) - PLAYER_W;
  const next = stepPhysics(spawn({ x: rightEdge }), IDLE, BOUNDS);
  assertEqual(next.scroll, 0, 'no scroll without input');
});

test('player: the free-movement zone covers most of the viewport', () => {
  // Regression guard. A wide edge margin left page elements permanently out of
  // horizontal reach, so no interaction could be triggered by playing.
  const free = BOUNDS.width * (1 - 2 * EDGE_MARGIN);
  assert(
    free / BOUNDS.width >= 0.8,
    `free zone is only ${Math.round((free / BOUNDS.width) * 100)}% of the viewport`,
  );
});

test('player: never leaves the viewport', () => {
  const far = stepPhysics(spawn({ x: -500 }), IDLE, BOUNDS);
  assert(far.x >= 0, `clamped to the left, got ${far.x}`);
  const wide = stepPhysics(spawn({ x: 99999 }), IDLE, BOUNDS);
  assert(wide.x <= BOUNDS.width, `clamped to the right, got ${wide.x}`);
});

test('player: animation frame follows the motion state', () => {
  assertEqual(frameFor(spawn(), 0), 'sprite-player-idle', 'standing');
  assertEqual(
    frameFor(spawn({ grounded: false }), 0),
    'sprite-player-jump',
    'airborne',
  );
  assertEqual(
    frameFor(spawn({ vx: MOVE_SPEED }), 0),
    'sprite-player-walk-a',
    'walking, even tick',
  );
  assertEqual(
    frameFor(spawn({ vx: MOVE_SPEED }), 1),
    'sprite-player-walk-b',
    'walking, odd tick',
  );
});

test('player: interaction reach extends up and sideways, not down', () => {
  const body = { left: 100, right: 144, top: 700, bottom: 755 };
  const reach = reachBox(body);
  assertEqual(reach.left, 100 - REACH_SIDE, 'reaches left');
  assertEqual(reach.right, 144 + REACH_SIDE, 'reaches right');
  assertEqual(reach.top, 700 - REACH_UP, 'reaches upward');
  assert(reach.bottom <= body.bottom + 16, 'barely reaches below the feet');
});

test('player: reach connects with an element overhead that the body misses', () => {
  // The case that made every interaction fail in the browser: page elements
  // sweep through the play band, and a 44x55 hitbox alone never catches them.
  const body = { left: 100, right: 144, top: 700, bottom: 755 };
  const overhead = { left: 110, right: 150, top: 640, bottom: 680 };
  assertEqual(overlaps(body, overhead), false, 'body alone misses it');
  assertEqual(overlaps(reachBox(body), overhead), true, 'reach catches it');
});

test('player: reach does not catch something far above', () => {
  const body = { left: 100, right: 144, top: 700, bottom: 755 };
  const wayUp = { left: 110, right: 150, top: 200, bottom: 260 };
  assertEqual(overlaps(reachBox(body), wayUp), false, 'out of range');
});

test('player: overlap detection is exclusive at the edges', () => {
  const a = { left: 0, right: 10, top: 0, bottom: 10 };
  assertEqual(overlaps(a, { left: 5, right: 15, top: 5, bottom: 15 }), true, 'overlapping');
  assertEqual(overlaps(a, { left: 10, right: 20, top: 0, bottom: 10 }), false, 'touching edges');
  assertEqual(overlaps(a, { left: 20, right: 30, top: 0, bottom: 10 }), false, 'apart');
  assertEqual(overlaps(a, { left: 0, right: 10, top: 20, bottom: 30 }), false, 'below');
});
