import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { safeRevalidateTag, type CacheTag } from '~/lib/cache';

// This route is only available in test environment for security
export async function POST(request: NextRequest) {
  // Only allow in test environment or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_API) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json() as { action?: string; tags?: string[] };
    const { action, tags } = body;

    switch (action) {
      case 'invalidateCache': {
        const defaultTags: CacheTag[] = [
          'appSettings',
          'appSettings-configured',
          'appSettings-initializedAt',
          'appSettings-disableAnalytics',
          'getInterviews',
          'summaryStatistics',
          'getParticipants',
          'getProtocols',
          'getProtocolsByHash',
          'getExistingAssetIds',
          'interviewCount',
          'protocolCount',
          'participantCount',
        ];
        
        const cacheTags: CacheTag[] = tags ? tags as CacheTag[] : defaultTags;

        // Invalidate specified cache tags
        safeRevalidateTag(cacheTags);
        
        return NextResponse.json({ 
          success: true, 
          message: `Cache invalidated for tags: ${cacheTags.join(', ')}` 
        });
      }

      case undefined:
        return NextResponse.json({ error: 'Action is required' }, { status: 400 });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache invalidation API error:', error);
    return NextResponse.json(
      { error: 'Cache invalidation failed', details: String(error) },
      { status: 500 }
    );
  }
}