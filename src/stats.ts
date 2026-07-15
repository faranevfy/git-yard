/**
 * Streak calculation from contribution data.
 */

import type { ContributionDay } from "./fetch.js";

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
  currentStreakStart: string | null;
  longestStreakEnd: string | null;
}

export function calculateStreaks(days: ContributionDay[]): StreakStats {
  if (days.length === 0) {
    return {
      currentStreak: 0, longestStreak: 0, totalContributions: 0,
      currentStreakStart: null, longestStreakEnd: null,
    };
  }

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  let total = 0;
  let longestStreak = 0;
  let longestStreakEnd: string | null = null;
  let tempStreak = 0;
  let tempStreakEnd: string | null = null;

  for (const day of sorted) {
    total += day.count;
    if (day.count > 0) {
      tempStreak++;
      tempStreakEnd = day.date;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakEnd = tempStreakEnd;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Current streak: count backwards from most recent day
  let currentStreak = 0;
  let currentStreakStart: string | null = null;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const day = sorted[i];
    if (day.count > 0) {
      currentStreak++;
      currentStreakStart = day.date;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak, totalContributions: total, currentStreakStart, longestStreakEnd };
}
