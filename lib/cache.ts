import { revalidateTag, unstable_cache } from 'next/cache';
import { env } from '~/env.js';

type StaticTag =
  | 'activityFeed'
  | 'appSettings'
  | 'getInterviews'
  | 'summaryStatistics'
  | 'getParticipants'
  | 'getInterviewById'
  | 'getProtocols'
  | 'getInterviewsForExport'
  | 'getProtocolsByHash'
  | 'getExistingAssetIds'
  | 'interviewCount'
  | 'protocolCount'
  | 'participantCount';

type DynamicTag = `${StaticTag}-${string}`;

type CacheTag = StaticTag | DynamicTag;

export function safeRevalidateTag(tag: CacheTag) {
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
  const VERCEL_DEPLOYMENT_ID = env.VERCEL_DEPLOYMENT_ID;
  const VERCEL_ENV = env.VERCEL_ENV;

  const keyParts =
    VERCEL_ENV === 'preview'
      ? options?.keyParts?.concat(
          VERCEL_DEPLOYMENT_ID ? [VERCEL_DEPLOYMENT_ID] : [],
        )
      : options?.keyParts;

  return unstable_cache(func, keyParts, {
    tags,
    revalidate: options?.revalidate,
  });
}
