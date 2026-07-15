/**
 * Grid renderer — converts contribution data into true-color ANSI output.
 *
 * Renders GitHub's 53-week × 7-day grid using Unicode full-block (█)
 * with 24-bit ANSI background colors for each contribution level.
 */

import chalk from "chalk";
import type { ContributionDay } from "./fetch.js";
import type { StreakStats } from "./stats.js";
import type { Theme } from "./theme.js";

chalk.level = 3; // Force true-color output regardless of TTY

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface GridCell {
  date: string;
  count: number;
  level: number;
}

/**
 * Build a 7×53 grid from contribution days.
 *
 * Computes each cell's (row, col) position from its date,
 * relative to the grid's origin Sunday (Sunday on or before Jan 1).
 */
function buildGrid(days: ContributionDay[], year: number): GridCell[][] {
  const grid: GridCell[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 53 }, () => ({ date: "", count: 0, level: -1 })),
  );

  const jan1 = new Date(Date.UTC(year, 0, 1));
  const originSunday = new Date(jan1);
  originSunday.setUTCDate(jan1.getUTCDate() - jan1.getUTCDay());
  const originMs = originSunday.getTime();

  for (const day of days) {
    const [, m, d] = day.date.split("-").map(Number);
    const cellMs = Date.UTC(year, m - 1, d);
    const diffDays = Math.round((cellMs - originMs) / (1000 * 60 * 60 * 24));
    const col = Math.floor(diffDays / 7);
    const row = diffDays % 7;

    if (col >= 0 && col < 53 && row >= 0 && row < 7) {
      grid[row][col] = { date: day.date, count: day.count, level: day.level };
    }
  }

  return grid;
}

/**
 * Render the contribution grid as an ANSI-colored string.
 */
export function renderGraph(
  days: ContributionDay[],
  theme: Theme,
  _stats: StreakStats,
  year: number,
): string {
  const grid = buildGrid(days, year);
  const lines: string[] = [];

  // Month labels row
  const monthLabels = renderMonthLabels(grid);
  lines.push("      " + monthLabels);

  for (let row = 0; row < 7; row++) {
    const label = DAYS[row].padStart(4);
    let line = label + "  ";

    for (let col = 0; col < 53; col++) {
      const cell = grid[row][col];
      if (cell.level < 0) {
        line += "  ";
      } else {
        const hex = theme.levels[cell.level];
        line += chalk.bgHex(hex)("  ");
      }
    }

    lines.push(line);
  }

  // Legend
  const legend = theme.labels
    .map((label, i) => chalk.bgHex(theme.levels[i])("  ") + " " + label)
    .join("  ");

  lines.push("");
  lines.push("  " + legend);

  return lines.join("\n");
}

function renderMonthLabels(grid: GridCell[][]): string {
  const labels: (string | null)[] = Array.from({ length: 53 }, () => null);

  for (let col = 0; col < 53; col++) {
    for (let row = 0; row < 7; row++) {
      const date = grid[row][col].date;
      if (!date) continue;
      const month = Number.parseInt(date.slice(5, 7), 10);

      // Place month label on first week where the month appears
      if (labels[col] == null) {
        const day = Number.parseInt(date.slice(8, 10), 10);
        if (day <= 7) {
          labels[col] = MONTHS[month - 1];
        }
      }
    }
  }

  let result = "";
  for (let col = 0; col < 53; col++) {
    if (labels[col]) {
      result += labels[col];
      // Pad to fill the column width (2 chars per week column)
      if (labels[col]!.length < 4) result += " ".repeat(4 - labels[col]!.length);
    } else {
      result += "    ";
    }
  }

  return result.trimEnd();
}
