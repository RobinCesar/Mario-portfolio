# Super Mario Bros 2 Portfolio Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Robin Elvius' portfolio site — a static page presenting his CV, themed as *Super Mario Bros 2*, where all content is readable without JavaScript and the game elements are enhancement only.

**Architecture:** Plain HTML/CSS/ES-modules with no build step and no runtime dependencies. `index.html` carries every CV fact as semantic markup; nine small ES modules in `scripts/` decorate it, communicating solely through a pub/sub store in `scripts/state.js`. Pure logic is factored out of every module so it can be tested in Node without a DOM.

**Tech Stack:** HTML5, CSS custom properties, ES modules, Web Audio API, Pointer Events, inline SVG sprites. Node 24 runs the tests. No npm packages.

## Global Constraints

These apply to every task. Do not violate them even if a task's steps don't restate them.

- **No dependencies.** No npm install, no CDN links, no external network requests at runtime. `package.json` exists only to declare `"type": "module"` for Node; it must never gain a `dependencies` key.
- **No build step.** Deployment is a file copy. Nothing compiles.
- **Content is never gated behind interaction.** Every CV fact is in `index.html` as text. JS only decorates. Skill names are visible before pulling; contact links are real `<a href>` in markup.
- **Phone number `+46 76 306 96 22` must never appear on the site**, in any format. Task 2 adds an automated guard for this.
- **Language is English only.** No Swedish copy, no language toggle.
- **All pixel art is original**, drawn in the SMB2 idiom. No Nintendo sprite rips, no ripped audio.
- **Every interaction has a keyboard path.** Sprouts, doors, `?` blocks, potion, and the slot lever are real `<button>` elements. Drag/pointer input is an enhancement, never the only route.
- **`prefers-reduced-motion: reduce`** disables parallax, Shy Guy patrol, screen shake, and replaces the Starman rainbow with a static gold tint.
- **Starman colour cycling is capped at 3 Hz** even when motion is allowed.
- **Subspace magenta `#D82800` is never used for text** — borders, accents and sprite fill only.
- **Run `node tests/run-node.js` before every commit.** It must exit 0.

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | Declares `"type": "module"`. Two lines. No dependencies, ever. |
| `index.html` | All CV content, semantic. The site works with this file alone. |
| `styles/tokens.css` | Palette, spacing scale, type scale, Subspace overrides. |
| `styles/layout.css` | Page grid, HUD bar, section framing, responsive rules. |
| `styles/sprites.css` | Sprite sizing, positioning, animation keyframes. |
| `styles/sections.css` | Per-section styling. |
| `assets/sprites.svg` | Original pixel art as one SVG symbol sheet. |
| `assets/fonts/PressStart2P.woff2` | Self-hosted display font (SIL OFL). |
| `scripts/state.js` | Pub/sub store + localStorage persistence. |
| `scripts/audio.js` | Web Audio chiptune engine with graceful degradation. |
| `scripts/hud.js` | Hearts (scroll meter), coin/cherry counters, sound toggle. |
| `scripts/blocks.js` | About `?` blocks and Experience doors. |
| `scripts/veggies.js` | Skill sprout pulling + Bob-omb. |
| `scripts/subspace.js` | Potion → dark mode. |
| `scripts/cherries.js` | Cherry hunt + Starman. |
| `scripts/slots.js` | Contact slot machine. |
| `scripts/parallax.js` | Scrolling scenery, patrolling Shy Guys. |
| `scripts/main.js` | Boot sequence, module registration. |
| `tests/harness.js` | ~30-line assertion harness, no dependencies. |
| `tests/all.js` | Registry of universal tests (browser + Node). |
| `tests/node-only.js` | Registry of file-reading tests (Node only). |
| `tests/run-node.js` | Terminal runner. Exits non-zero on failure. |
| `test.html` | Browser runner for the universal tests. |

**Why two test registries:** the contrast, content and sprite tests read files from disk with `node:fs`, which a browser cannot do. `test.html` imports `all.js` only; `run-node.js` imports both. Same harness, same assertions.

---

### Task 1: Test harness and state store

**Files:**
- Create: `package.json`
- Create: `tests/harness.js`
- Create: `tests/all.js`
- Create: `tests/node-only.js`
- Create: `tests/run-node.js`
- Create: `test.html`
- Create: `scripts/state.js`
- Create: `tests/state.test.js`

**Interfaces:**
- Consumes: nothing. This is the foundation task.
- Produces:
  - `harness.js`: `test(name, fn)`, `assert(cond, msg)`, `assertEqual(actual, expected, msg)`, `run(report) -> Promise<number>` (returns failure count).
  - `state.js`: `get(key)`, `set(key, value)`, `subscribe(key, fn) -> unsubscribe`, `reset()`. Keys: `coins` (number), `cherries` (string[]), `soundOn` (boolean), `subspace` (boolean), `starman` (boolean).

- [ ] **Step 1: Create `package.json`**

This declares the module format for Node. It is not a dependency manifest and must never gain one.

```json
{
  "private": true,
  "type": "module"
}
```

- [ ] **Step 2: Write the harness**

Create `tests/harness.js`:

```js
const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || 'assertion failed');
}

export function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message || 'not equal'} — expected ${e}, got ${a}`);
  }
}

export async function run(report) {
  let passed = 0;
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      passed += 1;
      report(`PASS  ${t.name}`);
    } catch (error) {
      failed += 1;
      report(`FAIL  ${t.name}\n        ${error.message}`);
    }
  }
  report(`\n${passed} passed, ${failed} failed`);
  return failed;
}
```

- [ ] **Step 3: Write the failing test for the state store**

Create `tests/state.test.js`:

```js
import { test, assert, assertEqual } from './harness.js';
import * as state from '../scripts/state.js';

test('state: returns defaults', () => {
  state.reset();
  assertEqual(state.get('coins'), 0, 'coins default');
  assertEqual(state.get('cherries'), [], 'cherries default');
  assertEqual(state.get('soundOn'), false, 'soundOn default');
  assertEqual(state.get('starman'), false, 'starman default');
});

test('state: set updates the value', () => {
  state.reset();
  state.set('coins', 3);
  assertEqual(state.get('coins'), 3, 'coins after set');
});

test('state: subscribe fires on change', () => {
  state.reset();
  const seen = [];
  state.subscribe('coins', (value) => seen.push(value));
  state.set('coins', 1);
  state.set('coins', 2);
  assertEqual(seen, [1, 2], 'listener received both changes');
});

test('state: setting the same value does not notify', () => {
  state.reset();
  const seen = [];
  state.subscribe('coins', (value) => seen.push(value));
  state.set('coins', 1);
  state.set('coins', 1);
  assertEqual(seen, [1], 'no duplicate notification');
});

test('state: unsubscribe stops delivery', () => {
  state.reset();
  const seen = [];
  const off = state.subscribe('coins', (value) => seen.push(value));
  state.set('coins', 1);
  off();
  state.set('coins', 2);
  assertEqual(seen, [1], 'no delivery after unsubscribe');
});

test('state: listeners are isolated per key', () => {
  state.reset();
  const seen = [];
  state.subscribe('coins', (value) => seen.push(value));
  state.set('starman', true);
  assertEqual(seen, [], 'coins listener not called for starman');
});

test('state: reset clears listeners', () => {
  state.reset();
  const seen = [];
  state.subscribe('coins', (value) => seen.push(value));
  state.reset();
  state.set('coins', 5);
  assertEqual(seen, [], 'listener removed by reset');
});

test('state: arrays replace by reference so cherries notify', () => {
  state.reset();
  const seen = [];
  state.subscribe('cherries', (value) => seen.push(value));
  state.set('cherries', ['a']);
  state.set('cherries', ['a', 'b']);
  assertEqual(seen, [['a'], ['a', 'b']], 'both array updates delivered');
});
```

- [ ] **Step 4: Wire up the registries and runners**

Create `tests/all.js`:

```js
import './state.test.js';
```

Create `tests/node-only.js` (empty registry for now; later tasks add imports):

```js
// Tests that read files from disk. Node only — browsers cannot import node:fs.
```

Create `tests/run-node.js`:

```js
import { run } from './harness.js';
import './all.js';
import './node-only.js';

const failures = await run((message) => console.log(message));
process.exit(failures === 0 ? 0 : 1);
```

Create `test.html`:

```html
<!doctype html>
<meta charset="utf-8">
<title>Tests — Mario Portfolio</title>
<style>
  body { background: #101820; color: #FCFCFC; font: 14px/1.6 ui-monospace, monospace; padding: 2rem; }
  pre { white-space: pre-wrap; }
</style>
<h1>Tests</h1>
<pre id="output">Running…
</pre>
<script type="module">
  import { run } from './tests/harness.js';
  import './tests/all.js';

  const output = document.getElementById('output');
  output.textContent = '';
  run((message) => { output.textContent += message + '\n'; });
</script>
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `node tests/run-node.js`
Expected: FAIL — `Cannot find module .../scripts/state.js`

- [ ] **Step 6: Implement the state store**

Create `scripts/state.js`:

```js
const PERSISTED = new Set(['soundOn', 'subspace']);
const STORAGE_KEY = 'mario-portfolio';

const DEFAULTS = {
  coins: 0,
  cherries: [],
  soundOn: false,
  subspace: false,
  starman: false,
};

let store = freshDefaults();
let listeners = new Map();

function freshDefaults() {
  return { ...DEFAULTS, cherries: [] };
}

// localStorage is absent in Node and throws in private browsing mode.
// Both cases land in the catch and fall back to in-memory state.
function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeStored(key, value) {
  if (!PERSISTED.has(key)) return;
  try {
    const current = readStored();
    current[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Private mode or no storage. State stays in memory for this session.
  }
}

export function get(key) {
  return store[key];
}

export function set(key, value) {
  if (store[key] === value) return;
  store[key] = value;
  writeStored(key, value);
  const subscribers = listeners.get(key);
  if (!subscribers) return;
  for (const fn of subscribers) fn(value);
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => {
    const subscribers = listeners.get(key);
    if (subscribers) subscribers.delete(fn);
  };
}

/** Restores defaults and drops all listeners. Used by tests and by boot. */
export function reset() {
  store = freshDefaults();
  listeners = new Map();
}

/** Reads persisted values into the store. Call once during boot, not in tests. */
export function hydrate() {
  const stored = readStored();
  for (const key of PERSISTED) {
    if (typeof stored[key] === 'boolean') store[key] = stored[key];
  }
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `8 passed, 0 failed`, exit code 0

- [ ] **Step 8: Commit**

```bash
git add package.json tests/ test.html scripts/state.js
git commit -m "feat: add test harness and state store"
```

---

### Task 2: Semantic HTML with all CV content

This is the load-bearing task. When it is done the site is already a complete, readable CV — everything after it is decoration.

**Files:**
- Create: `index.html`
- Create: `tests/content.test.js`
- Modify: `tests/node-only.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: the DOM contract every later module depends on. Element ids and classes:
  - `#hud`, `.hud__hearts`, `.hud__coins`, `.hud__cherries`, `#sound-toggle`, `.hud__plain-cv`
  - `#title`, `#about`, `#projects`, `#experience`, `#education`, `#skills`, `#contact`
  - `.qblock` (buttons in About), `.qblock__reveal`
  - `.door` (buttons in Experience), `.door__panel`
  - `.sprout` (buttons in Skills), `data-skill`, `.sprout__detail`
  - `#potion` (button), `.slot`, `.slot__reel`, `#slot-lever`
  - `.cherry` (buttons), `data-cherry-id`

- [ ] **Step 1: Write the failing content test**

Create `tests/content.test.js`. The phone check strips every non-digit from the file, so no amount of spacing, hyphenation or entity-encoding can sneak the number through.

```js
import { readFileSync } from 'node:fs';
import { test, assert, assertEqual } from './harness.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('content: page declares English', () => {
  assert(/<html[^>]*\slang="en"/.test(html), 'html lang="en" missing');
});

test('content: exactly one h1', () => {
  const matches = html.match(/<h1[\s>]/g) || [];
  assertEqual(matches.length, 1, 'h1 count');
});

test('content: name is present', () => {
  assert(html.includes('Robin Elvius'), 'name missing');
});

test('content: every employer appears', () => {
  for (const employer of [
    'Guidelight',
    'Elvius Betongvaror',
    'Gimlit',
    'Lingon Mobil',
    'LupinusUF',
    'Uppsala Municipality',
  ]) {
    assert(html.includes(employer), `employer missing: ${employer}`);
  }
});

test('content: every school appears', () => {
  for (const school of [
    'Uppsala University',
    'Katedralskolan',
    'Luleå University of Technology',
    'Linköping University',
    'Stockholm University',
  ]) {
    assert(html.includes(school), `school missing: ${school}`);
  }
});

test('content: project is present', () => {
  assert(html.includes('Polymarket'), 'Polymarket missing');
  assert(html.includes('calibration'), 'calibration detail missing');
});

test('content: every skill name is in the markup, not injected by JS', () => {
  for (const skill of [
    'Python',
    'Git',
    'HTML',
    'CSS',
    'JavaScript',
    'LaTeX',
    'Microsoft 365',
    'Sales',
  ]) {
    assert(html.includes(skill), `skill missing: ${skill}`);
  }
});

test('content: languages are plain text, not a pullable', () => {
  assert(html.includes('Swedish and English'), 'languages missing');
});

test('content: contact links are real anchors', () => {
  assert(
    html.includes('mailto:robin.c.elvius@gmail.com'),
    'mailto link missing',
  );
  assert(
    html.includes('linkedin.com/in/robin-elvius-132368252'),
    'LinkedIn link missing',
  );
  assert(html.includes('CV__V_2_.pdf'), 'CV PDF link missing');
});

test('content: phone number appears nowhere in any format', () => {
  const digitsOnly = html.replace(/\D/g, '');
  assert(!digitsOnly.includes('46763069622'), 'international phone leaked');
  assert(!digitsOnly.includes('0763069622'), 'national phone leaked');
});

test('content: five cherries are placed', () => {
  const matches = html.match(/data-cherry-id="/g) || [];
  assertEqual(matches.length, 5, 'cherry count');
});

test('content: six experience doors', () => {
  const matches = html.match(/class="door"/g) || [];
  assertEqual(matches.length, 6, 'door count');
});

test('content: decorative sprites are hidden from assistive tech', () => {
  const uses = html.match(/<svg class="sprite[^"]*"[^>]*>/g) || [];
  for (const tag of uses) {
    assert(tag.includes('aria-hidden="true"'), `sprite not aria-hidden: ${tag}`);
  }
});
```

- [ ] **Step 2: Register the test and run it to verify it fails**

Replace `tests/node-only.js` with:

```js
// Tests that read files from disk. Node only — browsers cannot import node:fs.
import './content.test.js';
```

Run: `node tests/run-node.js`
Expected: FAIL — `ENOENT` for `index.html`

- [ ] **Step 3: Write `index.html`**

Every CV fact goes in here as text. Sprites are referenced from a sheet that does not exist yet — that is fine, they render as nothing until Task 4.

```html
<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Robin Elvius — Engineering Physics Student &amp; Developer</title>
<meta name="description" content="Portfolio of Robin Elvius: engineering physics student at Uppsala University, freelance web developer, and builder of a Python prediction-market analysis pipeline.">
<script>document.documentElement.classList.remove('no-js');</script>
<link rel="stylesheet" href="styles/tokens.css">
<link rel="stylesheet" href="styles/layout.css">
<link rel="stylesheet" href="styles/sprites.css">
<link rel="stylesheet" href="styles/sections.css">
</head>
<body>

<a class="skip-link" href="#about">Skip to content</a>

<header class="hud" id="hud">
  <p class="hud__hearts" aria-hidden="true">
    <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-heart"></use></svg>
    <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-heart"></use></svg>
    <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-heart"></use></svg>
  </p>
  <p class="hud__coins">
    <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-coin"></use></svg>
    <span class="hud__coin-count">0</span>
    <span class="visually-hidden">coins collected</span>
  </p>
  <p class="hud__cherries">
    <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-cherry"></use></svg>
    <span class="hud__cherry-count">0</span>/5
    <span class="visually-hidden">cherries found</span>
  </p>
  <button type="button" id="sound-toggle" aria-pressed="false">Sound: off</button>
  <a class="hud__plain-cv" href="CV__V_2_.pdf">Plain CV</a>
</header>

<main>

<section id="title" class="section section--title">
  <div class="scenery" aria-hidden="true">
    <svg class="sprite sprite--cloud" aria-hidden="true" width="32" height="16"><use href="assets/sprites.svg#sprite-cloud"></use></svg>
    <svg class="sprite sprite--cactus" aria-hidden="true" width="16" height="24"><use href="assets/sprites.svg#sprite-cactus"></use></svg>
  </div>
  <h1>Robin Elvius</h1>
  <p class="subtitle">Engineering physics student &amp; developer — Uppsala, Sweden</p>
  <a class="press-start" href="#about">Press Start</a>
</section>

<section id="about" class="section">
  <h2>About</h2>
  <p>
    Engineering physics student at Uppsala University with broad experience in sales,
    marketing and business management, plus practical web development experience.
    I combine a technical foundation — Python, Git, LaTeX, HTML/CSS/JavaScript — with
    the ability to drive projects and own client relationships.
  </p>
  <ul class="qblocks">
    <li>
      <button type="button" class="qblock" data-reveal="Studying engineering physics at Uppsala University since 2024.">
        <svg class="sprite" aria-hidden="true" width="24" height="24"><use href="assets/sprites.svg#sprite-question-block"></use></svg>
        <span class="visually-hidden">Reveal: studies</span>
      </button>
      <span class="qblock__reveal" hidden>Studying engineering physics at Uppsala University since 2024.</span>
      <button type="button" class="cherry" data-cherry-id="about-block" hidden>
        <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-cherry"></use></svg>
        <span class="visually-hidden">Collect cherry</span>
      </button>
    </li>
    <li>
      <button type="button" class="qblock" data-reveal="Python is my main language — data pipelines, analysis, automation.">
        <svg class="sprite" aria-hidden="true" width="24" height="24"><use href="assets/sprites.svg#sprite-question-block"></use></svg>
        <span class="visually-hidden">Reveal: Python</span>
      </button>
      <span class="qblock__reveal" hidden>Python is my main language — data pipelines, analysis, automation.</span>
    </li>
    <li>
      <button type="button" class="qblock" data-reveal="Freelance web developer running my own firm since June 2026.">
        <svg class="sprite" aria-hidden="true" width="24" height="24"><use href="assets/sprites.svg#sprite-question-block"></use></svg>
        <span class="visually-hidden">Reveal: consulting</span>
      </button>
      <span class="qblock__reveal" hidden>Freelance web developer running my own firm since June 2026.</span>
    </li>
  </ul>
  <button type="button" id="potion" aria-pressed="false">
    <svg class="sprite" aria-hidden="true" width="16" height="24"><use href="assets/sprites.svg#sprite-potion"></use></svg>
    <span class="potion__label">Throw potion</span>
  </button>
</section>

<section id="projects" class="section">
  <h2>Projects</h2>
  <article class="boss-card">
    <h3>Prediction market analysis tool <span class="boss-card__year">2026</span></h3>
    <p class="boss-card__lede">A Python system for finding mispriced markets on Polymarket.</p>
    <ul>
      <li>
        Collects market data through public APIs, analyses historical mispricing
        (calibration), and runs several automated paper trading strategies derived
        from the results.
      </li>
      <li>
        The whole pipeline — data collection, statistical analysis and simulated
        trading — is version controlled with Git and runs continuously on a server.
      </li>
    </ul>
    <p class="boss-card__stack">Python · Git · REST APIs · statistical analysis</p>
    <button type="button" class="cherry" data-cherry-id="projects-arena">
      <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-cherry"></use></svg>
      <span class="visually-hidden">Collect cherry</span>
    </button>
  </article>
</section>

<section id="experience" class="section">
  <h2>Experience</h2>
  <ul class="doors">

    <li>
      <button type="button" class="door" aria-expanded="false" aria-controls="door-1">
        <svg class="sprite" aria-hidden="true" width="24" height="32"><use href="assets/sprites.svg#sprite-door"></use></svg>
        <span class="door__role">Developer (Consultant)</span>
        <span class="door__where">Own firm, incl. assignments from Guidelight</span>
        <time class="door__when" datetime="2026-06">2026/06 – Present</time>
      </button>
      <div class="door__panel" id="door-1">
        <ul>
          <li>Built and maintained websites for clients in the moving industry, bridal wear and naprapathy, using WordPress, Shopify and HTML/CSS/JavaScript.</li>
          <li>Owned the full client relationship, from needs analysis through delivery to support.</li>
        </ul>
      </div>
    </li>

    <li>
      <button type="button" class="door" aria-expanded="false" aria-controls="door-2">
        <svg class="sprite" aria-hidden="true" width="24" height="32"><use href="assets/sprites.svg#sprite-door"></use></svg>
        <span class="door__role">Marketing and Finance Manager</span>
        <span class="door__where">Elvius Betongvaror, Uppsala</span>
        <time class="door__when" datetime="2024-05">2024/05 – Present</time>
      </button>
      <div class="door__panel" id="door-2">
        <ul>
          <li>Produced the company's marketing plan and competitor analysis.</li>
          <li>Responsible for budget, ongoing bookkeeping and annual accounts.</li>
          <li>Ran the co-owners' regular meetings and acted as secretary.</li>
        </ul>
      </div>
    </li>

    <li>
      <button type="button" class="door" aria-expanded="false" aria-controls="door-3">
        <svg class="sprite" aria-hidden="true" width="24" height="32"><use href="assets/sprites.svg#sprite-door"></use></svg>
        <span class="door__role">Meeting Booker</span>
        <span class="door__where">Gimlit, Uppsala</span>
        <time class="door__when" datetime="2023-11">2023/11 – 2024/01</time>
      </button>
      <div class="door__panel" id="door-3">
        <ul>
          <li>Cold called companies to book sales meetings about web services.</li>
          <li>Regularly booked new meetings for the sales organisation.</li>
        </ul>
      </div>
    </li>

    <li>
      <button type="button" class="door" aria-expanded="false" aria-controls="door-4">
        <svg class="sprite" aria-hidden="true" width="24" height="32"><use href="assets/sprites.svg#sprite-door"></use></svg>
        <span class="door__role">Telesales Agent</span>
        <span class="door__where">Lingon Mobil, Uppsala</span>
        <time class="door__when" datetime="2023-09">2023/09 – 2023/10</time>
      </button>
      <div class="door__panel" id="door-4">
        <ul>
          <li>Cold called new and former customers to sell and renew mobile subscriptions.</li>
          <li>Repeatedly finished in the top percentile of sellers in the office.</li>
        </ul>
      </div>
    </li>

    <li>
      <button type="button" class="door" aria-expanded="false" aria-controls="door-5">
        <svg class="sprite" aria-hidden="true" width="24" height="32"><use href="assets/sprites.svg#sprite-door"></use></svg>
        <span class="door__role">Salesperson and CEO</span>
        <span class="door__where">LupinusUF, Uppsala</span>
        <time class="door__when" datetime="2022-08">2022/08 – 2023/06</time>
      </button>
      <div class="door__panel" id="door-5">
        <ul>
          <li>Developed packaging and marketing material in the Adobe suite.</li>
          <li>Sold out the entire stock — around 50 protein bars — at the UF fair through active sales technique.</li>
          <li>Marketed the product through social media.</li>
        </ul>
        <p class="door__note">UF (Ung Företagsamhet) is Sweden's school entrepreneurship programme, where students run a real company for one academic year.</p>
      </div>
    </li>

    <li>
      <button type="button" class="door" aria-expanded="false" aria-controls="door-6">
        <svg class="sprite" aria-hidden="true" width="24" height="32"><use href="assets/sprites.svg#sprite-door"></use></svg>
        <span class="door__role">Park Worker</span>
        <span class="door__where">Uppsala Municipality</span>
        <time class="door__when" datetime="2020-07">2020/07 – 2020/08</time>
      </button>
      <div class="door__panel" id="door-6">
        <ul>
          <li>Cleaned and maintained parks and public spaces in and around Uppsala.</li>
        </ul>
        <button type="button" class="cherry" data-cherry-id="oldest-door">
          <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-cherry"></use></svg>
          <span class="visually-hidden">Collect cherry</span>
        </button>
      </div>
    </li>

  </ul>
</section>

<section id="education" class="section">
  <h2>Education</h2>
  <ul class="plaques">
    <li class="plaque">
      <h3>MSc in Engineering Physics</h3>
      <p class="plaque__where">Uppsala University</p>
      <time datetime="2024">2024 – 2029 (ongoing)</time>
    </li>
    <li class="plaque">
      <h3>Introduction to AI</h3>
      <p class="plaque__where">Luleå University of Technology — 7.5 credits</p>
      <p>Fundamentals, machine learning, reasoning and practical applications.</p>
      <time datetime="2026">2026</time>
    </li>
    <li class="plaque">
      <h3>Cybersecurity — Fundamentals and Awareness</h3>
      <p class="plaque__where">Linköping University — 3 credits</p>
      <time datetime="2026">2026</time>
    </li>
    <li class="plaque">
      <h3>Commercial Law: Introductory Law Course</h3>
      <p class="plaque__where">Stockholm University — 15 credits</p>
      <time datetime="2026">2026</time>
    </li>
    <li class="plaque">
      <h3>Natural Science Programme</h3>
      <p class="plaque__where">Katedralskolan Uppsala</p>
      <time datetime="2020">2020 – 2023</time>
    </li>
  </ul>
  <button type="button" class="cherry cherry--subspace" data-cherry-id="education-subspace" hidden>
    <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-cherry"></use></svg>
    <span class="visually-hidden">Collect hidden cherry</span>
  </button>
</section>

<section id="skills" class="section">
  <h2>Skills</h2>
  <p class="languages">Languages: <strong>Swedish and English</strong> (fluent).</p>
  <p class="skills__hint">Drag a sprout upward, or focus it and press Enter, to pull it out.</p>
  <ul class="sprouts">
    <li>
      <button type="button" class="sprout" data-skill="Python" aria-expanded="false">
        <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-sprout"></use></svg>
        <span class="sprout__name">Python</span>
      </button>
      <span class="sprout__detail" hidden>Primary language. Powers the Polymarket data and analysis pipeline.</span>
    </li>
    <li>
      <button type="button" class="sprout" data-skill="Git" aria-expanded="false">
        <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-sprout"></use></svg>
        <span class="sprout__name">Git</span>
      </button>
      <span class="sprout__detail" hidden>Version control across every project, including this site.</span>
    </li>
    <li>
      <button type="button" class="sprout" data-skill="Web" aria-expanded="false">
        <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-sprout"></use></svg>
        <span class="sprout__name">HTML, CSS, JavaScript</span>
      </button>
      <span class="sprout__detail" hidden>Client websites, WordPress and Shopify work, and this page.</span>
    </li>
    <li>
      <button type="button" class="sprout" data-skill="LaTeX" aria-expanded="false">
        <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-sprout"></use></svg>
        <span class="sprout__name">LaTeX</span>
      </button>
      <span class="sprout__detail" hidden>Academic reports and typesetting, including my CV.</span>
    </li>
    <li>
      <button type="button" class="sprout" data-skill="Office" aria-expanded="false">
        <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-sprout"></use></svg>
        <span class="sprout__name">Microsoft 365</span>
      </button>
      <span class="sprout__detail" hidden>Office suite — used daily for bookkeeping and reporting.</span>
    </li>
    <li>
      <button type="button" class="sprout" data-skill="Business" aria-expanded="false">
        <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-sprout"></use></svg>
        <span class="sprout__name">Sales &amp; business management</span>
      </button>
      <span class="sprout__detail" hidden>Marketing plans, competitor analysis, budgets and bookkeeping.</span>
    </li>
    <li>
      <button type="button" class="sprout sprout--bobomb" data-skill="bobomb" aria-expanded="false">
        <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-bobomb"></use></svg>
        <span class="sprout__name visually-hidden">A Bob-omb</span>
      </button>
      <span class="sprout__detail" hidden>That was a Bob-omb, not a vegetable.</span>
    </li>
  </ul>
</section>

<section id="contact" class="section">
  <h2>Get in touch</h2>
  <div class="slot">
    <ul class="slot__reels">
      <li class="slot__reel">
        <a href="mailto:robin.c.elvius@gmail.com">
          <span class="slot__symbol" aria-hidden="true">✉</span>
          robin.c.elvius@gmail.com
        </a>
      </li>
      <li class="slot__reel">
        <a href="https://www.linkedin.com/in/robin-elvius-132368252">
          <span class="slot__symbol" aria-hidden="true">in</span>
          LinkedIn
        </a>
      </li>
      <li class="slot__reel">
        <a href="CV__V_2_.pdf">
          <span class="slot__symbol" aria-hidden="true">▤</span>
          Download CV (PDF)
        </a>
      </li>
    </ul>
    <button type="button" id="slot-lever">
      <span class="visually-hidden">Spin the reels</span>
      <span aria-hidden="true">▼</span>
    </button>
    <button type="button" class="cherry" data-cherry-id="slot-chassis">
      <svg class="sprite" aria-hidden="true" width="16" height="16"><use href="assets/sprites.svg#sprite-cherry"></use></svg>
      <span class="visually-hidden">Collect cherry</span>
    </button>
  </div>
</section>

</main>

<footer class="footer">
  <p>Built by Robin Elvius with plain HTML, CSS and JavaScript. Pixel art is original work — an homage to Super Mario Bros 2, not affiliated with Nintendo.</p>
</footer>

<script type="module" src="scripts/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `21 passed, 0 failed`

- [ ] **Step 5: Verify the page reads as a CV with no CSS and no JS**

Run: `python3 -m http.server 8000`
Open `http://localhost:8000/index.html`, then in DevTools disable JavaScript and reload.
Expected: every role, school, skill and contact link is visible and readable. Unstyled, but complete.

- [ ] **Step 6: Commit**

```bash
git add index.html tests/content.test.js tests/node-only.js
git commit -m "feat: add semantic CV content"
```

---

### Task 3: Design tokens, layout, and the contrast guard

**Files:**
- Create: `styles/tokens.css`
- Create: `styles/layout.css`
- Create: `assets/fonts/PressStart2P.woff2`
- Create: `tests/contrast.test.js`
- Modify: `tests/node-only.js`

**Interfaces:**
- Consumes: the class names produced by Task 2.
- Produces: CSS custom properties `--sky`, `--sand`, `--ground`, `--pipe`, `--ink`, `--paper`, `--accent`, `--space-1..4`, `--font-display`, `--font-body`. Subspace overrides keyed on `html[data-subspace="on"]`. Utility classes `.visually-hidden`, `.skip-link`.

- [ ] **Step 1: Download the display font**

Run:

```bash
mkdir -p assets/fonts
curl -sSL -o assets/fonts/PressStart2P.woff2 \
  "https://fonts.gstatic.com/s/pressstart2p/v16/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2"
ls -l assets/fonts/PressStart2P.woff2
```

Expected: a file of roughly 10–20 KB. This is the latin subset, which covers `å ä ö` (U+00E4, U+00E5, U+00F6) needed for "Luleå". Press Start 2P is licensed under the SIL Open Font License, which permits self-hosting.

If the download fails because the machine is offline, continue anyway: the `@font-face` in Step 3 lists fallbacks and headings will render in monospace. Do not substitute a CDN link.

- [ ] **Step 2: Write the failing contrast test**

Create `tests/contrast.test.js`:

```js
import { readFileSync } from 'node:fs';
import { test, assert } from './harness.js';

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');

function token(name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  assert(match, `token --${name} not found in tokens.css`);
  return match[1];
}

function channelToLinear(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = channelToLinear((n >> 16) & 255);
  const g = channelToLinear((n >> 8) & 255);
  const b = channelToLinear(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

test('contrast: body text on sand meets WCAG AA', () => {
  const ratio = contrast(token('ink'), token('sand'));
  assert(ratio >= 4.5, `--ink on --sand is ${ratio.toFixed(2)}:1, need 4.5`);
});

test('contrast: Subspace body text meets WCAG AA', () => {
  const ratio = contrast(token('paper'), token('subspace-bg'));
  assert(ratio >= 4.5, `--paper on --subspace-bg is ${ratio.toFixed(2)}:1, need 4.5`);
});

test('contrast: Subspace accent meets the 3:1 UI component floor', () => {
  const ratio = contrast(token('accent'), token('subspace-bg'));
  assert(ratio >= 3, `--accent on --subspace-bg is ${ratio.toFixed(2)}:1, need 3`);
});

test('contrast: accent is not bright enough for body text, so it must not be used as one', () => {
  // Documents why --accent is borders-only. If someone raises its lightness
  // enough to pass 4.5:1 this test fails and the rule can be revisited.
  const ratio = contrast(token('accent'), token('subspace-bg'));
  assert(ratio < 4.5, 'accent now passes AA for text — update the spec rule');
});
```

- [ ] **Step 3: Register the test and run it to verify it fails**

Replace `tests/node-only.js` with:

```js
// Tests that read files from disk. Node only — browsers cannot import node:fs.
import './content.test.js';
import './contrast.test.js';
```

Run: `node tests/run-node.js`
Expected: FAIL — `ENOENT` for `styles/tokens.css`

- [ ] **Step 4: Write `styles/tokens.css`**

```css
@font-face {
  font-family: 'Press Start 2P';
  src: url('../assets/fonts/PressStart2P.woff2') format('woff2');
  font-display: swap;
  font-weight: 400;
  font-style: normal;
}

:root {
  --sky: #6B8CFF;
  --sand: #E09850;
  --ground: #C84C0C;
  --pipe: #00A800;
  --ink: #201808;
  --paper: #FCFCFC;

  --subspace-bg: #101820;
  --accent: #D82800;

  --bg: var(--sky);
  --panel: var(--sand);
  --panel-edge: var(--ground);
  --text: var(--ink);
  --text-invert: var(--paper);

  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 2rem;
  --space-4: 4rem;

  --font-display: 'Press Start 2P', ui-monospace, 'Courier New', monospace;
  --font-body: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  --pixel: 4px;
  --hud-height: 3rem;
}

/* Subspace: the dark mode joke. Swaps every semantic token at once. */
html[data-subspace='on'] {
  --bg: var(--subspace-bg);
  --panel: #1C2733;
  --panel-edge: var(--accent);
  --text: var(--paper);
  --text-invert: var(--ink);
}
```

- [ ] **Step 5: Write `styles/layout.css`**

```css
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  transition: background-color 200ms linear, color 200ms linear;
}

h1, h2, h3, .hud, .press-start, button {
  font-family: var(--font-display);
  line-height: 1.4;
}

h1 { font-size: clamp(1.25rem, 5vw, 2.5rem); }
h2 { font-size: clamp(1rem, 3vw, 1.5rem); }
h3 { font-size: clamp(0.75rem, 2vw, 1rem); }

.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.skip-link {
  position: absolute;
  left: var(--space-2);
  top: -4rem;
  z-index: 100;
  padding: var(--space-1) var(--space-2);
  background: var(--panel);
  color: var(--text);
  font-family: var(--font-display);
  font-size: 0.7rem;
  transition: top 120ms ease-out;
}
.skip-link:focus { top: var(--space-1); }

:focus-visible {
  outline: var(--pixel) solid var(--ink);
  outline-offset: var(--pixel);
}
html[data-subspace='on'] :focus-visible { outline-color: var(--paper); }

.hud {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--hud-height);
  padding: var(--space-1) var(--space-2);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.7rem;
}
.hud p { margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.hud__plain-cv { margin-left: auto; color: var(--paper); }

.hud button {
  background: transparent;
  border: 2px solid var(--paper);
  color: var(--paper);
  font-size: 0.6rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}

.section {
  max-width: 60rem;
  margin: 0 auto;
  padding: var(--space-4) var(--space-2);
}

.section--title {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
}

.footer {
  padding: var(--space-3) var(--space-2);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.8rem;
  text-align: center;
}

/* Without JS every progressive-enhancement affordance is hidden and every
   panel is open, so the page degrades to a plain readable CV. */
.no-js .hud button,
.no-js #potion,
.no-js #slot-lever,
.no-js .cherry,
.no-js .skills__hint { display: none; }
.no-js .door__panel,
.no-js .sprout__detail,
.no-js .qblock__reveal { display: block !important; }

@media (max-width: 768px) {
  .section { padding: var(--space-3) var(--space-2); }
  .hud { font-size: 0.6rem; gap: var(--space-1); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `25 passed, 0 failed`

The real ratios are `--ink`/`--sand` ≈ 7.34:1, `--paper`/`--subspace-bg` ≈ 17.43:1, `--accent`/`--subspace-bg` ≈ 3.60:1.

- [ ] **Step 7: Commit**

```bash
git add styles/tokens.css styles/layout.css assets/fonts/ tests/contrast.test.js tests/node-only.js
git commit -m "feat: add design tokens, layout, and contrast guard"
```

---

### Task 4: Pixel art sprite sheet

**Files:**
- Create: `assets/sprites.svg`
- Create: `styles/sprites.css`
- Create: `tests/sprites.test.js`
- Modify: `tests/node-only.js`

**Interfaces:**
- Consumes: `<use href="assets/sprites.svg#sprite-NAME">` references written in Task 2.
- Produces: symbols `sprite-heart`, `sprite-coin`, `sprite-cherry`, `sprite-question-block`, `sprite-door`, `sprite-sprout`, `sprite-bobomb`, `sprite-potion`, `sprite-cloud`, `sprite-cactus`, `sprite-shyguy`, `sprite-star`. Classes `.sprite`, `.sprite--cloud`, `.sprite--cactus`.

All art is original, drawn on a 16×16 or 16×24 grid with `shape-rendering="crispEdges"`. Each `<rect>` is a horizontal run of same-coloured pixels.

- [ ] **Step 1: Write the failing sprite reference test**

Create `tests/sprites.test.js`:

```js
import { readFileSync } from 'node:fs';
import { test, assert } from './harness.js';

const base = new URL('../', import.meta.url);
const svg = readFileSync(new URL('assets/sprites.svg', base), 'utf8');
const html = readFileSync(new URL('index.html', base), 'utf8');

function definedIds() {
  const ids = new Set();
  for (const match of svg.matchAll(/<symbol[^>]*\sid="([^"]+)"/g)) ids.add(match[1]);
  return ids;
}

function referencedIds() {
  const ids = new Set();
  for (const match of html.matchAll(/href="assets\/sprites\.svg#([^"]+)"/g)) ids.add(match[1]);
  return ids;
}

test('sprites: every id referenced by index.html is defined', () => {
  const defined = definedIds();
  for (const id of referencedIds()) {
    assert(defined.has(id), `sprites.svg is missing symbol #${id}`);
  }
});

test('sprites: no unused symbols accumulate', () => {
  const referenced = referencedIds();
  // Shy Guy is injected by parallax.js and Star by the cherries.js Starman
  // banner, so neither appears in the static markup. Anything else unused is
  // dead weight and should be deleted.
  const runtimeOnly = new Set(['sprite-shyguy', 'sprite-star']);
  for (const id of definedIds()) {
    assert(
      referenced.has(id) || runtimeOnly.has(id),
      `sprites.svg defines unused symbol #${id}`,
    );
  }
});

test('sprites: art renders with hard pixel edges', () => {
  const symbols = svg.match(/<symbol[\s\S]*?<\/symbol>/g) || [];
  assert(symbols.length >= 12, `expected at least 12 symbols, found ${symbols.length}`);
  for (const symbol of symbols) {
    assert(
      symbol.includes('shape-rendering="crispEdges"'),
      'a symbol is missing shape-rendering="crispEdges"',
    );
  }
});
```

- [ ] **Step 2: Register the test and run it to verify it fails**

Replace `tests/node-only.js` with:

```js
// Tests that read files from disk. Node only — browsers cannot import node:fs.
import './content.test.js';
import './contrast.test.js';
import './sprites.test.js';
```

Run: `node tests/run-node.js`
Expected: FAIL — `ENOENT` for `assets/sprites.svg`

- [ ] **Step 3: Draw the sprite sheet**

Create `assets/sprites.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">

  <symbol id="sprite-heart" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <rect x="3" y="3" width="3" height="1" fill="#D82800"/>
    <rect x="10" y="3" width="3" height="1" fill="#D82800"/>
    <rect x="2" y="4" width="5" height="2" fill="#F87858"/>
    <rect x="9" y="4" width="5" height="2" fill="#F87858"/>
    <rect x="2" y="6" width="12" height="2" fill="#D82800"/>
    <rect x="3" y="8" width="10" height="2" fill="#D82800"/>
    <rect x="4" y="10" width="8" height="1" fill="#D82800"/>
    <rect x="5" y="11" width="6" height="1" fill="#A80000"/>
    <rect x="6" y="12" width="4" height="1" fill="#A80000"/>
    <rect x="7" y="13" width="2" height="1" fill="#A80000"/>
  </symbol>

  <symbol id="sprite-coin" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <rect x="6" y="2" width="4" height="1" fill="#C87800"/>
    <rect x="5" y="3" width="6" height="1" fill="#FCE000"/>
    <rect x="4" y="4" width="8" height="8" fill="#FCE000"/>
    <rect x="7" y="5" width="2" height="6" fill="#C87800"/>
    <rect x="5" y="12" width="6" height="1" fill="#FCE000"/>
    <rect x="6" y="13" width="4" height="1" fill="#C87800"/>
  </symbol>

  <symbol id="sprite-cherry" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <rect x="8" y="1" width="1" height="4" fill="#00A800"/>
    <rect x="9" y="2" width="3" height="1" fill="#00A800"/>
    <rect x="5" y="5" width="1" height="3" fill="#008000"/>
    <rect x="10" y="5" width="1" height="3" fill="#008000"/>
    <rect x="2" y="8" width="5" height="5" fill="#D82800"/>
    <rect x="9" y="8" width="5" height="5" fill="#D82800"/>
    <rect x="3" y="9" width="2" height="2" fill="#F87858"/>
    <rect x="10" y="9" width="2" height="2" fill="#F87858"/>
  </symbol>

  <symbol id="sprite-question-block" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <rect x="0" y="0" width="16" height="16" fill="#E09850"/>
    <rect x="0" y="0" width="16" height="2" fill="#FCE000"/>
    <rect x="0" y="14" width="16" height="2" fill="#C84C0C"/>
    <rect x="0" y="0" width="2" height="16" fill="#FCE000"/>
    <rect x="14" y="0" width="2" height="16" fill="#C84C0C"/>
    <rect x="5" y="4" width="6" height="2" fill="#201808"/>
    <rect x="9" y="6" width="2" height="2" fill="#201808"/>
    <rect x="7" y="8" width="2" height="2" fill="#201808"/>
    <rect x="7" y="12" width="2" height="2" fill="#201808"/>
  </symbol>

  <symbol id="sprite-door" viewBox="0 0 16 24" shape-rendering="crispEdges">
    <rect x="1" y="2" width="14" height="22" fill="#C84C0C"/>
    <rect x="3" y="4" width="10" height="20" fill="#E09850"/>
    <rect x="3" y="4" width="10" height="1" fill="#FCE000"/>
    <rect x="11" y="14" width="2" height="2" fill="#FCE000"/>
    <rect x="6" y="8" width="4" height="4" fill="#201808"/>
  </symbol>

  <symbol id="sprite-sprout" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <rect x="7" y="4" width="2" height="8" fill="#008000"/>
    <rect x="3" y="6" width="4" height="2" fill="#00A800"/>
    <rect x="2" y="8" width="5" height="1" fill="#00A800"/>
    <rect x="9" y="6" width="4" height="2" fill="#00A800"/>
    <rect x="9" y="8" width="5" height="1" fill="#00A800"/>
    <rect x="0" y="12" width="16" height="4" fill="#E09850"/>
    <rect x="0" y="12" width="16" height="1" fill="#00A800"/>
  </symbol>

  <symbol id="sprite-bobomb" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <rect x="9" y="1" width="2" height="1" fill="#FCE000"/>
    <rect x="8" y="2" width="1" height="2" fill="#C87800"/>
    <rect x="4" y="5" width="8" height="1" fill="#201808"/>
    <rect x="3" y="6" width="10" height="7" fill="#201808"/>
    <rect x="4" y="13" width="8" height="1" fill="#201808"/>
    <rect x="5" y="8" width="2" height="2" fill="#FCFCFC"/>
    <rect x="9" y="8" width="2" height="2" fill="#FCFCFC"/>
    <rect x="2" y="10" width="1" height="3" fill="#FCE000"/>
    <rect x="13" y="10" width="1" height="3" fill="#FCE000"/>
  </symbol>

  <symbol id="sprite-potion" viewBox="0 0 16 24" shape-rendering="crispEdges">
    <rect x="6" y="2" width="4" height="3" fill="#C87800"/>
    <rect x="5" y="5" width="6" height="2" fill="#E09850"/>
    <rect x="4" y="7" width="8" height="3" fill="#FCFCFC"/>
    <rect x="3" y="10" width="10" height="11" fill="#A800A8"/>
    <rect x="4" y="21" width="8" height="1" fill="#780078"/>
    <rect x="5" y="12" width="2" height="2" fill="#F878F8"/>
  </symbol>

  <symbol id="sprite-cloud" viewBox="0 0 32 16" shape-rendering="crispEdges">
    <rect x="8" y="3" width="6" height="3" fill="#FCFCFC"/>
    <rect x="16" y="4" width="6" height="2" fill="#FCFCFC"/>
    <rect x="4" y="6" width="24" height="4" fill="#FCFCFC"/>
    <rect x="2" y="8" width="28" height="3" fill="#FCFCFC"/>
    <rect x="2" y="11" width="28" height="1" fill="#B8D0F8"/>
  </symbol>

  <symbol id="sprite-cactus" viewBox="0 0 16 24" shape-rendering="crispEdges">
    <rect x="6" y="2" width="4" height="22" fill="#00A800"/>
    <rect x="2" y="8" width="4" height="2" fill="#00A800"/>
    <rect x="2" y="10" width="2" height="6" fill="#00A800"/>
    <rect x="10" y="12" width="4" height="2" fill="#00A800"/>
    <rect x="12" y="14" width="2" height="5" fill="#00A800"/>
    <rect x="6" y="2" width="1" height="22" fill="#008000"/>
  </symbol>

  <symbol id="sprite-shyguy" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <rect x="5" y="1" width="6" height="2" fill="#D82800"/>
    <rect x="4" y="3" width="8" height="5" fill="#F87858"/>
    <rect x="6" y="5" width="1" height="2" fill="#201808"/>
    <rect x="9" y="5" width="1" height="2" fill="#201808"/>
    <rect x="4" y="8" width="8" height="5" fill="#D82800"/>
    <rect x="3" y="9" width="1" height="3" fill="#F87858"/>
    <rect x="12" y="9" width="1" height="3" fill="#F87858"/>
    <rect x="5" y="13" width="2" height="2" fill="#201808"/>
    <rect x="9" y="13" width="2" height="2" fill="#201808"/>
  </symbol>

  <symbol id="sprite-star" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <rect x="7" y="1" width="2" height="3" fill="#FCE000"/>
    <rect x="6" y="4" width="4" height="2" fill="#FCE000"/>
    <rect x="1" y="6" width="14" height="2" fill="#FCE000"/>
    <rect x="3" y="8" width="10" height="3" fill="#FCE000"/>
    <rect x="4" y="11" width="3" height="4" fill="#FCE000"/>
    <rect x="9" y="11" width="3" height="4" fill="#FCE000"/>
    <rect x="5" y="7" width="2" height="2" fill="#201808"/>
    <rect x="9" y="7" width="2" height="2" fill="#201808"/>
  </symbol>

</svg>
```

- [ ] **Step 4: Write `styles/sprites.css`**

```css
.sprite {
  display: inline-block;
  vertical-align: middle;
  image-rendering: pixelated;
  flex: none;
}

.hud .sprite { width: 1rem; height: 1rem; }
.qblock .sprite { width: 2.5rem; height: 2.5rem; }
.door .sprite { width: 2rem; height: 2.75rem; }
.sprout .sprite { width: 2rem; height: 2rem; }
#potion .sprite { width: 1.5rem; height: 2.25rem; }
.cherry .sprite { width: 1.5rem; height: 1.5rem; }

.scenery {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.sprite--cloud {
  position: absolute;
  top: 12%;
  left: 8%;
  width: 6rem;
  height: 3rem;
}
.sprite--cactus {
  position: absolute;
  bottom: 6%;
  right: 12%;
  width: 3rem;
  height: 4.5rem;
}

/* Shy Guys are injected by parallax.js and walk along the ground line. */
.shyguy {
  position: absolute;
  bottom: 0;
  width: 2rem;
  height: 2rem;
  animation: shyguy-walk 14s linear infinite;
}
@keyframes shyguy-walk {
  from { transform: translateX(-3rem) scaleX(1); }
  49%  { transform: translateX(calc(100vw + 3rem)) scaleX(1); }
  50%  { transform: translateX(calc(100vw + 3rem)) scaleX(-1); }
  to   { transform: translateX(-3rem) scaleX(-1); }
}

@keyframes coin-pop {
  from { transform: translateY(0) scale(1); opacity: 1; }
  to   { transform: translateY(-2rem) scale(1.3); opacity: 0; }
}

@keyframes block-punch {
  0%, 100% { transform: translateY(0); }
  40%      { transform: translateY(-0.6rem); }
}

@keyframes screen-shake {
  0%, 100% { transform: translate(0, 0); }
  25%      { transform: translate(-4px, 2px); }
  75%      { transform: translate(4px, -2px); }
}

@media (prefers-reduced-motion: reduce) {
  .shyguy { display: none; }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `28 passed, 0 failed`

- [ ] **Step 6: Verify the art renders**

Run: `python3 -m http.server 8000`, open `http://localhost:8000/`.
Expected: hearts, coin and cherry icons visible in the HUD; `?` blocks, doors, sprouts and the potion all render as pixel art with hard edges.

- [ ] **Step 7: Commit**

```bash
git add assets/sprites.svg styles/sprites.css tests/sprites.test.js tests/node-only.js
git commit -m "feat: add original pixel art sprite sheet"
```

---

### Task 5: HUD — hearts, counters, sound toggle

**Files:**
- Create: `scripts/hud.js`
- Create: `tests/hud.test.js`
- Modify: `tests/all.js`

**Interfaces:**
- Consumes: `state.get/set/subscribe`; DOM classes `.hud__hearts`, `.hud__coin-count`, `.hud__cherry-count`, `#sound-toggle`.
- Produces: `heartsForScroll(fraction) -> number` (pure, 0–3), `initHud(root)`.

- [ ] **Step 1: Write the failing test**

Create `tests/hud.test.js`:

```js
import { test, assertEqual } from './harness.js';
import { heartsForScroll } from '../scripts/hud.js';

test('hud: no hearts at the top of the page', () => {
  assertEqual(heartsForScroll(0), 0, 'fraction 0');
});

test('hud: hearts fill as the page scrolls', () => {
  assertEqual(heartsForScroll(0.34), 2, 'fraction 0.34');
  assertEqual(heartsForScroll(0.2), 1, 'fraction 0.2');
  assertEqual(heartsForScroll(0.7), 3, 'fraction 0.7');
});

test('hud: all three hearts at the bottom', () => {
  assertEqual(heartsForScroll(1), 3, 'fraction 1');
});

test('hud: out-of-range input is clamped', () => {
  assertEqual(heartsForScroll(-2), 0, 'negative fraction');
  assertEqual(heartsForScroll(5), 3, 'fraction above 1');
});
```

- [ ] **Step 2: Register and run to verify it fails**

Replace `tests/all.js` with:

```js
import './state.test.js';
import './hud.test.js';
```

Run: `node tests/run-node.js`
Expected: FAIL — `Cannot find module .../scripts/hud.js`

- [ ] **Step 3: Implement `scripts/hud.js`**

```js
import * as state from './state.js';

export const TOTAL_HEARTS = 3;

/** Maps a 0–1 scroll fraction to a filled-heart count. Pure. */
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

  state.subscribe('coins', (value) => { coinCount.textContent = String(value); });
  state.subscribe('cherries', (value) => { cherryCount.textContent = String(value.length); });

  // The toggle is absent when the browser has no Web Audio support, so every
  // reference to it is guarded rather than assumed.
  if (soundToggle) {
    function paintToggle(value) {
      soundToggle.setAttribute('aria-pressed', String(value));
      soundToggle.textContent = value ? 'Sound: on' : 'Sound: off';
    }
    state.subscribe('soundOn', paintToggle);
    soundToggle.addEventListener('click', () => {
      state.set('soundOn', !state.get('soundOn'));
    });
    paintToggle(state.get('soundOn'));
  }

  // Reflect any hydrated values that were set before these listeners existed.
  coinCount.textContent = String(state.get('coins'));
  cherryCount.textContent = String(state.get('cherries').length);

  window.addEventListener('scroll', paintHearts, { passive: true });
  window.addEventListener('resize', paintHearts, { passive: true });
  paintHearts();
}

/** Awards coins from anywhere in the app. */
export function addCoins(amount = 1) {
  state.set('coins', state.get('coins') + amount);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `32 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add scripts/hud.js tests/hud.test.js tests/all.js
git commit -m "feat: add HUD with scroll-driven heart meter"
```

---

### Task 6: Audio engine with graceful degradation

**Files:**
- Create: `scripts/audio.js`
- Create: `tests/audio.test.js`
- Modify: `tests/all.js`

**Interfaces:**
- Consumes: `state.get('soundOn')`.
- Produces: `createAudio(ContextCtor) -> { available, unlock(), play(name) }`. Sound names: `coin`, `punch`, `pull`, `door`, `bobomb`, `star`, `reel`.

The `ContextCtor` parameter is what makes this testable — tests pass a fake or `undefined` instead of a real `AudioContext`.

- [ ] **Step 1: Write the failing test**

Create `tests/audio.test.js`:

```js
import { test, assert, assertEqual } from './harness.js';
import { createAudio, SOUNDS } from '../scripts/audio.js';

test('audio: reports unavailable when the browser has no AudioContext', () => {
  const audio = createAudio(undefined);
  assertEqual(audio.available, false, 'available flag');
});

test('audio: play is a safe no-op when unavailable', () => {
  const audio = createAudio(undefined);
  audio.play('coin');
  audio.unlock();
  assert(true, 'no exception thrown');
});

test('audio: reports unavailable when constructing the context throws', () => {
  function ThrowingContext() { throw new Error('blocked by policy'); }
  const audio = createAudio(ThrowingContext);
  assertEqual(audio.unlock(), false, 'unlock reports failure');
  audio.play('coin');
  assert(true, 'play did not throw after a failed unlock');
});

test('audio: creates an oscillator per sound once unlocked', () => {
  const started = [];
  const fake = fakeContextFactory(started);
  const audio = createAudio(fake);
  assertEqual(audio.unlock(), true, 'unlock succeeded');
  audio.play('coin');
  assertEqual(started.length, 1, 'one oscillator started');
});

test('audio: unknown sound names are ignored', () => {
  const started = [];
  const audio = createAudio(fakeContextFactory(started));
  audio.unlock();
  audio.play('not-a-real-sound');
  assertEqual(started.length, 0, 'nothing started');
});

test('audio: every named sound has a definition', () => {
  for (const name of ['coin', 'punch', 'pull', 'door', 'bobomb', 'star', 'reel']) {
    assert(SOUNDS[name], `missing sound definition: ${name}`);
  }
});

function fakeContextFactory(started) {
  return function FakeContext() {
    return {
      state: 'running',
      currentTime: 0,
      destination: {},
      resume() {},
      createOscillator() {
        return {
          type: 'square',
          frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {},
          start() { started.push(true); },
          stop() {},
        };
      },
      createGain() {
        return {
          gain: {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
            linearRampToValueAtTime() {},
          },
          connect() {},
        };
      },
    };
  };
}
```

- [ ] **Step 2: Register and run to verify it fails**

Replace `tests/all.js` with:

```js
import './state.test.js';
import './hud.test.js';
import './audio.test.js';
```

Run: `node tests/run-node.js`
Expected: FAIL — `Cannot find module .../scripts/audio.js`

- [ ] **Step 3: Implement `scripts/audio.js`**

```js
import * as state from './state.js';

/**
 * Each sound is a square-wave blip: a start frequency, an optional glide
 * target, and a duration in seconds. No audio files, so nothing to license.
 */
export const SOUNDS = {
  coin:   { type: 'square',   from: 988,  to: 1319, seconds: 0.12, gain: 0.15 },
  punch:  { type: 'square',   from: 220,  to: 110,  seconds: 0.08, gain: 0.2 },
  pull:   { type: 'triangle', from: 330,  to: 660,  seconds: 0.18, gain: 0.18 },
  door:   { type: 'square',   from: 440,  to: 220,  seconds: 0.22, gain: 0.16 },
  bobomb: { type: 'sawtooth', from: 160,  to: 40,   seconds: 0.35, gain: 0.22 },
  star:   { type: 'square',   from: 660,  to: 1320, seconds: 0.5,  gain: 0.18 },
  reel:   { type: 'square',   from: 880,  to: 880,  seconds: 0.06, gain: 0.12 },
};

export function createAudio(
  ContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext,
) {
  if (typeof ContextCtor !== 'function') {
    return { available: false, unlock: () => false, play: () => {} };
  }

  let context = null;
  let broken = false;

  function unlock() {
    if (broken) return false;
    try {
      if (!context) context = new ContextCtor();
      if (context.state === 'suspended') context.resume();
      return true;
    } catch {
      broken = true;
      return false;
    }
  }

  function play(name) {
    if (broken || !state.get('soundOn')) return;
    const sound = SOUNDS[name];
    if (!sound) return;
    if (!unlock()) return;

    try {
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.from, now);
      if (sound.to !== sound.from) {
        oscillator.frequency.exponentialRampToValueAtTime(sound.to, now + sound.seconds);
      }

      gain.gain.setValueAtTime(sound.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + sound.seconds);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + sound.seconds);
    } catch {
      broken = true;
    }
  }

  return { available: true, unlock, play };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `38 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add scripts/audio.js tests/audio.test.js tests/all.js
git commit -m "feat: add Web Audio chiptune engine"
```

---

### Task 7: Question blocks and experience doors

**Files:**
- Create: `scripts/blocks.js`
- Create: `tests/blocks.test.js`
- Modify: `tests/all.js`
- Create: `styles/sections.css`

**Interfaces:**
- Consumes: `state`, `addCoins` from `hud.js`, `audio.play`.
- Produces: `punchCount(current)` (pure), `CHERRY_PUNCH_THRESHOLD`, `initBlocks(root, audio)`, `initDoors(root, audio)`.

- [ ] **Step 1: Write the failing test**

Create `tests/blocks.test.js`:

```js
import { test, assertEqual } from './harness.js';
import { punchCount, CHERRY_PUNCH_THRESHOLD } from '../scripts/blocks.js';

test('blocks: punches accumulate', () => {
  assertEqual(punchCount(0), 1, 'first punch');
  assertEqual(punchCount(1), 2, 'second punch');
});

test('blocks: the cherry appears on the third punch', () => {
  assertEqual(CHERRY_PUNCH_THRESHOLD, 3, 'threshold');
  assertEqual(punchCount(2), CHERRY_PUNCH_THRESHOLD, 'third punch hits threshold');
});

test('blocks: punching past the threshold keeps counting without error', () => {
  assertEqual(punchCount(9), 10, 'tenth punch');
});
```

- [ ] **Step 2: Register and run to verify it fails**

Replace `tests/all.js` with:

```js
import './state.test.js';
import './hud.test.js';
import './audio.test.js';
import './blocks.test.js';
```

Run: `node tests/run-node.js`
Expected: FAIL — `Cannot find module .../scripts/blocks.js`

- [ ] **Step 3: Implement `scripts/blocks.js`**

```js
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
```

- [ ] **Step 4: Write `styles/sections.css`**

```css
.press-start {
  display: inline-block;
  margin-top: var(--space-3);
  padding: var(--space-1) var(--space-2);
  background: var(--panel);
  border: var(--pixel) solid var(--panel-edge);
  color: var(--text);
  text-decoration: none;
  font-size: 0.8rem;
  animation: press-start-blink 1.4s steps(2) infinite;
}
@keyframes press-start-blink { 50% { opacity: 0.35; } }

.subtitle { font-size: 1.1rem; max-width: 30rem; }

.qblocks, .doors, .plaques, .sprouts, .slot__reels {
  list-style: none;
  margin: 0;
  padding: 0;
}

.qblocks { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
.qblocks li { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-1); max-width: 16rem; }
.qblock { background: none; border: 0; padding: 0; cursor: pointer; }
.qblock__reveal { font-size: 0.9rem; }

#potion {
  margin-top: var(--space-3);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  background: var(--panel);
  border: var(--pixel) solid var(--panel-edge);
  color: var(--text);
  padding: var(--space-1) var(--space-2);
  font-size: 0.7rem;
  cursor: pointer;
}

.boss-card {
  position: relative;
  background: var(--panel);
  border: var(--pixel) solid var(--panel-edge);
  padding: var(--space-3);
  box-shadow: 0 var(--pixel) 0 var(--panel-edge);
}
.boss-card__year { float: right; font-size: 0.7rem; }
.boss-card__lede { font-size: 1.1rem; font-weight: 600; }
.boss-card__stack { font-family: var(--font-display); font-size: 0.6rem; }

.doors li { border-bottom: 2px solid var(--panel-edge); }
.door {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: 'icon role when' 'icon where when';
  gap: 0 var(--space-2);
  align-items: center;
  width: 100%;
  padding: var(--space-2) 0;
  background: none;
  border: 0;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}
.door .sprite { grid-area: icon; }
.door__role  { grid-area: role; font-size: 0.8rem; }
.door__where { grid-area: where; font-family: var(--font-body); font-size: 0.9rem; }
.door__when  { grid-area: when; font-size: 0.6rem; }
.door__panel { padding: 0 0 var(--space-2) var(--space-4); }
.door__note { font-size: 0.85rem; font-style: italic; }

.plaques { display: grid; gap: var(--space-2); }
.plaque {
  background: var(--panel);
  border: var(--pixel) solid var(--panel-edge);
  padding: var(--space-2);
}
.plaque h3 { margin: 0 0 var(--space-1); }
.plaque p { margin: 0; }
.plaque__where { font-weight: 600; }

.languages { font-size: 1.05rem; }
.skills__hint { font-size: 0.9rem; opacity: 0.85; }
.sprouts { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-3); }
.sprouts li { display: flex; flex-direction: column; gap: var(--space-1); max-width: 14rem; }
.sprout {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: none;
  border: 0;
  color: var(--text);
  font-size: 0.7rem;
  cursor: grab;
  touch-action: none;
  transition: transform 120ms ease-out;
}
.sprout[aria-expanded='true'] { cursor: default; }
.sprout__detail { font-family: var(--font-body); font-size: 0.9rem; }

.slot {
  position: relative;
  background: var(--panel);
  border: var(--pixel) solid var(--panel-edge);
  padding: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.slot__reels { display: flex; flex: 1; gap: var(--space-2); }
.slot__reel {
  flex: 1;
  background: var(--text);
  color: var(--text-invert);
  padding: var(--space-2);
  text-align: center;
  overflow: hidden;
}
.slot__reel a { color: inherit; display: block; font-size: 0.85rem; word-break: break-word; }
.slot__symbol { display: block; font-size: 1.5rem; }
.slot__reel--spinning { animation: reel-spin 120ms steps(2) infinite; }
@keyframes reel-spin { 50% { transform: translateY(-0.5rem); opacity: 0.6; } }

#slot-lever {
  background: var(--panel-edge);
  border: var(--pixel) solid var(--text);
  color: var(--text-invert);
  padding: var(--space-2);
  cursor: pointer;
}

.cherry { background: none; border: 0; padding: 0; cursor: pointer; }
.cherry[hidden] { display: none; }

@media (max-width: 768px) {
  .door { grid-template-columns: auto 1fr; grid-template-areas: 'icon role' 'icon where' 'icon when'; }
  .door__panel { padding-left: var(--space-3); }
  .slot { flex-direction: column; }
  .slot__reels { flex-direction: column; width: 100%; }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `41 passed, 0 failed`

- [ ] **Step 6: Commit**

```bash
git add scripts/blocks.js tests/blocks.test.js tests/all.js styles/sections.css
git commit -m "feat: add question blocks, experience doors, and section styling"
```

---

### Task 8: Skill sprouts

**Files:**
- Create: `scripts/veggies.js`
- Create: `tests/veggies.test.js`
- Modify: `tests/all.js`

**Interfaces:**
- Consumes: `addCoins`, `audio.play`, DOM class `.sprout` with `data-skill`.
- Produces: `PULL_THRESHOLD_PX`, `pullProgress(startY, currentY) -> 0..1`, `isPulled(progress) -> boolean`, `initVeggies(root, audio)`.

- [ ] **Step 1: Write the failing test**

Create `tests/veggies.test.js`:

```js
import { test, assertEqual } from './harness.js';
import { pullProgress, isPulled, PULL_THRESHOLD_PX } from '../scripts/veggies.js';

test('veggies: dragging downward does not pull', () => {
  assertEqual(pullProgress(100, 140), 0, 'downward drag');
  assertEqual(pullProgress(100, 100), 0, 'no movement');
});

test('veggies: dragging upward accumulates progress', () => {
  // Screen Y decreases as the pointer moves up.
  assertEqual(pullProgress(100, 100 - PULL_THRESHOLD_PX / 2), 0.5, 'half pull');
});

test('veggies: reaching the threshold completes the pull', () => {
  assertEqual(pullProgress(100, 100 - PULL_THRESHOLD_PX), 1, 'full pull');
});

test('veggies: progress is clamped at 1', () => {
  assertEqual(pullProgress(100, -500), 1, 'over-pull clamped');
});

test('veggies: isPulled only at full progress', () => {
  assertEqual(isPulled(0.99), false, 'not quite');
  assertEqual(isPulled(1), true, 'complete');
});
```

- [ ] **Step 2: Register and run to verify it fails**

Add `import './veggies.test.js';` to `tests/all.js`.

Run: `node tests/run-node.js`
Expected: FAIL — `Cannot find module .../scripts/veggies.js`

- [ ] **Step 3: Implement `scripts/veggies.js`**

```js
import { addCoins } from './hud.js';

export const PULL_THRESHOLD_PX = 60;

/** Pure: how far along a pull is, 0–1. Upward movement decreases screen Y. */
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `46 passed, 0 failed`

- [ ] **Step 5: Verify both input paths in a browser**

Run `python3 -m http.server 8000`, open the Skills section.
Expected: dragging a sprout upward roughly 60px pops it and reveals the detail; tabbing to a sprout and pressing Enter does the same; the Bob-omb shakes the page.

- [ ] **Step 6: Commit**

```bash
git add scripts/veggies.js tests/veggies.test.js tests/all.js
git commit -m "feat: add drag-to-pull skill sprouts"
```

---

### Task 9: Subspace dark mode

**Files:**
- Create: `scripts/subspace.js`
- Create: `tests/subspace.test.js`
- Modify: `tests/all.js`

**Interfaces:**
- Consumes: `state`, `audio.play`, `#potion` button, `.cherry--subspace`.
- Produces: `initialSubspace(stored, prefersDark) -> boolean`, `initSubspace(root, audio)`.

- [ ] **Step 1: Write the failing test**

Create `tests/subspace.test.js`:

```js
import { test, assertEqual } from './harness.js';
import { initialSubspace } from '../scripts/subspace.js';

test('subspace: a stored preference wins over the system setting', () => {
  assertEqual(initialSubspace(true, false), true, 'stored on, system light');
  assertEqual(initialSubspace(false, true), false, 'stored off, system dark');
});

test('subspace: with no stored preference the system setting decides', () => {
  assertEqual(initialSubspace(undefined, true), true, 'system dark');
  assertEqual(initialSubspace(undefined, false), false, 'system light');
});

test('subspace: non-boolean stored values are ignored', () => {
  assertEqual(initialSubspace(null, true), true, 'null stored');
  assertEqual(initialSubspace('yes', false), false, 'string stored');
});
```

- [ ] **Step 2: Register and run to verify it fails**

Add `import './subspace.test.js';` to `tests/all.js`.

Run: `node tests/run-node.js`
Expected: FAIL — `Cannot find module .../scripts/subspace.js`

- [ ] **Step 3: Implement `scripts/subspace.js`**

```js
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
    // Cherry #4 only exists in Subspace — the reward for finding the joke.
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `49 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add scripts/subspace.js tests/subspace.test.js tests/all.js
git commit -m "feat: add potion-triggered Subspace dark mode"
```

---

### Task 10: Cherry hunt and Starman

**Files:**
- Create: `scripts/cherries.js`
- Create: `tests/cherries.test.js`
- Modify: `tests/all.js`

**Interfaces:**
- Consumes: `state`, `addCoins`, `audio.play`, `.cherry[data-cherry-id]`.
- Produces: `TOTAL_CHERRIES`, `STARMAN_MS`, `addCherry(id) -> boolean`, `initCherries(root, audio)`.

- [ ] **Step 1: Write the failing test**

Create `tests/cherries.test.js`:

```js
import { test, assert, assertEqual } from './harness.js';
import * as state from '../scripts/state.js';
import { addCherry, TOTAL_CHERRIES } from '../scripts/cherries.js';

test('cherries: there are five to find', () => {
  assertEqual(TOTAL_CHERRIES, 5, 'total');
});

test('cherries: collecting one records it', () => {
  state.reset();
  assertEqual(addCherry('a'), true, 'first collect succeeds');
  assertEqual(state.get('cherries'), ['a'], 'stored');
});

test('cherries: the same cherry cannot be counted twice', () => {
  state.reset();
  addCherry('a');
  assertEqual(addCherry('a'), false, 'duplicate rejected');
  assertEqual(state.get('cherries'), ['a'], 'still one');
});

test('cherries: Starman fires exactly at five', () => {
  state.reset();
  for (const id of ['a', 'b', 'c', 'd']) addCherry(id);
  assertEqual(state.get('starman'), false, 'not yet at four');
  addCherry('e');
  assertEqual(state.get('starman'), true, 'fired at five');
  assertEqual(state.get('cherries').length, 5, 'all five stored');
});

test('cherries: Starman does not re-fire on a duplicate after five', () => {
  state.reset();
  for (const id of ['a', 'b', 'c', 'd', 'e']) addCherry(id);
  let fires = 0;
  state.subscribe('starman', () => { fires += 1; });
  addCherry('a');
  assertEqual(fires, 0, 'no extra starman notification');
});

test('cherries: each collect awards a coin', () => {
  state.reset();
  addCherry('a');
  addCherry('b');
  assert(state.get('coins') >= 2, 'coins awarded');
});
```

- [ ] **Step 2: Register and run to verify it fails**

Add `import './cherries.test.js';` to `tests/all.js`.

Run: `node tests/run-node.js`
Expected: FAIL — `Cannot find module .../scripts/cherries.js`

- [ ] **Step 3: Implement `scripts/cherries.js`**

```js
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
```

- [ ] **Step 4: Add the Starman styling**

Append to `styles/sections.css`:

```css
/* Colour cycling is capped at 3 Hz. Faster flashing is a seizure risk, so the
   step count and duration below must not be increased. */
@keyframes starman-cycle {
  0%   { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

html[data-starman='on'] body {
  animation: starman-cycle 1.5s steps(4) infinite;
}

/* Reduced-motion visitors get a static gold tint and the banner instead. */
html[data-starman='static'] body {
  filter: sepia(0.6) saturate(1.6) hue-rotate(-15deg);
}

.starman-banner {
  position: fixed;
  left: 50%;
  bottom: var(--space-3);
  transform: translateX(-50%);
  z-index: 60;
  margin: 0;
  padding: var(--space-1) var(--space-2);
  background: var(--ink);
  color: #FCE000;
  border: var(--pixel) solid #FCE000;
  font-family: var(--font-display);
  font-size: 0.7rem;
  text-align: center;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `55 passed, 0 failed`

- [ ] **Step 6: Commit**

```bash
git add scripts/cherries.js tests/cherries.test.js tests/all.js styles/sections.css
git commit -m "feat: add cherry hunt and Starman mode"
```

---

### Task 11: Contact slot machine

**Files:**
- Create: `scripts/slots.js`
- Create: `tests/slots.test.js`
- Modify: `tests/all.js`

**Interfaces:**
- Consumes: `audio.play`, `.slot__reel`, `#slot-lever`.
- Produces: `REEL_IDS`, `spinPlan(random) -> [{id, stopMs}]`, `initSlots(root, audio)`.

The contract this task must not break: the reels are decoration over real anchors. Randomness affects only how long each reel spins, never where it lands.

- [ ] **Step 1: Write the failing test**

Create `tests/slots.test.js`:

```js
import { test, assert, assertEqual } from './harness.js';
import { spinPlan, REEL_IDS } from '../scripts/slots.js';

test('slots: three reels in a fixed order', () => {
  assertEqual(REEL_IDS, ['email', 'linkedin', 'cv'], 'reel ids');
});

test('slots: reels always land on the real targets, whatever the random seed', () => {
  const seeds = [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1];
  for (const seed of seeds) {
    const plan = spinPlan(() => seed);
    assertEqual(plan.map((r) => r.id), REEL_IDS, `landing for seed ${seed}`);
  }
});

test('slots: reels stop left to right', () => {
  const plan = spinPlan(() => 0.5);
  for (let i = 1; i < plan.length; i += 1) {
    assert(
      plan[i].stopMs > plan[i - 1].stopMs,
      `reel ${i} should stop after reel ${i - 1}`,
    );
  }
});

test('slots: every reel stops within two seconds', () => {
  const plan = spinPlan(() => 1);
  for (const reel of plan) {
    assert(reel.stopMs <= 2000, `stopMs ${reel.stopMs} is too slow`);
  }
});
```

- [ ] **Step 2: Register and run to verify it fails**

Add `import './slots.test.js';` to `tests/all.js`.

Run: `node tests/run-node.js`
Expected: FAIL — `Cannot find module .../scripts/slots.js`

- [ ] **Step 3: Implement `scripts/slots.js`**

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `59 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add scripts/slots.js tests/slots.test.js tests/all.js
git commit -m "feat: add contact slot machine"
```

---

### Task 12: Parallax scenery and Shy Guys

**Files:**
- Create: `scripts/parallax.js`
- Create: `tests/parallax.test.js`
- Modify: `tests/all.js`

**Interfaces:**
- Consumes: `.scenery`, `.sprite--cloud`, `.sprite--cactus`.
- Produces: `parallaxOffset(scrollY, depth) -> number`, `initParallax(root)`.

- [ ] **Step 1: Write the failing test**

Create `tests/parallax.test.js`:

```js
import { test, assertEqual } from './harness.js';
import { parallaxOffset } from '../scripts/parallax.js';

test('parallax: nothing moves at the top', () => {
  assertEqual(parallaxOffset(0, 0.5), 0, 'no scroll');
});

test('parallax: deeper layers move less', () => {
  const near = parallaxOffset(100, 0.5);
  const far = parallaxOffset(100, 0.1);
  assertEqual(near, 50, 'near layer');
  assertEqual(far, 10, 'far layer');
});

test('parallax: depth of zero pins a layer in place', () => {
  assertEqual(parallaxOffset(500, 0), 0, 'pinned layer');
});
```

- [ ] **Step 2: Register and run to verify it fails**

Add `import './parallax.test.js';` to `tests/all.js`.

Run: `node tests/run-node.js`
Expected: FAIL — `Cannot find module .../scripts/parallax.js`

- [ ] **Step 3: Implement `scripts/parallax.js`**

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/run-node.js`
Expected: PASS — `62 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add scripts/parallax.js tests/parallax.test.js tests/all.js
git commit -m "feat: add parallax scenery and patrolling Shy Guys"
```

---

### Task 13: Boot, integration, and final verification

**Files:**
- Create: `scripts/main.js`
- Create: `README.md`

**Interfaces:**
- Consumes: every module's `init*` function.
- Produces: the running site.

- [ ] **Step 1: Write `scripts/main.js`**

```js
import * as state from './state.js';
import { createAudio } from './audio.js';
import { initHud } from './hud.js';
import { initBlocks, initDoors } from './blocks.js';
import { initVeggies } from './veggies.js';
import { initSubspace, initialSubspace } from './subspace.js';
import { initCherries } from './cherries.js';
import { initSlots } from './slots.js';
import { initParallax } from './parallax.js';

function boot() {
  state.hydrate();

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const stored = state.get('subspace');
  state.set('subspace', initialSubspace(stored, prefersDark));

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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
```

- [ ] **Step 2: Run the full test suite**

Run: `node tests/run-node.js`
Expected: PASS — `62 passed, 0 failed`, exit code 0

- [ ] **Step 3: Verify the browser test runner agrees**

Run `python3 -m http.server 8000`, open `http://localhost:8000/test.html`.
Expected: the universal tests pass in the browser too (the three file-reading suites do not run here, so the count is lower than Node's).

- [ ] **Step 4: Walk the manual checklist**

Open `http://localhost:8000/` and confirm each of these:

- [ ] Hearts fill as you scroll; all three are full at the bottom.
- [ ] Punching a `?` block reveals its text, awards a coin, and animates.
- [ ] The leftmost `?` block reveals a cherry on the third punch.
- [ ] Each of the six doors opens and closes, and `aria-expanded` flips.
- [ ] Dragging a sprout up ~60px pulls it; Enter on a focused sprout does the same.
- [ ] The Bob-omb sprout shakes the page.
- [ ] The potion toggles Subspace; the palette inverts; the label changes.
- [ ] The Subspace-only cherry appears in Education only while Subspace is on.
- [ ] Collecting all five cherries triggers Starman for 8 seconds with a banner.
- [ ] The slot lever spins the reels and they stop left to right.
- [ ] The sound toggle turns audio on, and sounds actually play.
- [ ] Reloading keeps the sound and Subspace settings.

- [ ] **Step 5: Verify accessibility and degradation**

- [ ] Tab through the whole page: every control is reachable and has a visible focus ring.
- [ ] In DevTools, emulate `prefers-reduced-motion: reduce` — no parallax, no Shy Guys, no shake, and Starman shows the static gold tint instead of cycling.
- [ ] In DevTools, emulate `prefers-color-scheme: dark` with storage cleared — the page starts in Subspace.
- [ ] Disable JavaScript and reload — the full CV is readable, all panels open, and no dead game controls are visible.
- [ ] Run Lighthouse. Expected: accessibility ≥ 95. Fix anything it flags before committing.
- [ ] Resize to 375px wide — single column, no horizontal scrolling, doors and slot machine stack.

- [ ] **Step 6: Write `README.md`**

```markdown
# Robin Elvius — Portfolio

A personal portfolio site presenting my CV, themed as *Super Mario Bros 2*.

**Live:** https://robincesar.github.io/Mario-portfolio/

## Running it locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

A plain server is needed because the scripts are ES modules, which browsers
refuse to load over `file://`.

## Tests

```bash
node tests/run-node.js
```

Or open <http://localhost:8000/test.html> for the browser-side subset.

## How it is built

Plain HTML, CSS and JavaScript. No build step, no dependencies, no framework.
`package.json` exists only to tell Node that `.js` files are ES modules — it
has no dependencies and never should.

Every CV fact lives in `index.html` as semantic HTML. The scripts in
`scripts/` only decorate it, so the site works with JavaScript disabled or a
screen reader.

All pixel art in `assets/sprites.svg` is original work — an homage to Super
Mario Bros 2, not affiliated with Nintendo. Sound is synthesized at runtime
with the Web Audio API; no audio files are used. The display font is
[Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P), self-hosted
under the SIL Open Font License.
```

- [ ] **Step 7: Commit**

```bash
git add scripts/main.js README.md
git commit -m "feat: wire up boot sequence and add README"
```

- [ ] **Step 8: Push**

```bash
git push -u origin main
```

If the push prompts for credentials and fails, that is an auth setup issue, not
a code issue — install `gh` and run `gh auth login`, or switch the remote to
SSH with `git remote set-url origin git@github.com:RobinCesar/Mario-portfolio.git`.

- [ ] **Step 9: Enable GitHub Pages**

In the repository settings on GitHub, under Pages, set the source to deploy
from the `main` branch, root folder. The site becomes available at
`https://robincesar.github.io/Mario-portfolio/`. Confirm the deployed page
loads its stylesheets, sprite sheet and font — these are all relative paths,
so they work under the repository subpath without changes.

---

## Verification Summary

After Task 13 the following must all be true:

| Check | Command / method |
|---|---|
| All tests pass | `node tests/run-node.js` exits 0 |
| No dependencies crept in | `package.json` has no `dependencies` key |
| Phone number absent | Covered by `tests/content.test.js` |
| Contrast meets AA | Covered by `tests/contrast.test.js` |
| Every sprite reference resolves | Covered by `tests/sprites.test.js` |
| CV readable without JS | Manual, Task 13 Step 5 |
| Accessibility ≥ 95 | Lighthouse, Task 13 Step 5 |
