import { unstable_noStore } from 'next/cache';
import { prisma } from '~/utils/db';
import 'server-only';

export async function getParticipants() {
  unstable_noStore();

  const participants = await prisma.participant.findMany({
    include: {
      interviews: true,
      _count: { select: { interviews: true } },
    },
  });

  return participants;
}
