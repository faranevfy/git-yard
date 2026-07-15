/**
 * Grid renderer — true-color ANSI contribution graph output.
 *
 * Builds a 7-row grid from contribution data. Columns are aligned to
 * the Sunday of the first week that contains data. Works with any date
 * range (rolling 53-week default or single calendar year).
 *
 * Output is plain terminal text: a header, the aligned grid with month
 * and weekday gutters, a today marker, a gradation legend, and a stats
 * footer. preview.html is generated from this exact output.
 */
import chalk from "chalk";
import type { ContributionDay } from "./fetch.js";
import type { StreakStats } from "./stats.js";
import type { Theme } from "./theme.js";

chalk.level = 3;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const BLOCK = "▆▆";
const SEP = "\u200A"; // Hair space U+200A for smaller horizontal gap

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
  username?: string,
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

  let startWeek = 0;
  if (process.stdout.columns) {
    const gutterWidth = 3; // 'Su ' is 3 chars
    const colWidth = 2 + SEP.length;
    const maxWeeks = Math.floor((process.stdout.columns - gutterWidth) / colWidth);
    if (maxWeeks > 0 && maxWeeks < weeks) {
      startWeek = weeks - maxWeeks;
    }
  }

  const years = new Set(days.map((d) => d.date.slice(0, 4)));
  const yearLabel = years.size === 1 ? [...years][0] : "rolling";
  const todayRow = parseDate(today).getUTCDay();

  const out: string[] = [];

  // Header
  const head = username ? `${username} · ${yearLabel}` : yearLabel;
  out.push(chalk.hex(theme.brand)("◆") + chalk.bold.white(" git-yard") + chalk.dim(`  ${head}`));
  out.push("");

  // Month labels (gutter at col 0, then labels mapped to exactly align with grid columns)
  let monthLine = "";
  let currentMonth = -1;
  const colWidth = 2 + SEP.length;

  for (let w = startWeek; w < weeks; w++) {
    const targetLen = (w - startWeek) * colWidth;
    // Pad to current column start
    while (monthLine.length < targetLen) {
      monthLine += " ";
    }

    const d = new Date(origin);
    d.setUTCDate(d.getUTCDate() + w * 7);
    const m = d.getUTCMonth();
    const isNewMonth = d.getUTCDate() <= 7;
    
    // We only print the month label if it's the first week of the month (or the very first week shown if it starts early)
    if (isNewMonth && m !== currentMonth) {
      monthLine += MONTHS[m];
      currentMonth = m;
    }
  }
  
  out.push("   " + monthLine.trimEnd());

  // Grid
  for (let r = 0; r < 7; r++) {
    let line = DAY_LABELS[r].padEnd(2) + " ";
    for (let w = startWeek; w < weeks; w++) {
      const d = new Date(origin);
      d.setUTCDate(d.getUTCDate() + w * 7 + r);
      const key = d.toISOString().slice(0, 10);
      const cell = map.get(key);

      if (!cell || cell.level < 0) {
        line += "  " + SEP;
      } else {
        const hex = theme.levels[cell.level];
        const isToday = key === today;
        if (isToday) {
          line += chalk.hex(hex).bold(BLOCK) + SEP;
        } else {
          line += chalk.hex(hex)(BLOCK) + SEP;
        }
      }
    }

    out.push(line);
  }

  // Legend (gradation scale, not words)
  out.push("");
  const grad = theme.levels
    .map((hex) => chalk.hex(hex)(BLOCK))
    .join(SEP);
  out.push("  " + chalk.dim("Less") + " " + grad + " " + chalk.dim("More"));

  // Stats footer
  out.push("");
  out.push(
    "  " +
      chalk.bold(stats.totalContributions.toLocaleString()) +
      chalk.dim(" contributions") +
      chalk.dim("   ·   ") +
      chalk.bold(`${stats.currentStreak}d`) +
      chalk.dim(" streak") +
      chalk.dim("   ·   ") +
      chalk.bold(`${stats.longestStreak}d`) +
      chalk.dim(" longest"),
  );

  return out.join("\n");
}
