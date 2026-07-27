import { test, assertEqual } from './harness.js';
import { initialSubspace } from '../scripts/subspace.js';

test('subspace: a stored preference wins over the system setting', () => {
  assertEqual(initialSubspace(true, false), true, 'stored on, system light');
  assertEqual(initialSubspace(false, true), false, 'stored off, system dark');
});

test('subspace: with no stored preference the system setting decides', () => {
  assertEqual(initialSubspace(undefined, true), true, 'system dark');
  assertEqual(initialSubspace(undefined, false), false, 'system light');
});

test('subspace: non-boolean stored values are ignored', () => {
  assertEqual(initialSubspace(null, true), true, 'null stored');
  assertEqual(initialSubspace('yes', false), false, 'string stored');
});
