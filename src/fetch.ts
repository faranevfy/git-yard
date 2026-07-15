/**
 * HTML scraper for GitHub's public contribution page.
 *
 * Fetches `github.com/users/{username}/contributions`
 * and extracts `<tool-tip>` elements with data attributes.
 */

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: number; // 0-4 matching GitHub's scale
}

export interface FetchResult {
  username: string;
  year: number;
  days: ContributionDay[];
}

const GIT_YARD_UA = "git-yard (https://github.com/evfydev/git-yard)";

export async function fetchContributions(
  username: string,
  year: number,
): Promise<FetchResult> {
  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions` +
    (year !== new Date().getFullYear()
      ? `?from=${year}-01-01&to=${year}-12-31`
      : "");

  const response = await fetch(url, {
    headers: { "User-Agent": GIT_YARD_UA, Accept: "text/html" },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub returned ${response.status} — user "${username}" may not exist`,
    );
  }

  const html = await response.text();
  return parseContributionHtml(html, username, year);
}

export function parseContributionHtml(
  html: string,
  username: string,
  year: number,
): FetchResult {
  const days: ContributionDay[] = [];

  // GitHub's actual markup: <td data-date="..." data-level="..."><tool-tip>N contributions...</tool-tip></td>
  const regex =
    /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"[^>]*>[\s\S]*?<tool-tip[^>]*>([^<]*)<\/tool-tip>/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const date = match[1];
    const level = Number.parseInt(match[2], 10);
    const innerText = match[3].trim();

    if (!date.startsWith(`${year}-`)) continue;

    let count = 0;
    if (!innerText.startsWith("No contributions")) {
      const countMatch = innerText.match(/^(\d+)/);
      if (countMatch) count = Number.parseInt(countMatch[1], 10);
    }

    days.push({ date, count, level });
  }

  return { username, year, days };
}
