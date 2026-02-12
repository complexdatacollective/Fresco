/**
 * No-op cache handler for E2E test isolation.
 *
 * Implements the `cacheHandlers` API (Next.js 16+) which intercepts
 * 'use cache' directives. Returns cache misses for all operations,
 * ensuring each test environment has complete data isolation.
 *
 * This handler is only enabled when DISABLE_NEXT_CACHE=true (see next.config.ts).
 * In production, Next.js uses its default in-memory LRU cache handler.
 *
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers
 * @see lib/cache.ts for the typesafe cache tag wrappers
 */

module.exports = {
  async get(_cacheKey, _softTags) {
    return undefined;
  },

  async set(_cacheKey, _pendingEntry) {
    // No-op
  },

  async refreshTags() {
    // No-op
  },

  async getExpiration(_tags) {
    return 0;
  },

  async updateTags(_tags, _durations) {
    // No-op
  },
};
