# Super Mario Bros 2 Portfolio Site — Design

**Date:** 2026-07-27
**Owner:** Robin Elvius
**Repo:** https://github.com/RobinCesar/Mario-portfolio

## Goal

A personal portfolio site presenting Robin Elvius' CV, themed as *Super Mario Bros 2*. It must
work as a real CV for a recruiter skimming it in thirty seconds, and reward anyone who stays
longer with interaction. Fun is layered on top of the content, never in front of it.

Language: **English only.** (Source CV is Swedish; all copy is translated.)

## Non-goals

- Not a playable platformer. No physics engine, no character movement, no game-over state.
- No CMS, no backend, no analytics, no contact form.
- No Swedish/English toggle. Decided against; English only.

## Guiding principle

**Content is never gated behind a game.** Every CV fact lives in `index.html` as semantic HTML.
JavaScript decorates it. Three concrete consequences that constrain implementation:

1. Skill sprouts display the skill name before being pulled. Pulling reveals detail and sound.
2. Contact links are real `<a href>` elements in the markup. Slot reels animate *to* them.
   No spin is ever required to reach the email address.
3. A **Plain CV** link to the PDF sits in the HUD from first paint.

A visitor with JavaScript disabled, a screen reader, or no patience gets the complete CV.

## Stack

Plain HTML, CSS and JavaScript. No build step, no package manager, no dependencies.
Opening `index.html` from the filesystem works. Deploy is a file copy.

ES modules loaded via `<script type="module">`. This means local testing needs a static server
(`python3 -m http.server`) rather than `file://`, because module scripts are subject to CORS.
Accepted: the deployed site is unaffected, and the fallback content renders regardless.

## File layout

```
index.html
CV__V_2_.pdf                      (already present; linked as Plain CV)
assets/
  sprites.svg                     original pixel art, single SVG symbol sheet
  fonts/PressStart2P.woff2        self-hosted, SIL OFL
styles/
  tokens.css                      palette, spacing scale, type scale
  layout.css                      page grid, section framing, responsive rules
  sprites.css                     sprite rendering, animation keyframes
  sections.css                    per-section styling
scripts/
  state.js                        pub/sub store
  audio.js                        Web Audio chiptune engine
  hud.js                          hearts, coin + cherry counters, sound toggle
  parallax.js                     scrolling scenery, patrolling Shy Guys
  veggies.js                      drag/keyboard skill reveal
  subspace.js                     potion -> dark mode
  cherries.js                     easter egg hunt + Starman
  slots.js                        contact slot machine
  main.js                         boot, module registration
docs/superpowers/specs/           this document
test.html                         dependency-free logic tests
```

Every module in `scripts/` exports a single `init(root)` and communicates only through
`state.js`. No module reaches into another's internals. Deleting `cherries.js` and its
`init` call leaves a working site.

## State

`state.js` is a ~30-line pub/sub store. No framework.

| Key | Type | Persisted | Notes |
|---|---|---|---|
| `coins` | number | no | Session only. Resets on reload so repeat visits stay playable. |
| `cherries` | Set of string ids | no | Session only, same reason. |
| `soundOn` | boolean | localStorage | Defaults to `false`. |
| `subspace` | boolean | localStorage | First visit reads `prefers-color-scheme`. |
| `starman` | boolean | no | Transient, 8 second lifetime. |

`localStorage` access is wrapped in try/catch. Private browsing mode throws on write; the
fallback is an in-memory object and the site behaves identically for that session.

## Sections

Order is dev-first: the strongest technical work appears before the sales roles.

### 1. Title screen
Name in Press Start 2P, `PRESS START` prompt, parallax desert backdrop, three floating `?`
blocks. `PRESS START` scrolls to About.

### 2. About
Profile text from the CV. The three `?` blocks punch upward on click and reveal Uppsala /
Python / consulting. Each punch awards a coin. The **leftmost** block hides cherry #1,
revealed on its third punch.

### 3. Projects
**Analysis tool for prediction markets (Polymarket), 2026.** Presented as a boss-arena card —
the largest single visual on the page.

- Python system collecting market data via APIs, analysing historical mispricing
  (calibration), and running several automated paper trading strategies from the results.
- Full pipeline — data collection, statistical analysis, simulated trading — version
  controlled with Git and running continuously on a server.

Cherry #2 sits in a corner of the arena.

### 4. Experience
Six doors, newest first. Clicking a door opens a panel with the role's bullet points.
Doors are `<button>` elements controlling `aria-expanded` on the panel.

| Role | Employer | Dates |
|---|---|---|
| Developer (Consultant) | Own firm, incl. assignments from Guidelight | 2026/06–Present |
| Marketing & Finance Manager | Elvius Betongvaror, Uppsala | 2024/05–Present |
| Meeting Booker | Gimlit, Uppsala | 2023/11–2024/01 |
| Telesales Agent | Lingon Mobil, Uppsala | 2023/09–2023/10 |
| Salesperson and CEO | LupinusUF, Uppsala | 2022/08–2023/06 |
| Park Worker | Uppsala Municipality | 2020/07–2020/08 |

LupinusUF carries a one-line gloss: *UF (Ung Företagsamhet) is Sweden's school
entrepreneurship programme* — otherwise meaningless to a non-Swedish reader.

Cherry #3 is behind the oldest door, rewarding a reader who reaches the bottom of the list.

### 5. Education
- MSc in Engineering Physics, Uppsala University, 2024–2029 (ongoing)
- Standalone courses, 2026:
  - Introduction to AI — fundamentals, machine learning, reasoning and practical
    applications (7.5 credits), Luleå University of Technology
  - Cybersecurity — fundamentals and awareness (3 credits), Linköping University
  - Commercial Law: Introductory Law Course (15 credits), Stockholm University
- Natural Science Programme, Katedralskolan Uppsala, 2020–2023

Rendered as collectible plaques. Cherry #4 is **only visible in Subspace**, gating one
collectible behind discovering the dark mode joke.

### 6. Skills
Six sprouts in the ground. Drag upward, or focus and press Enter/Space, to pull one. The
skill name is printed on the visible sprout leaf at all times; pulling reveals the detail
card and plays a sound.

| Sprout | Detail |
|---|---|
| Python | Primary language; Polymarket pipeline |
| Git | Version control across all projects |
| HTML / CSS / JavaScript | Client sites, this site |
| LaTeX | Academic and CV typesetting |
| Microsoft 365 | Office suite |
| Sales & business management | Marketing plans, budgets, bookkeeping |

Languages (Swedish and English, fluent) are stated as plain text above the sprouts rather
than as a pullable, so language ability is never hidden behind an interaction.

A seventh sprout is a **Bob-omb**: no skill attached, pulling it shakes the screen and awards
a coin. Fixed position, not random, so behaviour is deterministic and testable.

### 7. Contact
Slot machine with three reels. Pulling the lever spins them; they always land on the three
real targets:

| Reel | Target |
|---|---|
| ✉ | `mailto:robin.c.elvius@gmail.com` |
| in | `linkedin.com/in/robin-elvius-132368252` |
| 📄 | `CV__V_2_.pdf` |

**Phone number is deliberately excluded** from the site to keep it out of scraper databases.
It remains on the PDF handed out directly.

Cherry #5 sits on the machine chassis.

## HUD

Fixed bar: hearts, coin counter, `🍒 n/5`, speaker toggle, Plain CV link.

Hearts double as a scroll progress meter: `filled = clamp(ceil(scrollFraction * 3), 0, 3)`,
three hearts total. At the top of the page, three empty hearts.

## Visual design

SMB2 desert overworld palette:

| Token | Value | Use |
|---|---|---|
| `--sky` | `#6B8CFF` | Backdrop |
| `--sand` | `#E09850` | Ground, panels |
| `--ground` | `#C84C0C` | Ground edge, borders |
| `--pipe` | `#00A800` | Sprouts, accents |
| `--ink` | `#201808` | Body text on sand |
| `--paper` | `#FCFCFC` | Text on dark plates |

Subspace inverts to `--sky: #101820` with magenta `#D82800` accents, applied by toggling a
`data-subspace` attribute on `<html>` so every token swaps at once.

Type: Press Start 2P for headings, HUD and buttons only. Body copy uses a system sans stack
(`ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`) because a pixel
font is unreadable at paragraph length, and the CV text is what a recruiter actually reads.

All pixel art is **original work in the SMB2 idiom** — its palette, chunky forms, desert
setting. No Nintendo sprite rips, no ripped audio. This is both a legal and a quality
decision for a site sent to employers.

## Audio

Short chiptune blips synthesized at runtime with the Web Audio API — oscillator plus gain
envelope, no audio files. Sounds: block punch, veggie pull, door open, coin, Bob-omb,
Starman jingle, slot reel stop.

Muted by default; browsers block autoplay regardless. `AudioContext` is created lazily on the
first user gesture and `resume()`d then. If construction or resume fails, the speaker toggle
disables itself and every other feature continues working.

## Accessibility

Treated as a requirement, not polish, because this site is sent to employers.

- `prefers-reduced-motion: reduce` disables parallax, Shy Guy patrol, screen shake, and
  replaces the Starman rainbow with a static gold tint plus a text banner.
- The Starman effect is capped at **3 Hz** even when motion is allowed. Faster colour
  flashing is a documented seizure risk.
- Every interaction has a keyboard path. Sprouts, doors, `?` blocks and the slot lever are
  real `<button>` elements. Drag is an enhancement, never the only route.
- Visible focus rings, styled as pixel outlines but never removed.
- Semantic structure: one `<h1>`, sections with `<h2>`, roles as `<article>` with `<time>`.
- Colour contrast meets WCAG AA in both normal and Subspace palettes. Body text is `--ink`
  on `--sand` in normal mode and `--paper` on navy in Subspace; both are verified during
  implementation. Subspace magenta `#D82800` is used **only** for borders, accents and
  sprite fill — never for text — as it does not clear 4.5:1 against the navy backdrop.
- Decorative sprites carry `aria-hidden="true"`.

## Responsive behaviour

Single column below 768px. Sprout pulling supports touch (`pointerdown`/`pointermove`,
Pointer Events, so mouse and touch share one code path). Parallax depth is reduced on small
screens. The slot machine stacks its reels vertically. HUD collapses to icons only.

## Failure modes

| Condition | Behaviour |
|---|---|
| JavaScript disabled | `.no-js` class on `<html>`, removed by an inline head script. Full CV renders, statically styled. |
| Web Audio blocked or unavailable | Speaker toggle disables itself. Everything else unaffected. |
| `localStorage` throws | In-memory fallback for that session. |
| Font fails to load | System fallback stack; layout does not shift materially. |
| PDF missing | Link still renders and 404s visibly rather than silently disappearing. |

## Testing

Proportionate to a static site with no dependencies.

`test.html` runs a ~20-line assertion harness over the pure logic modules, opened directly
in a browser. It covers:

- `state.js` — subscribe fires on change, unsubscribe stops delivery, no listener leak.
- `cherries.js` — tally increments, the same cherry id cannot be counted twice, Starman
  fires exactly once at five.
- `slots.js` — reels resolve to the three real targets regardless of the random seed.
- `subspace.js` — toggle flips state, persists, and reads `prefers-color-scheme` on first
  visit only.
- `hud.js` — scroll fraction to heart count: `0 -> 0`, `0.34 -> 2`, `1 -> 3`.

Visual and interaction work is verified by manual checklist across Chrome, Firefox, Safari,
and iOS Safari for touch. Target: Lighthouse accessibility score ≥ 95.

## Open items

None. The CV PDF is present in the repository root.
