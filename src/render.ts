/**
 * Grid renderer — true-color ANSI contribution graph output.
 *
 * Active cells (level 1-4): "██" with background color.
 * Level 0 and empty cells: "  " (transparent — no background).
 * 1 space gap between cells.
 */

import chalk from "chalk";
import type { ContributionDay } from "./fetch.js";
import type { StreakStats } from "./stats.js";
import type { Theme } from "./theme.js";

chalk.level = 3;

const MONTHS = [
  "Jn", "Fb", "Mr", "Ap", "My", "Jn",
  "Jl", "Ag", "Sp", "Oc", "Nv", "Dc",
];

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const BLOCK = "██";

type GridCell = { date: string; count: number; level: number };

function buildGrid(days: ContributionDay[], year: number): GridCell[][] {
  const grid: GridCell[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 53 }, () => ({ date: "", count: 0, level: -1 })),
  );
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const origin = new Date(jan1);
  origin.setUTCDate(jan1.getUTCDate() - jan1.getUTCDay());
  const originMs = origin.getTime();

  for (const day of days) {
    const [, m, d] = day.date.split("-").map(Number);
    const ms = Date.UTC(year, m - 1, d);
    const diff = Math.round((ms - originMs) / 86_400_000);
    const col = Math.floor(diff / 7);
    const row = diff % 7;
    if (col >= 0 && col < 53 && row >= 0 && row < 7) {
      grid[row][col] = day;
    }
  }
  return grid;
}

export function renderGraph(
  days: ContributionDay[],
  theme: Theme,
  stats: StreakStats,
  year: number,
): string {
  const grid = buildGrid(days, year);
  const today = new Date().toISOString().slice(0, 10);
  const out: string[] = [];

  // Column count — trim trailing empty columns
  let maxCol = 52;
  outer: for (let c = 52; c >= 0; c--) {
    for (let r = 0; r < 7; r++) {
      if (grid[r][c].level >= 0) { maxCol = c; break outer; }
    }
  }

  // Month labels
  out.push("     " + monthLabels(grid, maxCol));

  // Grid rows
  for (let r = 0; r < 7; r++) {
    let line = "  " + DAY_LABELS[r] + " ";
    for (let c = 0; c <= maxCol; c++) {
      const cell = grid[r][c];
      if (cell.level <= 0) {
        line += "   ";
      } else {
        const hex = theme.levels[cell.level];
        const dot = cell.date === today ? "█ " : BLOCK + " ";
        line += chalk.bgHex(hex)(dot);
      }
    }
    out.push(line);
  }

  // Legend
  out.push("");
  const legendParts = theme.labels.map(
    (l, i) => chalk.bgHex(theme.levels[i])(BLOCK) + chalk.dim(l),
  );
  out.push("  " + legendParts.join("  "));

  // Stats
  out.push("");
  out.push(
    "  " +
      chalk.dim(`${stats.totalContributions.toLocaleString()} total`) +
      chalk.dim(" · ") +
      chalk.dim(`${stats.currentStreak}d streak`) +
      chalk.dim(" · ") +
      chalk.dim(`longest ${stats.longestStreak}d`),
  );

  return out.join("\n");
}

function monthLabels(grid: GridCell[][], maxCol: number): string {
  const labels: (string | null)[] = Array.from({ length: maxCol + 1 }, () => null);
  const seen = new Set<number>();
  for (let c = 0; c <= maxCol; c++) {
    for (let r = 0; r < 7; r++) {
      const d = grid[r][c].date;
      if (!d) continue;
      const m = Number.parseInt(d.slice(5, 7), 10);
      if (!seen.has(m) && Number.parseInt(d.slice(8, 10), 10) <= 7) {
        labels[c] = MONTHS[m - 1];
        seen.add(m);
        break;
      }
    }
  }
  let result = "";
  for (let c = 0; c <= maxCol; c++) result += (labels[c] ?? "").padEnd(3);
  return result.trimEnd();
}
