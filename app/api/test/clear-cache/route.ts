import { NextResponse } from 'next/server';
import { CacheTags, safeRevalidateTag } from '~/lib/cache';

export function POST() {
  // eslint-disable-next-line no-process-env
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 },
    );
  }

  safeRevalidateTag([...CacheTags]);

  return NextResponse.json({ success: true, revalidated: CacheTags });
}
