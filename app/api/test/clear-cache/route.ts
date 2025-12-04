import { NextResponse } from 'next/server';
import { CacheTags, safeRevalidateTag } from '~/lib/cache';

/**
 * Test-only API endpoint to clear Next.js data cache.
 * This is used by e2e tests to ensure fresh data after database mutations.
 * Only available when SKIP_ENV_VALIDATION is set (test environment).
 *
 * Uses revalidateTag() to properly invalidate the in-memory cache,
 * not just the filesystem cache.
 */
export function POST(): NextResponse {
  // Only allow when running in test mode (SKIP_ENV_VALIDATION is set by test environment)
  // eslint-disable-next-line no-process-env
  if (process.env.SKIP_ENV_VALIDATION !== 'true') {
    return NextResponse.json(
      { error: 'Not available outside test environment' },
      { status: 403 },
    );
  }

  try {
    // Revalidate all cache tags to clear the in-memory cache
    const revalidatedTags: string[] = [];

    for (const tag of CacheTags) {
      safeRevalidateTag(tag);
      revalidatedTags.push(tag);
    }

    return NextResponse.json({
      success: true,
      message: 'Cache invalidated successfully',
      revalidatedTags,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache',
      },
      { status: 500 },
    );
  }
}
