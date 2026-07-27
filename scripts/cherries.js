import * as state from './state.js';
import { addCoins } from './hud.js';

export const TOTAL_CHERRIES = 5;
export const STARMAN_MS = 8000;

/** Records a cherry. Returns false if it was already found. */
export function addCherry(id) {
  const found = state.get('cherries');
  if (found.includes(id)) return false;

  const next = [...found, id];
  state.set('cherries', next);
  addCoins(1);

  if (next.length === TOTAL_CHERRIES) state.set('starman', true);
  return true;
}

export function initCherries(root = document, audio = { play() {} }) {
  for (const button of root.querySelectorAll('.cherry')) {
    button.addEventListener('click', () => {
      const id = button.dataset.cherryId;
      if (!id) return;
      if (!addCherry(id)) return;
      audio.play('coin');
      button.hidden = true;
    });
  }

  state.subscribe('starman', (on) => {
    if (!on) return;
    audio.play('star');
    startStarman();
  });
}

function startStarman() {
  const banner = document.createElement('p');
  banner.className = 'starman-banner';
  banner.setAttribute('role', 'status');

  const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  star.setAttribute('class', 'sprite');
  star.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', 'assets/sprites.svg#sprite-star');
  star.append(use);

  banner.append(star, ' All five cherries found — Star Power!');
  document.body.append(banner);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.setAttribute('data-starman', reduced ? 'static' : 'on');

  // One timer owns the whole effect: it clears the visuals and the state flag.
  window.setTimeout(() => {
    document.documentElement.removeAttribute('data-starman');
    banner.remove();
    state.set('starman', false);
  }, STARMAN_MS);
}
