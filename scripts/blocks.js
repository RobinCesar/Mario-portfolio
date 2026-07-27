import { addCoins } from './hud.js';

export const CHERRY_PUNCH_THRESHOLD = 3;

/** Pure: the next punch tally. */
export function punchCount(current) {
  return current + 1;
}

export function initBlocks(root = document, audio = { play() {} }) {
  for (const block of root.querySelectorAll('.qblock')) {
    let punches = 0;
    const reveal = block.parentElement.querySelector('.qblock__reveal');
    const cherry = block.parentElement.querySelector('.cherry');

    block.addEventListener('click', () => {
      punches = punchCount(punches);
      audio.play('punch');
      addCoins(1);

      block.style.animation = 'none';
      // Force a reflow so the animation restarts on every click.
      void block.offsetWidth;
      block.style.animation = 'block-punch 220ms steps(3)';

      if (reveal) reveal.hidden = false;
      if (cherry && punches >= CHERRY_PUNCH_THRESHOLD) cherry.hidden = false;
    });
  }
}

export function initDoors(root = document, audio = { play() {} }) {
  for (const door of root.querySelectorAll('.door')) {
    const panel = root.querySelector(`#${door.getAttribute('aria-controls')}`);
    if (!panel) continue;
    panel.hidden = true;

    door.addEventListener('click', () => {
      const open = door.getAttribute('aria-expanded') === 'true';
      door.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      if (!open) {
        audio.play('door');
        addCoins(1);
      }
    });
  }
}
