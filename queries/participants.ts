import 'server-only';
import { cacheLife } from 'next/cache';
import { stringify } from 'superjson';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

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

export async function getParticipants() {
  'use cache';
  cacheLife('max');
  safeCacheTag('getParticipants');

  const participants = await prisma_getParticipants();
  const safeParticipants = stringify(participants);
  return safeParticipants;
}

type GetParticipantsType = typeof getParticipants;
export type GetParticipantsReturnType = ReturnType<GetParticipantsType>;
