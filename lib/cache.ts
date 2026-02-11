import { revalidateTag, unstable_cache } from 'next/cache';
import { env } from '~/env';

export const CacheTags = [
  'activityFeed',
  'appSettings',
  'getInterviews',
  'summaryStatistics',
  'getParticipants',
  'getProtocols',
  'getProtocolsByHash',
  'getExistingAssetIds',
  'interviewCount',
  'protocolCount',
  'participantCount',
  'getApiTokens',
  'getUsers',
] as const satisfies string[];

type StaticTag = (typeof CacheTags)[number];

type DynamicTag = `${StaticTag}-${string}`;

type CacheTag = StaticTag | DynamicTag;

export function safeRevalidateTag(tag: CacheTag | CacheTag[]) {
  if (Array.isArray(tag)) {
    tag.forEach((t) => revalidateTag(t));
    return;
  }
  revalidateTag(tag);
}

type UnstableCacheParams = Parameters<typeof unstable_cache>;

export function createCachedFunction<T extends UnstableCacheParams[0]>(
  func: T,
  tags: CacheTag[],
  options?: {
    keyParts?: string[];
    revalidate?: number | false;
  },
): T {
  // In test mode, bypass caching entirely for proper isolation.
  // Check dynamically to ensure runtime env var is respected.
  if (env.DISABLE_NEXT_CACHE) {
    return func;
  }

  // Include deployment ID in cache key to prevent cache pollution across
  // Vercel deployments. Without this, different deployments could read
  // stale or incompatible cached values from each other.
  // eslint-disable-next-line no-process-env
  const VERCEL_DEPLOYMENT_ID = process.env.VERCEL_DEPLOYMENT_ID;

  // Always include tags in keyParts to prevent cache key collisions between
  // functions with similar structure after minification.
  const keyParts = [
    ...tags,
    ...(options?.keyParts ?? []),
  ].concat(
    VERCEL_DEPLOYMENT_ID ? [VERCEL_DEPLOYMENT_ID] : [],
  );

  return unstable_cache(func, keyParts, {
    tags,
    revalidate: options?.revalidate,
  });
}
