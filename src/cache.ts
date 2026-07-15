/**
 * File-based cache for contribution data.
 *
 * Stores data in ~/.git-yard/{username}_{year}.json
 * with a 15-minute TTL.
 */

import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { FetchResult } from "./fetch.js";

const CACHE_DIR = join(homedir(), ".git-yard");
const TTL_MS = 15 * 60 * 1000;

function cachePath(username: string, year: number): string {
  return join(CACHE_DIR, `${username}_${year}.json`);
}

async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

export async function readCache(
  username: string,
  year: number,
): Promise<FetchResult | null> {
  const path = cachePath(username, year);
  try {
    const stats = await stat(path);
    if (Date.now() - stats.mtimeMs > TTL_MS) return null;
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw) as FetchResult;
  } catch {
    return null;
  }
}

export async function writeCache(data: FetchResult): Promise<void> {
  await ensureCacheDir();
  await writeFile(cachePath(data.username, data.year), JSON.stringify(data), "utf-8");
}

export function getCacheDir(): string {
  return CACHE_DIR;
}
