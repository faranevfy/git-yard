/**
 * HTML scraper for GitHub's public contribution page.
 *
 * Fetches `github.com/users/{username}/contributions`
 * and extracts all contribution data attributes.
 */

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: number; // 0-4 matching GitHub's scale
}

export interface FetchResult {
  username: string;
  days: ContributionDay[];
}

const GIT_YARD_UA = "git-yard (https://github.com/faranevfy/git-yard)";

/**
 * Fetch contributions. If `year` is null, uses GitHub's default
 * rolling 53-week view. If specified, requests exactly that calendar year.
 */
export async function fetchContributions(
  username: string,
  year: number | null,
): Promise<FetchResult> {
  let url = `https://github.com/users/${encodeURIComponent(username)}/contributions`;
  if (year !== null) {
    url += `?from=${year}-01-01&to=${year}-12-31`;
  }

  const response = await fetch(url, {
    headers: { "User-Agent": GIT_YARD_UA, Accept: "text/html" },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub returned ${response.status} — user "${username}" may not exist`,
    );
  }

  const html = await response.text();
  return { username, days: parseContributionDays(html) };
}

function parseContributionDays(html: string): ContributionDay[] {
  const days: ContributionDay[] = [];

  // Matches <td data-date="..." data-level="..."><tool-tip>N contributions...</tool-tip></td>
  const regex =
    /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"[^>]*>[\s\S]*?<tool-tip[^>]*>([^<]*)<\/tool-tip>/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const date = match[1];
    const level = Number.parseInt(match[2], 10);
    const text = match[3].trim();

    let count = 0;
    if (!text.startsWith("No contributions")) {
      const m = text.match(/^(\d+)/);
      if (m) count = Number.parseInt(m[1], 10);
    }

    days.push({ date, count, level });
  }

  return days;
}
