import { revalidateTag, unstable_cache } from 'next/cache';

type StaticTag =
  | 'activityFeed'
  | 'appSettings'
  | 'getInterviews'
  | 'summaryStatistics'
  | 'getParticipants'
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
  return unstable_cache(func, options?.keyParts, {
    tags,
    revalidate: options?.revalidate,
  });
}
