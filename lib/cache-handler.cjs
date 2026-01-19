/**
 * Custom Next.js cache handler that supports disabling cache for E2E tests.
 *
 * In production: delegates to the default file-based caching behavior
 * In test mode (DISABLE_NEXT_CACHE=true): returns cache misses to ensure isolation
 *
 * This file must be CommonJS as required by Next.js cache handler API.
 *
 * @see https://nextjs.org/docs/14/app/api-reference/next-config-js/incrementalCacheHandlerPath
 */

/* eslint-disable @typescript-eslint/no-require-imports, no-process-env */
const fs = require('fs');
const path = require('path');

// Check if we're in test mode at module load time
const isTestMode = process.env.DISABLE_NEXT_CACHE === 'true';

module.exports = class CacheHandler {
  constructor(options) {
    this.options = options;
    this.cacheDir = path.join(options.serverDistDir, 'cache', 'fetch-cache');
  }

  async get(key) {
    // In test mode, always return cache miss for complete isolation
    if (isTestMode) {
      return null;
    }

    try {
      const filePath = path.join(this.cacheDir, key);
      const data = await fs.promises.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);

      // Check if the cache entry has expired
      if (parsed.revalidate && parsed.lastModified) {
        const age = Date.now() - parsed.lastModified;
        if (age > parsed.revalidate * 1000) {
          return null;
        }
      }

      return parsed;
    } catch {
      return null;
    }
  }

  async set(key, data, ctx) {
    // In test mode, don't persist anything
    if (isTestMode) {
      return;
    }

    try {
      await fs.promises.mkdir(this.cacheDir, { recursive: true });

      const filePath = path.join(this.cacheDir, key);
      const cacheEntry = {
        ...data,
        lastModified: Date.now(),
        revalidate: ctx?.revalidate,
      };

      await fs.promises.writeFile(filePath, JSON.stringify(cacheEntry), 'utf-8');
    } catch {
      // Silently fail on cache write errors
    }
  }

  async revalidateTag(tag) {
    // In test mode, no-op since we're not caching anything
    if (isTestMode) {
      return;
    }

    // For production, we'd need to iterate through cache entries and invalidate
    // those with matching tags. For simplicity, we clear the entire cache directory
    // when a tag is revalidated. A more sophisticated implementation would track
    // tag -> key mappings.
    try {
      const files = await fs.promises.readdir(this.cacheDir);

      for (const file of files) {
        try {
          const filePath = path.join(this.cacheDir, file);
          const data = await fs.promises.readFile(filePath, 'utf-8');
          const parsed = JSON.parse(data);

          if (parsed.tags?.includes(tag)) {
            await fs.promises.unlink(filePath);
          }
        } catch {
          // Skip files that can't be read or parsed
        }
      }
    } catch {
      // Cache directory might not exist
    }
  }
};
