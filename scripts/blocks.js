import { addCoins } from './hud.js';
import { DOOR_CHIME, DOOR_CHIME_BEAT } from './audio.js';

export const CHERRY_PUNCH_THRESHOLD = 3;

/** Pure: the sprite a door shows in each state. */
export function doorSpriteId(open) {
  return open ? 'sprite-door-open' : 'sprite-door';
}

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

export function initDoors(root = document, audio = { play() {}, playSequence() {} }) {
  for (const door of root.querySelectorAll('.door')) {
    const panel = root.querySelector(`#${door.getAttribute('aria-controls')}`);
    if (!panel) continue;
    panel.hidden = true;
    const use = door.querySelector('.sprite use');

    door.addEventListener('click', () => {
      const nowOpen = door.getAttribute('aria-expanded') !== 'true';
      door.setAttribute('aria-expanded', String(nowOpen));
      panel.hidden = !nowOpen;
      // The class drives the swing; the sprite swap is what is behind it.
      door.classList.toggle('door--open', nowOpen);
      if (use) use.setAttribute('href', `assets/sprites.svg#${doorSpriteId(nowOpen)}`);

      if (!nowOpen) {
        audio.play('doorShut');
        return;
      }

      // Re-running the reveal needs the animation cleared and a reflow forced,
      // or a door opened a second time would just snap its panel into place.
      panel.style.animation = 'none';
      void panel.offsetWidth;
      panel.style.animation = '';

      audio.play('door');
      audio.playSequence?.(DOOR_CHIME, DOOR_CHIME_BEAT);
      addCoins(1);
    });
  }
}
