import { revalidateTag, unstable_cache } from 'next/cache';

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
  // eslint-disable-next-line no-process-env
  const VERCEL_DEPLOYMENT_ID = process.env.VERCEL_DEPLOYMENT_ID;
  // eslint-disable-next-line no-console
  console.log('VERCEL_DEPLOYMENT_ID', VERCEL_DEPLOYMENT_ID);
  const keyParts = options?.keyParts?.concat(
    VERCEL_DEPLOYMENT_ID ? [VERCEL_DEPLOYMENT_ID] : [],
  );

  return unstable_cache(func, keyParts, {
    tags,
    revalidate: options?.revalidate,
  });
}
