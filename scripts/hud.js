import * as state from './state.js';

export const TOTAL_HEARTS = 3;

/** Maps a 0-1 scroll fraction to a filled-heart count. Pure. */
export function heartsForScroll(fraction) {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  return Math.min(Math.ceil(clamped * TOTAL_HEARTS), TOTAL_HEARTS);
}

function scrollFraction() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return window.scrollY / scrollable;
}

export function initHud(root = document) {
  const hearts = [...root.querySelectorAll('.hud__hearts .sprite')];
  const coinCount = root.querySelector('.hud__coin-count');
  const cherryCount = root.querySelector('.hud__cherry-count');
  const soundToggle = root.querySelector('#sound-toggle');

  function paintHearts() {
    const filled = heartsForScroll(scrollFraction());
    hearts.forEach((heart, index) => {
      heart.style.opacity = index < filled ? '1' : '0.25';
    });
  }

  if (coinCount) {
    state.subscribe('coins', (value) => { coinCount.textContent = String(value); });
    coinCount.textContent = String(state.get('coins'));
  }

  if (cherryCount) {
    state.subscribe('cherries', (value) => { cherryCount.textContent = String(value.length); });
    cherryCount.textContent = String(state.get('cherries').length);
  }

  // The toggle is absent when the browser has no Web Audio support, so every
  // reference to it is guarded rather than assumed.
  if (soundToggle) {
    const paintToggle = (value) => {
      soundToggle.setAttribute('aria-pressed', String(value));
      soundToggle.textContent = value ? 'Sound: on' : 'Sound: off';
    };
    state.subscribe('soundOn', paintToggle);
    soundToggle.addEventListener('click', () => {
      state.set('soundOn', !state.get('soundOn'));
    });
    paintToggle(state.get('soundOn'));
  }

  window.addEventListener('scroll', paintHearts, { passive: true });
  window.addEventListener('resize', paintHearts, { passive: true });
  paintHearts();
}

/** Awards coins from anywhere in the app. */
export function addCoins(amount = 1) {
  state.set('coins', state.get('coins') + amount);
}
