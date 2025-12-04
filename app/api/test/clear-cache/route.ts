import * as fs from 'fs/promises';
import { NextResponse } from 'next/server';
import * as path from 'path';

/**
 * Test-only API endpoint to clear Next.js data cache.
 * This is used by e2e tests to ensure fresh data after database mutations.
 * Only available when SKIP_ENV_VALIDATION is set (test environment).
 */
export async function POST(): Promise<NextResponse> {
  // Only allow when running in test mode (SKIP_ENV_VALIDATION is set by test environment)
  // eslint-disable-next-line no-process-env
  if (process.env.SKIP_ENV_VALIDATION !== 'true') {
    return NextResponse.json(
      { error: 'Not available outside test environment' },
      { status: 403 },
    );
  }

  try {
    const cacheDir = path.join(process.cwd(), '.next', 'cache');

    // Check if cache directory exists
    try {
      await fs.access(cacheDir);
    } catch {
      return NextResponse.json({
        success: true,
        message: 'Cache directory does not exist',
        cleared: false,
      });
    }

    // Get list of cache subdirectories to clear
    const entries = await fs.readdir(cacheDir, { withFileTypes: true });
    const clearedDirs: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(cacheDir, entry.name);
        await fs.rm(dirPath, { recursive: true, force: true });
        clearedDirs.push(entry.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      cleared: true,
      directories: clearedDirs,
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
