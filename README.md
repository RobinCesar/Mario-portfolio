# Robin Elvius — Portfolio

A personal portfolio site presenting my CV, themed as *Super Mario Bros 2*.

## Running it locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

A server is needed because the scripts are ES modules, which browsers refuse to
load over `file://`.

## Tests

```bash
node tests/run-node.js
```

Exits non-zero on failure. Or open <http://localhost:8000/test.html> for the
browser-side subset (the content, contrast and sprite suites read files from
disk, so they are Node-only).

Three of the suites guard rules that are otherwise easy to break by accident:

- **content** — every CV fact is present in the markup, and the phone number
  is absent in any format (it strips all non-digits before searching).
- **contrast** — every text/background pairing in `tokens.css` clears WCAG AA.
- **sprites** — every `<use href="#sprite-…">` resolves to a symbol that exists.

## How it is built

Plain HTML, CSS and JavaScript. No build step, no dependencies, no framework.
`package.json` exists only to tell Node that `.js` files are ES modules — it has
no dependencies and never should.

Every CV fact lives in `index.html` as semantic HTML. The scripts in `scripts/`
only decorate it, so the site works with JavaScript disabled or a screen reader.
Skill names are visible before you pull them, and the contact links are real
anchors that the slot machine animates *to* — no content is ever locked behind
an interaction.

### Interactions

| Where | What |
|---|---|
| About | Punch the `?` blocks. The leftmost hides a cherry on its third punch. |
| About | Throw the potion to enter Subspace — the dark mode. |
| Experience | Each role is a door that opens. |
| Education | One cherry is only visible in Subspace. |
| Skills | Drag a sprout upward, or focus it and press Enter. One is a Bob-omb. |
| Contact | Pull the lever to spin the reels. |
| Anywhere | Find all five cherries for Star Power. |

### Accessibility

`prefers-reduced-motion` disables parallax, the patrolling Shy Guys and screen
shake, and swaps the Star Power rainbow for a static gold tint. The colour cycle
is capped at 3 Hz regardless, since faster flashing is a seizure risk. Every
interaction has a keyboard path.

### Credits

All pixel art in `assets/sprites.svg` is original work — an homage to Super
Mario Bros 2, not affiliated with Nintendo. Sound is synthesized at runtime with
the Web Audio API; there are no audio files. The display font is
[Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P), self-hosted
under the SIL Open Font License.
