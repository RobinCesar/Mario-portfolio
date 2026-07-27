import * as state from './state.js';

/**
 * Each sound is a short synthesized blip: a start frequency, an optional glide
 * target, and a duration in seconds. No audio files, so nothing to license.
 */
export const SOUNDS = {
  coin:   { type: 'square',   from: 988,  to: 1319, seconds: 0.12, gain: 0.15 },
  punch:  { type: 'square',   from: 220,  to: 110,  seconds: 0.08, gain: 0.2 },
  pull:   { type: 'triangle', from: 330,  to: 660,  seconds: 0.18, gain: 0.18 },
  door:   { type: 'square',   from: 440,  to: 220,  seconds: 0.22, gain: 0.16 },
  bobomb: { type: 'sawtooth', from: 160,  to: 40,   seconds: 0.35, gain: 0.22 },
  star:   { type: 'square',   from: 660,  to: 1320, seconds: 0.5,  gain: 0.18 },
  reel:   { type: 'square',   from: 880,  to: 880,  seconds: 0.06, gain: 0.12 },
};

export function createAudio(
  ContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext,
) {
  if (typeof ContextCtor !== 'function') {
    return { available: false, unlock: () => false, play: () => {} };
  }

  let context = null;
  let broken = false;

  function unlock() {
    if (broken) return false;
    try {
      if (!context) context = new ContextCtor();
      if (context.state === 'suspended') context.resume();
      return true;
    } catch {
      broken = true;
      return false;
    }
  }

  function play(name) {
    if (broken || !state.get('soundOn')) return;
    const sound = SOUNDS[name];
    if (!sound) return;
    if (!unlock()) return;

    try {
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.from, now);
      if (sound.to !== sound.from) {
        oscillator.frequency.exponentialRampToValueAtTime(sound.to, now + sound.seconds);
      }

      gain.gain.setValueAtTime(sound.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + sound.seconds);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + sound.seconds);
    } catch {
      broken = true;
    }
  }

  return { available: true, unlock, play };
}
