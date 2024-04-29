import { unstable_noStore } from 'next/cache';
import { prisma } from '~/utils/db';

export const getParticipants = async () => {
  unstable_noStore();

  const participants = await prisma.participant.findMany({
    include: {
      interviews: true,
      _count: { select: { interviews: true } },
    },
  });

  return participants;
};

export type GetParticipantsType = typeof getParticipants;
export type GetParticipantsReturnType = ReturnType<GetParticipantsType>;
