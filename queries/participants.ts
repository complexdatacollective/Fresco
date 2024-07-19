import 'server-only';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/utils/db';

export const getParticipants = createCachedFunction(async () => {
  const participants = await prisma.participant.findMany({
    include: {
      interviews: true,
      _count: { select: { interviews: true } },
    },
  });

  return participants;
}, ['getParticipants']);

type GetParticipantsType = typeof getParticipants;
export type GetParticipantsReturnType = ReturnType<GetParticipantsType>;
