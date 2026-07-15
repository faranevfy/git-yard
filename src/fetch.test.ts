import { describe, expect, it, vi } from "vitest";
import { fetchContributions } from "./fetch.js";

describe("fetchContributions", () => {
  it("should parse contributions HTML successfully", async () => {
    const mockHtml = `
      <table>
        <tr>
          <td data-date="2026-07-01" data-level="1">
            <tool-tip>1 contribution on July 1, 2026</tool-tip>
          </td>
          <td data-date="2026-07-02" data-level="2">
            <tool-tip>12 contributions on July 2, 2026</tool-tip>
          </td>
          <td data-date="2026-07-03" data-level="0">
            <tool-tip>No contributions on July 3, 2026</tool-tip>
          </td>
        </tr>
      </table>
    `;

    const mockResponse = {
      ok: true,
      status: 200,
      text: async () => mockHtml,
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await fetchContributions("test-user", null);
    expect(result.username).toBe("test-user");
    expect(result.days).toHaveLength(3);

    expect(result.days[0]).toEqual({
      date: "2026-07-01",
      count: 1,
      level: 1,
    });
    expect(result.days[1]).toEqual({
      date: "2026-07-02",
      count: 12,
      level: 2,
    });
    expect(result.days[2]).toEqual({
      date: "2026-07-03",
      count: 0,
      level: 0,
    });

    vi.unstubAllGlobals();
  });

  it("should throw error if fetch fails", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await expect(fetchContributions("non-existent-user", null)).rejects.toThrow(
      'GitHub returned 404 — user "non-existent-user" may not exist',
    );

    vi.unstubAllGlobals();
  });
});
