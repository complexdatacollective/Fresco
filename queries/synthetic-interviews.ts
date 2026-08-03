import { prisma } from '~/lib/db';

export async function getSyntheticInterviewCount() {
  const [interviewCount, participantCount] = await Promise.all([
    prisma.interview.count({ where: { isSynthetic: true } }),
    prisma.participant.count({ where: { isSynthetic: true } }),
  ]);

  return { interviewCount, participantCount };
}
