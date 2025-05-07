import 'server-only';
import SuperJSON from 'superjson';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/utils/db';

async function prisma_getParticipants() {
  return prisma.participant.findMany({
    include: {
      interviews: true,
      _count: { select: { interviews: true } },
    },
    // Sort to show the most recently created first
    orderBy: { id: 'desc' },
  });
}

export type GetParticipantsQuery = Awaited<
  ReturnType<typeof prisma_getParticipants>
>;

export const getParticipants = createCachedFunction(async () => {
  const participants = await prisma_getParticipants();
  const safeParticipants = SuperJSON.stringify(participants);
  return safeParticipants;
}, ['getParticipants']);

type GetParticipantsType = typeof getParticipants;
export type GetParticipantsReturnType = ReturnType<GetParticipantsType>;
