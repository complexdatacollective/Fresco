// eslint-disable-next-line no-restricted-imports
import { cacheTag, revalidateTag, updateTag } from 'next/cache';

export const CacheTags = [
  'activityFeed',
  'appSettings',
  'getInterviews',
  'summaryStatistics',
  'getParticipants',
  'getProtocols',
  'interviewCount',
  'protocolCount',
  'participantCount',
  'getApiTokens',
  'getUsers',
] as const satisfies string[];

type StaticTag = (typeof CacheTags)[number];

type DynamicTag = `${StaticTag}-${string}`;

type CacheTag = StaticTag | DynamicTag;

/**
 * Invalidate cache tags from Server Actions using `updateTag` for
 * read-your-own-writes semantics (the next request waits for fresh data).
 */
export function safeUpdateTag(tag: CacheTag | CacheTag[]) {
  const tags = Array.isArray(tag) ? tag : [tag];
  for (const t of tags) {
    updateTag(t);
  }
}

/**
 * Invalidate cache tags from Route Handlers using `revalidateTag` with the
 * `'max'` profile (stale-while-revalidate). Cannot use `updateTag` here
 * because it is only available in Server Actions.
 */
export function safeRevalidateTag(tag: CacheTag | CacheTag[]) {
  const tags = Array.isArray(tag) ? tag : [tag];
  for (const t of tags) {
    revalidateTag(t, 'max');
  }
}

export function safeCacheTag(tag: CacheTag | CacheTag[]) {
  if (Array.isArray(tag)) {
    tag.forEach((t) => cacheTag(t));
    return;
  }
  cacheTag(tag);
}
