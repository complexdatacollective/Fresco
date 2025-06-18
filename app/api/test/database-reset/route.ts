import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from '~/env';
import { safeRevalidateTag, type CacheTag } from '~/lib/cache';

// This route is only available in test environment for security
export async function POST(request: NextRequest) {
  // Forbid in production
  if (env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      tags?: CacheTag[];
    };
    const { action, tags } = body;

    switch (action) {
      case 'invalidateCache': {
        safeRevalidateTag(tags);

        return NextResponse.json({
          success: true,
          message: `Cache invalidated.`,
        });
      }

      case undefined:
        return NextResponse.json(
          { error: 'Action is required' },
          { status: 400 },
        );

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Cache invalidation API error:', error);
    return NextResponse.json(
      { error: 'Cache invalidation failed', details: String(error) },
      { status: 500 },
    );
  }
}
