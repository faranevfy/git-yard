import { describe, expect, it } from "vitest";
import { calculateStreaks } from "./stats.js";
import type { ContributionDay } from "./fetch.js";

describe("calculateStreaks", () => {
  it("should handle empty days array", () => {
    const stats = calculateStreaks([]);
    expect(stats.totalContributions).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.currentStreakStart).toBeNull();
    expect(stats.longestStreakEnd).toBeNull();
  });

  it("should calculate total contributions correctly", () => {
    const days: ContributionDay[] = [
      { date: "2026-07-01", count: 2, level: 1 },
      { date: "2026-07-02", count: 5, level: 2 },
      { date: "2026-07-03", count: 0, level: 0 },
    ];
    const stats = calculateStreaks(days);
    expect(stats.totalContributions).toBe(7);
  });

  it("should calculate current and longest streaks correctly", () => {
    const days: ContributionDay[] = [
      { date: "2026-07-01", count: 1, level: 1 },
      { date: "2026-07-02", count: 1, level: 1 }, // streak of 2
      { date: "2026-07-03", count: 0, level: 0 },
      { date: "2026-07-04", count: 1, level: 1 }, // streak of 3
      { date: "2026-07-05", count: 2, level: 1 },
      { date: "2026-07-06", count: 1, level: 1 },
      { date: "2026-07-07", count: 0, level: 0 },
      { date: "2026-07-08", count: 3, level: 1 }, // current streak of 1
    ];

    const stats = calculateStreaks(days);
    expect(stats.longestStreak).toBe(3);
    expect(stats.longestStreakEnd).toBe("2026-07-06");
    expect(stats.currentStreak).toBe(1);
    expect(stats.currentStreakStart).toBe("2026-07-08");
  });

  it("should handle current streak of 0 when last day has no contributions", () => {
    const days: ContributionDay[] = [
      { date: "2026-07-01", count: 1, level: 1 },
      { date: "2026-07-02", count: 0, level: 0 },
    ];
    const stats = calculateStreaks(days);
    expect(stats.currentStreak).toBe(0);
    expect(stats.currentStreakStart).toBeNull();
  });
});
