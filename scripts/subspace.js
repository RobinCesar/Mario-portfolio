import * as state from './state.js';

/** Pure: resolves the starting mode. Stored preference beats the OS setting. */
export function initialSubspace(stored, prefersDark) {
  if (typeof stored === 'boolean') return stored;
  return Boolean(prefersDark);
}

export function initSubspace(root = document, audio = { play() {} }) {
  const potion = root.querySelector('#potion');
  const hiddenCherry = root.querySelector('.cherry--subspace');
  const label = potion ? potion.querySelector('.potion__label') : null;

  function apply(on) {
    document.documentElement.setAttribute('data-subspace', on ? 'on' : 'off');
    if (potion) potion.setAttribute('aria-pressed', String(on));
    if (label) label.textContent = on ? 'Leave Subspace' : 'Throw potion';
    // Cherry #4 only exists in Subspace - the reward for finding the joke.
    if (hiddenCherry) hiddenCherry.hidden = !on;
  }

  state.subscribe('subspace', apply);
  apply(state.get('subspace'));

  if (potion) {
    potion.addEventListener('click', () => {
      state.set('subspace', !state.get('subspace'));
      audio.play('door');
    });
  }
}
