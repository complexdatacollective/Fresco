'use server';

import { addEvent } from '~/actions/activityFeed';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

export async function revalidateSyntheticData() {
  await requireApiAuth();

  safeUpdateTag([
    'getInterviews',
    'getParticipants',
    'interviewCount',
    'participantCount',
    'summaryStatistics',
    'activityFeed',
  ]);
}

export async function deleteSyntheticData() {
  await requireApiAuth();

  try {
    const interviewCount = await prisma.interview.count({
      where: { isSynthetic: true },
    });
    const participantCount = await prisma.participant.count({
      where: { isSynthetic: true },
    });

    // Delete interviews first (foreign key constraint)
    await prisma.interview.deleteMany({
      where: { isSynthetic: true },
    });

    await prisma.participant.deleteMany({
      where: { isSynthetic: true },
    });

    safeUpdateTag([
      'getInterviews',
      'getParticipants',
      'interviewCount',
      'participantCount',
      'summaryStatistics',
      'activityFeed',
    ]);

    void addEvent(
      'Synthetic Data Deleted',
      `Deleted ${String(interviewCount)} synthetic interviews and ${String(participantCount)} test participants`,
    );

    return { error: null, deleted: { interviewCount, participantCount } };
  } catch (_error) {
    return { error: 'Failed to delete synthetic data', deleted: null };
  }
}
