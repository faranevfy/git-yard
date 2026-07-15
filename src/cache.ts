/**
 * File-based cache for contribution data.
 *
 * Stores data in ~/.gitreak/{username}_{year|"rolling"}.json
 * with a 15-minute TTL.
 */

import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { FetchResult } from "./fetch.js";

const CACHE_DIR = join(homedir(), ".gitreak");
const TTL_MS = 15 * 60 * 1000;

function cacheKey(username: string, year: number | null): string {
  return year !== null ? `${username}_${year}` : `${username}_rolling`;
}

function cacheFile(username: string, year: number | null): string {
  return join(CACHE_DIR, `${cacheKey(username, year)}.json`);
}

async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

export async function readCache(
  username: string,
  year: number | null,
): Promise<FetchResult | null> {
  const path = cacheFile(username, year);
  try {
    const stats = await stat(path);
    if (Date.now() - stats.mtimeMs > TTL_MS) return null;
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw) as FetchResult;
  } catch {
    return null;
  }
}

export async function writeCache(
  data: FetchResult,
  year: number | null,
): Promise<void> {
  await ensureCacheDir();
  await writeFile(cacheFile(data.username, year), JSON.stringify(data), "utf-8");
}

export function getCacheDir(): string {
  return CACHE_DIR;
}
