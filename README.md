# git-yard

> Your terminal is your yard. 🌱

Instant GitHub contribution graph in your terminal — true-color green, zero config, no auth.

```bash
npx git-yard evfydev
```

## Why?

git-yard sits in the sweet spot of being zero-config, beautiful (actual GitHub green), and single-purpose. It's the `cat` of contribution graphs.

## Features

- **Zero config** — no token, no API key, no setup
- **True-color ANSI** — exact GitHub green palette (plus dark and blue themes)
- **Unicode blocks** — uses ▆▆ characters and hair spaces for tightly proportioned cells
- **Responsive** — automatically truncates the graph on narrow screens to prevent ugly text wrapping
- **Streak stats** — current streak, longest streak, total contributions
- **15-minute cache** — stored in `~/.git-yard/` so you're not hammering GitHub

## Usage

```bash
git-yard <username>              # Current year
git-yard <username> --year 2025  # Specific year
git-yard <username> --theme blue # Alternate color theme
```

## Install

```bash
npm install -g git-yard
# or just run it:
npx git-yard evfydev
```

Requires Node.js >= 20.
