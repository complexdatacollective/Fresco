import 'server-only';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

export async function getSummaryStatistics() {
  'use cache';
  safeCacheTag([
    'summaryStatistics',
    'interviewCount',
    'protocolCount',
    'participantCount',
  ]);

  const [interviewCount, protocolCount, participantCount] = await Promise.all([
    prisma.interview.count(),
    prisma.protocol.count({
      where: { isPreview: false },
    }),
    prisma.participant.count(),
  ]);

  return {
    interviewCount,
    protocolCount,
    participantCount,
  };
}
