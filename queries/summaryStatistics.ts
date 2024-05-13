import { unstable_cache } from 'next/cache';
import { prisma } from '~/utils/db';
import 'server-only';

export const getSummaryStatistics = unstable_cache(
  async () => {
    const counts = await prisma.$transaction([
      prisma.interview.count(),
      prisma.protocol.count(),
      prisma.participant.count(),
    ]);

    return {
      interviewCount: counts[0],
      protocolCount: counts[1],
      participantCount: counts[2],
    };
  },
  ['summaryStatistics'],
  {
    tags: [
      'summaryStatistics',
      'interviewCount',
      'protocolCount',
      'participantCount',
    ],
  },
);
