import { test, assert, assertEqual } from './harness.js';
import * as state from '../scripts/state.js';
import { addCherry, TOTAL_CHERRIES } from '../scripts/cherries.js';

test('cherries: there are five to find', () => {
  assertEqual(TOTAL_CHERRIES, 5, 'total');
});

test('cherries: collecting one records it', () => {
  state.reset();
  assertEqual(addCherry('a'), true, 'first collect succeeds');
  assertEqual(state.get('cherries'), ['a'], 'stored');
});

test('cherries: the same cherry cannot be counted twice', () => {
  state.reset();
  addCherry('a');
  assertEqual(addCherry('a'), false, 'duplicate rejected');
  assertEqual(state.get('cherries'), ['a'], 'still one');
});

test('cherries: Starman fires exactly at five', () => {
  state.reset();
  for (const id of ['a', 'b', 'c', 'd']) addCherry(id);
  assertEqual(state.get('starman'), false, 'not yet at four');
  addCherry('e');
  assertEqual(state.get('starman'), true, 'fired at five');
  assertEqual(state.get('cherries').length, 5, 'all five stored');
});

test('cherries: Starman does not re-fire on a duplicate after five', () => {
  state.reset();
  for (const id of ['a', 'b', 'c', 'd', 'e']) addCherry(id);
  let fires = 0;
  state.subscribe('starman', () => { fires += 1; });
  addCherry('a');
  assertEqual(fires, 0, 'no extra starman notification');
});

test('cherries: each collect awards a coin', () => {
  state.reset();
  addCherry('a');
  addCherry('b');
  assert(state.get('coins') >= 2, 'coins awarded');
});
