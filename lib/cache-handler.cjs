/**
 * No-op cache handler for E2E test isolation.
 *
 * This handler returns cache misses for all operations, ensuring each test
 * environment has complete data isolation. It handles the file-based Data Cache
 * layer of Next.js caching.
 *
 * The other caching layer (in-memory request deduplication) is handled by
 * lib/cache.ts which bypasses unstable_cache entirely when DISABLE_NEXT_CACHE=true.
 *
 * This handler is only enabled when DISABLE_NEXT_CACHE=true (see next.config.js).
 * In production, Next.js uses its default cache handler.
 *
 * @see https://nextjs.org/docs/app/api-reference/next-config-js/cacheHandler
 * @see lib/cache.ts for the complete caching strategy documentation
 */

module.exports = class NoOpCacheHandler {
  async get(_key) {
    return null;
  }

  async set(_key, _data, _ctx) {
    // No-op
  }

  async revalidateTag(_tag) {
    // No-op
  }
};
