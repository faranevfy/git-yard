/**
 * GitHub contribution graph color theme.
 *
 * Exact hex values from GitHub's 5-level green scale.
 */

export interface Theme {
  name: string;
  levels: [string, string, string, string, string];
  labels: [string, string, string, string, string];
}

/** GitHub's canonical green palette. */
export const GITHUB_GREEN: Theme = {
  name: "GitHub Green",
  levels: ["#ffffff", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  labels: [
    "No contributions",
    "1-9 contributions",
    "10-19 contributions",
    "20-29 contributions",
    "30+ contributions",
  ],
};

/** GitHub's dark mode palette — for terminals with dark backgrounds. */
export const GITHUB_DARK: Theme = {
  name: "GitHub Dark",
  levels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  labels: GITHUB_GREEN.labels,
};

/** Blue theme — color-blind accessible alternative. */
export const GITHUB_BLUE: Theme = {
  name: "GitHub Blue",
  levels: ["#ebedf0", "#c6e6ff", "#7bc4ff", "#3093ff", "#0060df"],
  labels: GITHUB_GREEN.labels,
};

export const THEMES: Record<string, Theme> = {
  green: GITHUB_GREEN,
  dark: GITHUB_DARK,
  blue: GITHUB_BLUE,
};

export const DEFAULT_THEME = "green";
