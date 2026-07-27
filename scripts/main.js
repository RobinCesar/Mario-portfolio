import * as state from './state.js';
import { createAudio } from './audio.js';
import { initHud } from './hud.js';
import { initBlocks, initDoors } from './blocks.js';
import { initVeggies } from './veggies.js';
import { initSubspace, initialSubspace } from './subspace.js';
import { initCherries } from './cherries.js';
import { initSlots } from './slots.js';
import { initParallax } from './parallax.js';
import { initPlayer } from './player.js';
import { initTitleScreen } from './titlescreen.js';

function boot() {
  // hydrate reports only what storage actually held, so a first-time visitor
  // yields undefined here and the OS colour scheme decides instead.
  const restored = state.hydrate();

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  state.set('subspace', initialSubspace(restored.subspace, prefersDark));

  const audio = createAudio();
  // Browsers only allow audio to start inside a user gesture.
  window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
  window.addEventListener('keydown', () => audio.unlock(), { once: true });

  // If the browser has no Web Audio support the toggle would be a dead
  // control, so remove it. initHud guards against its absence.
  if (!audio.available) document.querySelector('#sound-toggle')?.remove();

  initHud(document);
  initBlocks(document, audio);
  initDoors(document, audio);
  initVeggies(document, audio);
  initSubspace(document, audio);
  initCherries(document, audio);
  initSlots(document, audio);
  initParallax(document);

  // The platformer is layered on last: it activates the same buttons the rest
  // of the page already wired up, so it adds no new interaction logic.
  const player = initPlayer(document, audio);
  initTitleScreen(document, audio, player);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
