import 'server-only';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/lib/db/client';

export const getParticipants = createCachedFunction(async () => {
  const participants = await prisma.participant.findMany({
    include: {
      interviews: true,
      _count: { select: { interviews: true } },
    },
    // Sort to show the most recently created first
    orderBy: { id: 'desc' },
  });

  return participants;
}, ['getParticipants']);

type GetParticipantsType = typeof getParticipants;
export type GetParticipantsReturnType = ReturnType<GetParticipantsType>;
