import { describe, expect, it } from "vitest";
import { renderGraph } from "./render.js";
import { GITHUB_GREEN } from "./theme.js";
import type { ContributionDay } from "./fetch.js";
import type { StreakStats } from "./stats.js";

describe("renderGraph", () => {
  it("should render empty state message if no days are provided", () => {
    const stats: StreakStats = {
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
      currentStreakStart: null,
      longestStreakEnd: null,
    };
    const output = renderGraph([], GITHUB_GREEN, stats);
    expect(output).toContain("No contribution data found.");
  });

  it("should render a graph with header, grid, legend, and footer", () => {
    const days: ContributionDay[] = [
      { date: "2026-07-01", count: 1, level: 1 },
      { date: "2026-07-02", count: 0, level: 0 },
    ];
    const stats: StreakStats = {
      currentStreak: 0,
      longestStreak: 1,
      totalContributions: 1,
      currentStreakStart: null,
      longestStreakEnd: "2026-07-01",
    };

    const output = renderGraph(days, GITHUB_GREEN, stats, "testuser");

    // Header validation
    expect(output).toContain("git-yard");
    expect(output).toContain("testuser");

    // Legend validation
    expect(output).toContain("Less");
    expect(output).toContain("More");

    // Stats footer validation
    expect(output).toContain("contributions");
    expect(output).toContain("streak");
    expect(output).toContain("longest");
  });
});
