import { test, assertEqual } from './harness.js';
import * as state from '../scripts/state.js';

test('state: returns defaults', () => {
  state.reset();
  assertEqual(state.get('coins'), 0, 'coins default');
  assertEqual(state.get('cherries'), [], 'cherries default');
  assertEqual(state.get('soundOn'), true, 'sound is on by default');
  assertEqual(state.get('starman'), false, 'starman default');
});

test('state: set updates the value', () => {
  state.reset();
  state.set('coins', 3);
  assertEqual(state.get('coins'), 3, 'coins after set');
});

test('state: subscribe fires on change', () => {
  state.reset();
  const seen = [];
  state.subscribe('coins', (value) => seen.push(value));
  state.set('coins', 1);
  state.set('coins', 2);
  assertEqual(seen, [1, 2], 'listener received both changes');
});

test('state: setting the same value does not notify', () => {
  state.reset();
  const seen = [];
  state.subscribe('coins', (value) => seen.push(value));
  state.set('coins', 1);
  state.set('coins', 1);
  assertEqual(seen, [1], 'no duplicate notification');
});

test('state: unsubscribe stops delivery', () => {
  state.reset();
  const seen = [];
  const off = state.subscribe('coins', (value) => seen.push(value));
  state.set('coins', 1);
  off();
  state.set('coins', 2);
  assertEqual(seen, [1], 'no delivery after unsubscribe');
});

test('state: listeners are isolated per key', () => {
  state.reset();
  const seen = [];
  state.subscribe('coins', (value) => seen.push(value));
  state.set('starman', true);
  assertEqual(seen, [], 'coins listener not called for starman');
});

test('state: reset clears listeners', () => {
  state.reset();
  const seen = [];
  state.subscribe('coins', (value) => seen.push(value));
  state.reset();
  state.set('coins', 5);
  assertEqual(seen, [], 'listener removed by reset');
});

// These tests run in Node (no localStorage) and in the browser (real, and
// possibly holding values from a previous visit to index.html on this origin),
// so they clear storage rather than assume its state.
function clearStorage() {
  try {
    localStorage.removeItem('mario-portfolio');
    return true;
  } catch {
    return false;
  }
}

test('state: hydrate distinguishes "stored false" from "never stored"', () => {
  // Regression guard. get() always returns a default, so boot cannot use it to
  // detect a first-time visitor — it would read false and skip the OS colour
  // scheme entirely. hydrate must report only what storage actually held.
  clearStorage();
  state.reset();
  const restored = state.hydrate();
  assertEqual(
    Object.prototype.hasOwnProperty.call(restored, 'subspace'),
    false,
    'nothing restored when storage is empty',
  );
  assertEqual(restored.subspace, undefined, 'absent key reads undefined');
});

test('state: hydrate reports a stored false as present, not missing', () => {
  const hasStorage = clearStorage();
  state.reset();
  // set() short-circuits on an unchanged value, so flip to true and back to
  // land an explicit false in storage.
  state.set('subspace', true);
  state.set('subspace', false);
  state.reset();
  const restored = state.hydrate();

  if (hasStorage) {
    assertEqual(restored.subspace, false, 'stored false round-trips');
  } else {
    // Node has no localStorage, so nothing persists and nothing is restored.
    assertEqual(restored.subspace, undefined, 'no persistence without storage');
  }
  clearStorage();
});

test('state: arrays replace by reference so cherries notify', () => {
  state.reset();
  const seen = [];
  state.subscribe('cherries', (value) => seen.push(value));
  state.set('cherries', ['a']);
  state.set('cherries', ['a', 'b']);
  assertEqual(seen, [['a'], ['a', 'b']], 'both array updates delivered');
});
