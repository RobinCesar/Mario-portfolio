import { test, assert, assertEqual } from './harness.js';
import { createAudio, SOUNDS } from '../scripts/audio.js';
import * as state from '../scripts/state.js';

function fakeContextFactory(started) {
  return function FakeContext() {
    return {
      state: 'running',
      currentTime: 0,
      destination: {},
      resume() {},
      createOscillator() {
        return {
          type: 'square',
          frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {},
          start() { started.push(true); },
          stop() {},
        };
      },
      createGain() {
        return {
          gain: {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
            linearRampToValueAtTime() {},
          },
          connect() {},
        };
      },
    };
  };
}

// null rather than undefined: passing undefined would trigger the default
// parameter and pick up the real AudioContext when these run in a browser.
test('audio: reports unavailable when the browser has no AudioContext', () => {
  const audio = createAudio(null);
  assertEqual(audio.available, false, 'available flag');
});

test('audio: play is a safe no-op when unavailable', () => {
  const audio = createAudio(null);
  audio.play('coin');
  audio.unlock();
  assert(true, 'no exception thrown');
});

test('audio: reports unavailable when constructing the context throws', () => {
  function ThrowingContext() { throw new Error('blocked by policy'); }
  const audio = createAudio(ThrowingContext);
  assertEqual(audio.unlock(), false, 'unlock reports failure');
  audio.play('coin');
  assert(true, 'play did not throw after a failed unlock');
});

test('audio: creates an oscillator per sound once unlocked', () => {
  state.reset();
  state.set('soundOn', true);
  const started = [];
  const audio = createAudio(fakeContextFactory(started));
  assertEqual(audio.unlock(), true, 'unlock succeeded');
  audio.play('coin');
  assertEqual(started.length, 1, 'one oscillator started');
});

test('audio: stays silent while sound is toggled off', () => {
  state.reset();
  state.set('soundOn', false);
  const started = [];
  const audio = createAudio(fakeContextFactory(started));
  audio.unlock();
  audio.play('coin');
  assertEqual(started.length, 0, 'nothing played while muted');
});

test('audio: unknown sound names are ignored', () => {
  state.reset();
  state.set('soundOn', true);
  const started = [];
  const audio = createAudio(fakeContextFactory(started));
  audio.unlock();
  audio.play('not-a-real-sound');
  assertEqual(started.length, 0, 'nothing started');
});

test('audio: every named sound has a definition', () => {
  for (const name of ['coin', 'punch', 'pull', 'door', 'bobomb', 'star', 'reel']) {
    assert(SOUNDS[name], `missing sound definition: ${name}`);
  }
});
