#!/usr/bin/env node
/**
 * git-yard — Your terminal is your yard.
 *
 * Renders a GitHub contribution graph directly in the terminal
 * using true-color ANSI escape codes. Zero config, no auth.
 *
 *   $ git-yard faranevfy          (rolling 53-week default)
 *   $ git-yard faranevfy --year 2025
 */

import { fetchContributions } from "./fetch.js";
import { readCache, writeCache } from "./cache.js";
import { calculateStreaks } from "./stats.js";
import { renderGraph } from "./render.js";
import { THEMES, DEFAULT_THEME } from "./theme.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`git-yard — GitHub contribution graph in your terminal

Usage:
  git-yard <username>              Show rolling 53-week contribution graph
  git-yard <username> --year 2025  Show a specific calendar year
  git-yard <username> --theme blue Use an alternate color theme

Examples:
  git-yard faranevfy
  git-yard torvalds --year 2024

Cache: ~/.git-yard/ (15-minute TTL)`);
    return;
  }

  const username = args[0];
  let year: number | null = null;
  let themeName = DEFAULT_THEME;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--year" || args[i] === "-y") {
      year = Number.parseInt(args[++i], 10);
      if (Number.isNaN(year)) {
        console.error("Error: --year must be a number");
        process.exit(1);
      }
    } else if (args[i] === "--theme" || args[i] === "-t") {
      themeName = args[++i];
      if (!THEMES[themeName]) {
        console.error(
          `Error: Unknown theme "${themeName}". Available: ${Object.keys(THEMES).join(", ")}`,
        );
        process.exit(1);
      }
    }
  }

  const theme = THEMES[themeName];

  let data = await readCache(username, year);

  if (!data) {
    console.error(
      `Fetching contributions for ${username}${year ? ` (${year})` : ""}...`,
    );
    data = await fetchContributions(username, year);
    await writeCache(data, year);
  } else {
    console.error(
      `Using cached data for ${username}${year ? ` (${year})` : ""}`,
    );
  }

  const stats = calculateStreaks(data.days);
  const output = renderGraph(data.days, theme, stats, username);
  console.log(output);
}

main().catch((err) => {
  console.error(`git-yard: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
