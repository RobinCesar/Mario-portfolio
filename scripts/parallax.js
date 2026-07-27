/** Pure: how far a layer shifts for a given scroll position. */
export function parallaxOffset(scrollY, depth) {
  return scrollY * depth;
}

const SHY_GUY_COUNT = 2;

export function initParallax(root = document) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scenery = root.querySelector('.scenery');
  if (!scenery) return;

  if (!reduced) {
    for (let i = 0; i < SHY_GUY_COUNT; i += 1) {
      const guy = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      guy.setAttribute('class', 'sprite shyguy');
      guy.setAttribute('aria-hidden', 'true');
      guy.style.animationDelay = `${i * 7}s`;
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', 'assets/sprites.svg#sprite-shyguy');
      guy.append(use);
      scenery.append(guy);
    }
  }

  const cloud = root.querySelector('.sprite--cloud');
  const cactus = root.querySelector('.sprite--cactus');
  if (reduced || (!cloud && !cactus)) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    // Batch into one frame so scrolling stays smooth.
    window.requestAnimationFrame(() => {
      const y = window.scrollY;
      if (cloud) cloud.style.transform = `translateY(${parallaxOffset(y, 0.15)}px)`;
      if (cactus) cactus.style.transform = `translateY(${parallaxOffset(y, 0.4)}px)`;
      ticking = false;
    });
  }, { passive: true });
}
