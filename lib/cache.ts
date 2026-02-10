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
  if (env.DISABLE_NEXT_CACHE) {
    return func;
  }

  // eslint-disable-next-line no-process-env
  const VERCEL_DEPLOYMENT_ID = process.env.VERCEL_DEPLOYMENT_ID;
  const keyParts = (options?.keyParts ?? []).concat(
    VERCEL_DEPLOYMENT_ID ? [VERCEL_DEPLOYMENT_ID] : [],
  );

  return unstable_cache(func, keyParts, {
    tags,
    revalidate: options?.revalidate,
  });
}
