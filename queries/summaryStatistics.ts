import 'server-only';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/lib/db';

export const getSummaryStatistics = createCachedFunction(async () => {
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
}, [
  'summaryStatistics',
  'interviewCount',
  'protocolCount',
  'participantCount',
]);
