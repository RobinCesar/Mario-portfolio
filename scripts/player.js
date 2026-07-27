import { addCoins } from './hud.js';

export const GRAVITY = 0.75;
export const MOVE_SPEED = 3.4;
export const JUMP_VELOCITY = -12.5;
export const PLAYER_W = 44;
export const PLAYER_H = 55;
/* Fraction of the viewport at each side that converts walking into page
   scrolling. Keep this small: the content column is roughly centred and nearly
   viewport-wide, so a large margin would put page elements permanently out of
   the character's horizontal reach. */
export const EDGE_MARGIN = 0.08;
export const SCROLL_SPEED = 9;

/**
 * One step of platformer physics. Pure: takes a state object and an input
 * object, returns the next state. No DOM, so it runs under Node.
 *
 * Coordinates are viewport pixels. `y` is the distance from the ground line,
 * growing upward, so 0 means standing.
 */
export function stepPhysics(player, input, bounds) {
  const vx = (input.right ? 1 : 0) * MOVE_SPEED - (input.left ? 1 : 0) * MOVE_SPEED;

  let vy = player.vy;
  let y = player.y;
  let grounded = player.grounded;

  if (input.jump && grounded) {
    vy = JUMP_VELOCITY;
    grounded = false;
  }

  // vy is negative going up; y grows upward, so subtract.
  vy += GRAVITY;
  y -= vy;

  if (y <= 0) {
    y = 0;
    vy = 0;
    grounded = true;
  }

  let x = player.x + vx;
  let scroll = 0;

  // Walking into either edge pushes the page instead of the character, which
  // is what turns the CV into a level you traverse.
  const leftEdge = bounds.width * EDGE_MARGIN;
  const rightEdge = bounds.width * (1 - EDGE_MARGIN) - PLAYER_W;

  if (vx > 0 && x > rightEdge) {
    scroll = Math.min(SCROLL_SPEED, x - rightEdge) * (SCROLL_SPEED / MOVE_SPEED);
    x = rightEdge;
  } else if (vx < 0 && x < leftEdge) {
    scroll = -Math.min(SCROLL_SPEED, leftEdge - x) * (SCROLL_SPEED / MOVE_SPEED);
    x = leftEdge;
  }

  x = Math.min(Math.max(x, 0), Math.max(bounds.width - PLAYER_W, 0));

  let facing = player.facing;
  if (vx > 0) facing = 1;
  else if (vx < 0) facing = -1;

  return { x, y, vx, vy, grounded, facing, scroll };
}

/** Pure: which sprite frame to show for a given motion state. */
export function frameFor(player, tick) {
  if (!player.grounded) return 'sprite-player-jump';
  if (player.vx === 0) return 'sprite-player-idle';
  return tick % 2 === 0 ? 'sprite-player-walk-a' : 'sprite-player-walk-b';
}

/** Pure: do two viewport rectangles overlap? */
export function overlaps(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/* The character walks along a band at the bottom of the viewport while the page
   scrolls past, so page elements sweep down through that band. Matching only
   the sprite's own 44x55 box would demand near-perfect timing, so interaction
   uses a taller, wider reach — roughly "arms up, one step either side". */
export const REACH_UP = 110;
export const REACH_SIDE = 20;

/** Pure: the interaction box for a given player rectangle. */
export function reachBox(rect) {
  return {
    left: rect.left - REACH_SIDE,
    right: rect.right + REACH_SIDE,
    top: rect.top - REACH_UP,
    bottom: rect.bottom + 8,
  };
}

const KEY_MAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
  ArrowDown: 'action', KeyS: 'action', KeyE: 'action',
};

export function initPlayer(root = document, audio = { play() {} }) {
  const stage = root.querySelector('#stage');
  const sprite = root.querySelector('#player-sprite');
  const use = sprite ? sprite.querySelector('use') : null;
  if (!stage || !use) return null;

  const input = { left: false, right: false, jump: false, action: false };
  // A tap can begin and end inside a single frame, so a jump press is buffered
  // for a few frames rather than sampled. Without this, quick taps get eaten.
  const JUMP_BUFFER_FRAMES = 8;
  let jumpBuffer = 0;
  // Spawn well inside the free-movement zone. Starting on the boundary would
  // pin the character to the edge and scroll the page on the first step left.
  let player = {
    x: Math.max(window.innerWidth * 0.2, 60),
    y: 0, vx: 0, vy: 0, grounded: true, facing: 1,
  };
  let tick = 0;
  let frameCount = 0;
  let running = false;
  let actionLatch = false;
  const punched = new WeakSet();

  function onKey(event) {
    // Before Press Start the arrow keys scroll the page as normal. Only once
    // the game is running do they belong to the character.
    if (!running) return;
    const slot = KEY_MAP[event.code];
    if (!slot) return;

    // Space activates whatever button has focus, so it stays with the control
    // when someone is tabbing through the page. Arrows always drive the player.
    if (event.code === 'Space') {
      const active = document.activeElement;
      const onControl = active
        && active !== document.body
        && active.closest('button, a, input, select, textarea');
      if (onControl) return;
    }

    if (slot === 'jump') {
      if (event.type === 'keydown') jumpBuffer = JUMP_BUFFER_FRAMES;
    } else {
      input[slot] = event.type === 'keydown';
    }
    event.preventDefault();
  }

  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);

  // Touch controls: same input object, so one code path drives everything.
  for (const button of root.querySelectorAll('.dpad button')) {
    const slot = button.dataset.input;
    const press = (on) => (event) => {
      event.preventDefault();
      if (slot === 'jump') {
        if (on) jumpBuffer = JUMP_BUFFER_FRAMES;
      } else {
        input[slot] = on;
      }
    };
    button.addEventListener('pointerdown', press(true));
    button.addEventListener('pointerup', press(false));
    button.addEventListener('pointercancel', press(false));
    button.addEventListener('pointerleave', press(false));
  }

  function playerRect() {
    const groundTop = window.innerHeight - groundHeight();
    const bottom = groundTop - player.y;
    return {
      left: player.x,
      right: player.x + PLAYER_W,
      top: bottom - PLAYER_H,
      bottom,
    };
  }

  function groundHeight() {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--play-ground').trim();
    return parseFloat(raw) * 16 || 72;
  }

  function activate(element) {
    element.click();
  }

  function checkCollisions() {
    const me = reachBox(playerRect());

    // Blocks are punched from below: you have to be on the way up.
    for (const block of root.querySelectorAll('.qblock')) {
      const box = block.getBoundingClientRect();
      if (box.width === 0) continue;
      const touching = overlaps(me, box);
      if (touching && player.vy < 0 && !punched.has(block)) {
        punched.add(block);
        activate(block);
      } else if (!touching) {
        punched.delete(block);
      }
    }

    // Cherries are picked up just by reaching them.
    for (const cherry of root.querySelectorAll('.cherry:not([hidden])')) {
      const box = cherry.getBoundingClientRect();
      if (box.width === 0) continue;
      if (overlaps(me, box)) activate(cherry);
    }

    if (!input.action || actionLatch) return;
    actionLatch = true;

    // Everything else needs a deliberate press, so you don't yank every plant
    // just by walking past it.
    const selector = '.sprout[aria-expanded="false"], .door, #potion, #slot-lever';
    for (const element of root.querySelectorAll(selector)) {
      const box = element.getBoundingClientRect();
      if (box.width === 0) continue;
      if (overlaps(me, box)) {
        activate(element);
        break;
      }
    }
  }

  function loop() {
    if (!running) return;
    frameCount += 1;
    if (frameCount % 6 === 0) tick += 1;

    if (!input.action) actionLatch = false;

    const wasGrounded = player.grounded;
    const wantsJump = jumpBuffer > 0;
    if (jumpBuffer > 0) jumpBuffer -= 1;

    player = stepPhysics(player, { ...input, jump: wantsJump }, { width: window.innerWidth });

    // Spend the buffer the moment it produces a jump, so one press is one jump.
    if (wasGrounded && !player.grounded) {
      jumpBuffer = 0;
      audio.play('jump');
    } else if (!wasGrounded && player.grounded) {
      audio.play('land');
    }

    if (player.scroll) window.scrollBy(0, player.scroll);

    sprite.style.transform =
      `translate3d(${player.x}px, ${-player.y}px, 0) scaleX(${player.facing})`;
    use.setAttribute('href', `assets/sprites.svg#${frameFor(player, tick)}`);

    checkCollisions();
    window.requestAnimationFrame(loop);
  }

  return {
    start() {
      if (running) return;
      running = true;
      stage.hidden = false;
      root.querySelector('.dpad')?.removeAttribute('hidden');
      document.documentElement.setAttribute('data-playing', 'on');
      window.requestAnimationFrame(loop);
    },
    get running() {
      return running;
    },
  };
}
