# git-yard — TUI Redesign Log

**Date:** 2026-07-15
**Author:** evfydev + Command Code agent
**Scope:** Visual redesign of the git-yard terminal output (the actual product) and the `preview.html` mock used to inspect it.

---

## 1. Product context (research)

git-yard is a zero-config CLI that renders a GitHub contribution graph in the terminal using true-color ANSI (24-bit color) and Unicode block characters. There is no GUI app — the **product is the ANSI string that `renderGraph` (in `src/render.ts`) emits to stdout**.

Key facts established while exploring the repo:

- **Entry / flow:** `src/index.ts` parses `git-yard <username> [--year N] [--theme name]`, reads a 15-min file cache (`src/cache.ts`, `~/.git-yard/`), falls back to scraping GitHub's public contributions HTML (`src/fetch.ts`), then calls `renderGraph(days, theme, stats)`.
- **Themes** (`src/theme.ts`): `green` (canonical GitHub scale `#ebedf0`→`#216e39`), `dark` (`#161b22`→`#39d353`), `blue` (accessible alt). `Theme.levels` is a 5-string array indexed by GitHub level `0..4`.
- **Stats** (`src/stats.ts`): `currentStreak`, `longestStreak`, `totalContributions`, plus start/end dates.
- **`preview.html`** is not a deliverable. It is a prototyping surface so the human/agents can eyeball the UI without a terminal. Per project taste (`rolling 53-week window`, `white level-0 cells`), earlier commits already tuned the grid to match GitHub's default rolling window and to render empty (level-0) cells in **white**, not dark/transparent.

**Critical correction from the user:** `preview.html` is a *mock*, not the product. The right workflow is: design the TUI output, then mirror it in `preview.html` — not decorate the mock as if it were the end product. The first pass violated this.

---

## 2. First pass (mistaken — superseded)

The initial redesign targeted `preview.html` directly and turned it into a decorated "Terminal Showcase" OS window: a fake title bar with traffic-light dots, a `evfy@yard ~ $ git-yard faranevfy` prompt, a status-bar footer, hover/scale/glow animations, and a green-tinted near-black palette that *deliberately discarded* GitHub's colors.

Why this was wrong:
- It redesigned the **mock**, not the product (`render.ts`).
- It invented UI (title bar, status bar, tooltips) that the real TUI has no mechanism to produce, so the mock drifted from the actual output.
- It threw away GitHub's recognizable palette for the sake of "not looking like GitHub" — but the product's value *is* GitHub-green fidelity.

This pass was discarded after the user's correction.

---

## 3. Final approach (correct)

Redesign the **TUI string** in `render.ts` so it reads as a distinct, branded git-yard output while staying a plain terminal text block (no escape-driven layout that breaks on narrow widths). Then generate `preview.html` from the **real** renderer output so the mock can never drift from the product.

### 3.1 Changes to `src/render.ts`

- **Branded header:** `◆ git-yard  <username> · <year|rolling>` — a green lozenge (`◆`, `#3fb950`) as a fixed brand mark, bold white product name, dimmed username/year context.
- **Aligned gutters:** weekday labels (`Su`…`Sa`) on every grid row; month labels above the grid, one per column, shown only when a week's Sunday lands in the first 7 days of a month (no double-padding that breaks terminal alignment). Each grid row is `dayLabel + " " + N×(cell + " ")` so all rows share identical width.
- **Today marker:** today's cell is rendered as a white `●` (`chalk.bgHex(hex).hex("#ffffff")("●")`) on top of its level color, instead of the old mismatched `▐█` half-block. The current streak is carried on the today row: `  3d streak` in bold brand green.
- **Legend as a gradation:** `Less █ █ █ █ █ More` (five colored blocks), replacing GitHub's verbose word buckets ("1-9 contributions" etc.).
- **Stats footer:** `1,174 contributions · 3d streak · 6d longest` — bold numbers, dim labels, separated by ` · `, no mid-dots.
- **Signature:** `renderGraph(days, theme, stats, username?)` — added optional `username` for the header. `index.ts` now passes `username`.

### 3.2 Changes to `src/index.ts`

- `renderGraph(data.days, theme, stats, username)` — pass the resolved username into the renderer.

### 3.3 `preview.html` — now generated, not hand-edited

New `scripts/gen-preview.mjs`:
1. Runs the real built CLI (`node dist/index.js <user>`, uses cache, no network).
2. Converts the ANSI true-color output to HTML (parses `38;2;r;g;b` / `48;2;r;g;b`, bold, dim, reset).
3. Wraps it in a minimal terminal chrome (title bar + `pre`) on the same green-tinted dark background.

Regenerate after any render change with:

```bash
node scripts/gen-preview.mjs faranevfy
```

This guarantees the mock always equals the product.

---

## 4. Verification

- `tsc` passes (no type errors); `dist/` rebuilt.
- Real CLI output captured and inspected: header, aligned month/day gutters, today `●`, gradient legend, and stats footer all present; all 7 grid rows equal width (53-week rolling window).
- Regenerated `preview.html` confirmed to contain the brand `◆`, today `●`, `Less/More` gradation, and the stats line.
- Headless Chrome screenshots rendered without error at desktop and mobile widths.

---

## 5. Open question (unresolved)

The today marker uses `●` because the old `▐█` half-block needs a double-width glyph to read as a ring and looks mismatched at single-cell width. Alternative considered: keep the full `█` square and indicate "today" via a leading `>` in the day gutter. Decision deferred to the user.

---

## 6. Files touched

| File | Change |
|------|--------|
| `src/render.ts` | Rewrote output layout: header, gutters, today `●`, gradient legend, stats footer; added `username` param. |
| `src/index.ts` | Pass `username` to `renderGraph`. |
| `scripts/gen-preview.mjs` | New: regenerates `preview.html` from the real ANSI output. |
| `preview.html` | Regenerated from real renderer output (was a hand-built mock). |
