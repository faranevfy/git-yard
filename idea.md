# Idea: git-yard

> **Date Created:** 2026-07-15
> **Status:** Evaluating
> **Category:** CLI Tool
> **AI Feasibility:** High

---

## 1. Executive Summary
`git-yard` is a zero-config CLI that renders your GitHub contribution graph directly in the terminal using true-color ANSI escape codes. It's the `cat` of contribution graphs — no auth, no dashboard, no compilation. Just `npx git-yard evfydev` and you see your green squares, exactly like the GitHub profile page.

## 2. Problem Statement
- **What problem does this solve?** There's no quick, beautiful way to see your GitHub contribution graph in the terminal. Existing tools are either ugly ASCII (`streaker`), require Rust + token (`ghgarden`), or are overkill dashboards when you just want the grid.
- **Why does this need to exist?** The sweet spot is completely unexplored — a zero-friction, single-purpose tool that renders the graph in actual GitHub green using terminal colors. Nothing matches GitHub's visual identity.
- **Who is this for?** Developers who live in the terminal and want to glance at their contribution activity without opening a browser.

## 3. Core Features

### MVP (v0.1)
- [ ] **Zero-config data fetch** — Scrape `github.com/users/{username}/contributions` public HTML page (no token, no API key)
- [ ] **True-color green rendering** — GitHub's exact 5-color scale (#ebedf0 → #216e39) via ANSI 24-bit color with Unicode quarter-block characters (▘▀▄▙▚▛▜▝▞▟█) for perfect pixel-doubled squares
- [ ] **Minimal CLI** — `git-yard <username>`, optional `--year` flag
- [ ] **Streak stats footer** — Current streak, best streak, total contributions below the graph

### v0.2
- [ ] **Diff highlighting** — Cached previous run, bold or underline cells that changed since yesterday
- [ ] **Today indicator** — Bright border or blink on today's cell
- [ ] **Multiple output modes** — Text (default), JSON (for piping), SVG export

### Future
- [ ] **Shell prompt integration** — 7-day mini-strip for PS1/PS2 (like `git-yard --prompt`)
- [ ] **Inline image rendering** — Kitty/iTerm2 protocol for pixel-perfect graphs that look identical to GitHub
- [ ] **Multi-year comparison** — Side-by-side years
- [ ] **Organization view** — Aggregate graph across org repos
- [ ] **Watch mode** — Live refresh while you work

## 4. Architecture

### Data Flow
```
github.com/users/{user}/contributions (HTML, public, no auth)
        │
        ▼
   HTML Parser (cheerio/parse5)
   Extracts <tool-tip> elements with:
     - data-date, data-level, data-count
     - contribution-count text
        │
        ▼
   Data Model: Map<YYYY-MM-DD, { count: number, level: 0-4 }>
        │
        ▼
   Cache Layer (~/.git-yard/{user}_{year}.json, 15min TTL)
        │
        ▼
   Renderer
   ├── Unicode blocks + ANSI true-color
   ├── Grid layout (7 rows × 53 columns)
   └── Month labels, day labels, legend
        │
        ▼
   stdout (terminal)
```

### Key Design Decisions

**HTML scraping over GraphQL API:**
- No token required, works for anyone immediately
- GitHub's `github.com/users/{user}/contributions` page serves all contribution data as `data-*` attributes on `<tool-tip>` elements — trivially parseable
- Rate limiting is per-IP, reasonable for a personal tool
- `jamieweavis/contribution` npm package already handles this, we can either depend on it or reimplement the parser (~50 lines)

**Unicode quarter-blocks for density:**
- Standard terminal characters only display 1 per cell, making squares look thin
- Unicode Upper Half Block (▀) + ANSI background color = two pixels per terminal cell → properly proportioned squares
- For full density, we can use the full block (█) with colored background and foreground combined

**True-color ANSI:**
- Most modern terminals (iTerm2, Kitty, WezTerm, Warp, VS Code terminal, Windows Terminal) support 24-bit color
- Fallback to 256-color mode if terminal doesn't support true color
- GitHub's exact 5-level green scale mapped to closest ANSI equivalents:
  - Level 0: `#ebedf0` (empty)
  - Level 1: `#9be9a8` (light)
  - Level 2: `#40c463` (medium-light)
  - Level 3: `#30a14e` (medium-dark)
  - Level 4: `#216e39` (dark)

### File Structure
```
git-yard/
├── src/
│   ├── index.ts          # CLI entry, argument parsing
│   ├── fetch.ts          # HTML scraper, contribution parser
│   ├── cache.ts          # File-based cache (~/.git-yard/)
│   ├── render.ts         # Grid rendering, ANSI color output
│   ├── stats.ts          # Streak calculation
│   └── theme.ts          # Color palettes (GitHub green + extras)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 5. AI Leverage
- AI coding assistant can scaffold the entire project structure, parser, renderer, and CLI
- HTML parsing logic can be generated from examining GitHub's actual markup
- Streak algorithm is well-documented and implementable via AI pair-programming
- Test fixtures can be generated from real GitHub contribution pages

## 6. Suggested Tech Stack
- **Runtime:** Node.js / TypeScript (your stack, zero compilation)
- **Parsing:** `cheerio` or built-in regex (the HTML structure is simple enough)
- **CLI framework:** `cac` or hand-rolled (it's ~2 flags)
- **Colors:** `chalk` v5+ (supports hex/true-color: `chalk.hex('#216e39')`)
- **HTTP:** `undici` (built into Node 20+) or `node-fetch`
- **Caching:** Plain JSON files in `~/.git-yard/`
- **Testing:** Vitest
- **Linting:** Biome
- **Publishing:** npm, `npx git-yard` should work instantly

## 7. Development Roadmap

### Phase 1: MVP — Show the grass
- [x] Research completed, gaps identified
- [ ] Scaffold project with TypeScript, Vitest, Biome
- [ ] Implement HTML scraper for `github.com/users/{user}/contributions`
- [ ] Build grid renderer with true-color ANSI + Unicode blocks
- [ ] Add month labels, day labels, legend
- [ ] Implement `--year` flag
- [ ] Add streak stats footer
- [ ] Publish to npm as `git-yard`

### Phase 2: Polish
- [ ] File cache with 15-min TTL
- [ ] Diff mode (highlight changes since last run)
- [ ] 256-color fallback for limited terminals
- [ ] `--json` output mode
- [ ] Multiple user comparison

### Phase 3: Delight
- [ ] Shell prompt integration (`--prompt`)
- [ ] Inline Kitty/iTerm2 image rendering
- [ ] Watch mode (auto-refresh)

## 8. Competitive Analysis

| Feature | streaker | ghgarden | **git-yard** |
|---|---|---|---|
| No auth required | ✅ | ❌ (needs token) | ✅ |
| True-color green | ❌ | ✅ (Rust TUI) | ✅ |
| Instant `npx` | ✅ | ❌ (compile) | ✅ |
| Unicode block density | Partial (░▒▓█) | Partial (░▒▓█) | ✅ (▀█ full blocks) |
| Diff highlighting | ❌ | ❌ | ✅ (planned) |
| Single-purpose | ✅ | ❌ (dashboard) | ✅ |
| Cache | ❌ | ✅ (15min) | ✅ (planned) |
| Shell prompt | ❌ | ❌ | ✅ (planned) |

## 9. Next Steps
- [ ] Scaffold project repo
- [ ] Test HTML parsing against real GitHub page
- [ ] Prototype ANSI renderer with a hardcoded dataset
- [ ] Hook up scraper → renderer pipeline
- [ ] Publish v0.1 to npm
