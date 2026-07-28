import { START_JINGLE } from './audio.js';

export const INTRO_MS = 1500;

export function initTitleScreen(root = document, audio = { play() {}, playSequence() {} }, player = null) {
  const button = root.querySelector('.press-start');
  const title = root.querySelector('#title');
  if (!button || !title) return;

  let started = false;

  button.addEventListener('click', (event) => {
    event.preventDefault();
    if (started) return;
    started = true;

    // The gesture that starts the game is also what unlocks Web Audio.
    audio.unlock?.();
    audio.playSequence(START_JINGLE);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.setAttribute('data-intro', reduced ? 'instant' : 'on');

    const settle = reduced ? 0 : INTRO_MS;
    window.setTimeout(() => {
      document.documentElement.removeAttribute('data-intro');
      document.documentElement.setAttribute('data-started', 'on');
      button.textContent = 'Playing — A/D walk, W/S scroll, Space jumps, E uses';
      button.setAttribute('aria-disabled', 'true');
      // Hand focus back to the document so the arrow keys reach the player
      // instead of sitting on the link that started the game.
      button.blur();
      if (player) player.start();
      root.querySelector('#about')?.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'start',
      });
    }, settle);
  });
}
