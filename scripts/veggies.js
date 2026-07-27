import { addCoins } from './hud.js';

export const PULL_THRESHOLD_PX = 60;

/** Pure: how far along a pull is, 0-1. Upward movement decreases screen Y. */
export function pullProgress(startY, currentY) {
  const delta = startY - currentY;
  if (delta <= 0) return 0;
  return Math.min(delta / PULL_THRESHOLD_PX, 1);
}

export function isPulled(progress) {
  return progress >= 1;
}

export function initVeggies(root = document, audio = { play() {} }) {
  for (const sprout of root.querySelectorAll('.sprout')) {
    const detail = sprout.parentElement.querySelector('.sprout__detail');
    const isBobomb = sprout.classList.contains('sprout--bobomb');
    let startY = null;

    function complete() {
      if (sprout.getAttribute('aria-expanded') === 'true') return;
      sprout.setAttribute('aria-expanded', 'true');
      sprout.style.transform = 'translateY(-0.75rem)';
      if (detail) detail.hidden = false;
      addCoins(1);

      if (isBobomb) {
        audio.play('bobomb');
        shakeScreen();
      } else {
        audio.play('pull');
      }
    }

    // Pointer Events cover mouse, touch and pen with one code path.
    sprout.addEventListener('pointerdown', (event) => {
      startY = event.clientY;
      sprout.setPointerCapture(event.pointerId);
    });

    sprout.addEventListener('pointermove', (event) => {
      if (startY === null) return;
      const progress = pullProgress(startY, event.clientY);
      sprout.style.transform = `translateY(${-progress * 0.75}rem)`;
      if (isPulled(progress)) {
        startY = null;
        complete();
      }
    });

    function endDrag() {
      if (startY === null) return;
      startY = null;
      if (sprout.getAttribute('aria-expanded') !== 'true') {
        sprout.style.transform = '';
      }
    }
    sprout.addEventListener('pointerup', endDrag);
    sprout.addEventListener('pointercancel', endDrag);

    // Keyboard path: click fires on Enter and Space for a <button>.
    sprout.addEventListener('click', complete);
  }
}

function shakeScreen() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const main = document.querySelector('main');
  if (!main) return;
  main.style.animation = 'none';
  void main.offsetWidth;
  main.style.animation = 'screen-shake 300ms steps(2) 2';
}
