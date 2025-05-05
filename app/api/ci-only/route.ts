import { revalidatePath } from 'next/cache';
import { env } from 'process';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/utils/db';

/**
 *
 * This is a route called by the playwright CI tests to reset the db and clear the cache.
 * Uses the NEXT_PUBLIC_PLAYWRIGHT env var to check if it is being called from the CI.
 * It should NOT delete uploadthing files, as the uploadthing bucket is shared across preview deployments.
 *
 */

export async function DELETE(_request: Request) {
  if (!env.NEXT_PUBLIC_PLAYWRIGHT) {
    return new Response(
      'This endpoint is restricted to Playwright CI tests only',
      {
        status: 403,
      },
    );
  }

  try {
    await Promise.all([
      prisma.user.deleteMany(), // Deleting a user will cascade to Session and Key
      prisma.participant.deleteMany(),
      prisma.protocol.deleteMany(), // Deleting protocol will cascade to Interviews
      prisma.appSettings.deleteMany(),
      prisma.events.deleteMany(),
      prisma.asset.deleteMany(),
    ]);

    // add a new initializedAt date
    await prisma.appSettings.create({
      data: {
        key: 'initializedAt',
        value: new Date().toISOString(),
      },
    });

    revalidatePath('/', 'layout');
    safeRevalidateTag('appSettings');
    safeRevalidateTag('activityFeed');
    safeRevalidateTag('summaryStatistics');
    safeRevalidateTag('getProtocols');
    safeRevalidateTag('getParticipants');
    safeRevalidateTag('getInterviews');
  } catch (error) {
    return new Response('Failed to reset database and clear cache', {
      status: 500,
    });
  }

  return new Response('Database reset and all caches cleared successfully', {
    status: 200,
  });
}
