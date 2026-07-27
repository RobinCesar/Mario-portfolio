export const REEL_IDS = ['email', 'linkedin', 'cv'];

/**
 * Reels always resolve to the three real contact targets. Randomness only
 * varies the spin duration, so nobody can ever spin and fail to get in touch.
 */
export function spinPlan(random = Math.random) {
  return REEL_IDS.map((id, index) => ({
    id,
    stopMs: 500 + index * 400 + Math.floor(random() * 200),
  }));
}

export function initSlots(root = document, audio = { play() {} }) {
  const lever = root.querySelector('#slot-lever');
  const reels = [...root.querySelectorAll('.slot__reel')];
  if (!lever || reels.length === 0) return;

  let spinning = false;

  lever.addEventListener('click', () => {
    if (spinning) return;
    spinning = true;

    const plan = spinPlan();
    for (const reel of reels) reel.classList.add('slot__reel--spinning');

    plan.forEach((step, index) => {
      window.setTimeout(() => {
        const reel = reels[index];
        if (reel) reel.classList.remove('slot__reel--spinning');
        audio.play('reel');
        if (index === plan.length - 1) spinning = false;
      }, step.stopMs);
    });
  });
}
