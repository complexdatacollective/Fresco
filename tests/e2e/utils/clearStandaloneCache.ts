import { rm } from 'node:fs/promises';
import { logger } from './logger';

/**
 * Clear the Next.js cache in the standalone build directory.
 * This prevents stale data from previous runs and avoids race conditions
 * when multiple test instances share the same cache directory.
 */
export async function clearStandaloneCache(cacheDir: string) {
  try {
    await rm(cacheDir, { recursive: true, force: true });
    logger.build.cacheCleared();
  } catch {
    // Cache directory might not exist, which is fine
  }
}
