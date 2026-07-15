/**
 * Grid renderer — true-color ANSI contribution graph output.
 *
 * Builds a 7-row grid from contribution data. Columns are aligned to
 * the Sunday of the first week that contains data. Works with any date
 * range (rolling 53-week default or single calendar year).
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

function dayMap(days: ContributionDay[]): Map<string, ContributionDay> {
  const m = new Map<string, ContributionDay>();
  for (const d of days) m.set(d.date, d);
  return m;
}

/** Parse "YYYY-MM-DD" to a UTC Date. */
function parseDate(s: string): Date {
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d));
}

/** Sunday value from getUTCDay(). */
function prevSunday(d: Date): Date {
  const s = new Date(d);
  s.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return s;
}

export function renderGraph(
  days: ContributionDay[],
  theme: Theme,
  stats: StreakStats,
): string {
  if (days.length === 0) return "  No contribution data found.";

  const today = new Date().toISOString().slice(0, 10);
  const map = dayMap(days);
  const sorted = [...days].map((d) => d.date).sort();
  const firstDate = sorted[0];
  const lastDate = sorted[sorted.length - 1];

  const origin = prevSunday(parseDate(firstDate));
  const endSunday = prevSunday(parseDate(lastDate));
  const weeks = Math.round((endSunday.getTime() - origin.getTime()) / (7 * 86400000)) + 1;

  const out: string[] = [];

  // Month labels
  const labelRow: string[] = [];
  for (let w = 0; w < weeks; w++) {
    const d = new Date(origin);
    d.setUTCDate(d.getUTCDate() + w * 7);
    labelRow.push(d.getUTCDate() <= 7 ? MONTHS[d.getUTCMonth()] : "");
  }
  out.push("     " + labelRow.map((l) => l.padEnd(3)).join(""));

  // Grid
  for (let r = 0; r < 7; r++) {
    let line = "  " + DAY_LABELS[r] + " ";
    for (let w = 0; w < weeks; w++) {
      const d = new Date(origin);
      d.setUTCDate(d.getUTCDate() + w * 7 + r);
      const key = d.toISOString().slice(0, 10);
      const cell = map.get(key);

      if (!cell || cell.level < 0) {
        line += "   ";
      } else {
        const hex = theme.levels[cell.level];
        const isToday = key === today;
        line += chalk.bgHex(hex)(isToday ? "▐█" + " " : BLOCK + " ");
      }
    }
    out.push(line);
  }

  // Legend
  out.push("");
  out.push(
    "  " +
      theme.labels
        .map((l, i) => chalk.bgHex(theme.levels[i])(BLOCK) + chalk.dim(l))
        .join("  "),
  );

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
