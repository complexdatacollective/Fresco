import 'server-only';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/lib/db';

export const getSummaryStatistics = createCachedFunction(async () => {
  const counts = await prisma.$transaction([
    prisma.interview.count(),
    prisma.protocol.count({
      where: { isPreview: false },
    }),
    prisma.participant.count(),
  ]);

  return {
    interviewCount: counts[0],
    protocolCount: counts[1],
    participantCount: counts[2],
  };
}, [
  'summaryStatistics',
  'interviewCount',
  'protocolCount',
  'participantCount',
]);
