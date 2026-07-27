# CLAUDE.md

Portfolio site for Robin Elvius, themed as *Super Mario Bros 2*.

## Running and testing

```bash
python3 -m http.server 8000     # then open localhost:8000
node tests/run-node.js          # must exit 0 before any commit
```

A server is required: the scripts are ES modules and browsers refuse to load
those over `file://`. `test.html` runs the browser-side subset of the same
suite.

## Hard rules

These are load-bearing. Breaking one is a bug even if nothing throws.

1. **Content is never gated behind the game.** Every CV fact lives in
   `index.html` as semantic markup. Scripts only decorate it. Skill names are
   visible before a sprout is pulled; contact links are real `<a href>` that the
   slot machine animates *to*. The site must stay a complete, readable CV with
   JavaScript disabled.
2. **The phone number never appears on the site.** `tests/content.test.js`
   strips all non-digits and searches, so no formatting trick slips past.
3. **No dependencies, no build step.** `package.json` declares `"type":
   "module"` and nothing else. It must never gain a `dependencies` key.
4. **All pixel art is original**, drawn in the SMB2 idiom. No Nintendo sprite
   rips, no ripped audio. Sound is synthesized at runtime.
5. **Every interaction has a keyboard path.** The platformer is an alternative
   route to content, never the only one — blocks, sprouts, doors and the lever
   are real `<button>` elements that work with Tab and Enter.
6. **Starman colour cycling stays capped at 3 Hz** and is replaced by a static
   tint under `prefers-reduced-motion`. Faster flashing is a seizure risk.

## Architecture

Plain HTML/CSS/ES modules. Each script in `scripts/` exports one `init*()` and
communicates only through `scripts/state.js`, a small pub/sub store. No module
reaches into another's internals.

| Module | Owns |
|---|---|
| `state.js` | Pub/sub store + localStorage persistence |
| `audio.js` | Web Audio synthesis, graceful degradation |
| `player.js` | Platformer physics, collision, element activation |
| `titlescreen.js` | Press Start sequence, spawning the player |
| `hud.js` | Hearts (scroll meter), counters, sound toggle |
| `blocks.js` | `?` blocks, experience doors |
| `veggies.js` | Skill sprout pulling |
| `subspace.js` | Potion → dark mode |
| `cherries.js` | Cherry hunt, Starman |
| `slots.js` | Contact slot machine |
| `parallax.js` | Background scenery, Shy Guys |

`player.js` activates page elements by dispatching real `click` events on them,
so the platformer and the keyboard share one code path. Never duplicate an
interaction's logic inside the player.

### state.js gotcha

`get()` always returns a default, so it cannot tell "stored false" from "never
stored". Use the object returned by `hydrate()` when you need that distinction —
boot relies on it to fall back to `prefers-color-scheme`. There is a regression
test for this.

## Testing conventions

Pure logic is factored out of every module so it can run in Node without a DOM
(`heartsForScroll`, `pullProgress`, `spinPlan`, `stepPhysics`, …). DOM and visual
work is verified by driving a real browser, not by mocking.

`tests/all.js` holds universal tests; `tests/node-only.js` holds those that read
files with `node:fs`. Tests that touch `localStorage` must clear it first — the
browser runner shares an origin with `index.html` and will otherwise inherit
state from a previous visit.

Do not weaken an assertion to make it pass. If a test fails, either the code is
wrong or the test was testing the wrong thing — fix that, don't loosen it.
