import { prisma } from '~/utils/db';
import { safeLoader } from '~/lib/data-mapper/safeLoader';
import { z } from 'zod';

const ParticipantValidation = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
  }),
);

export const safeLoadParticipants = safeLoader({
  outputValidation: ParticipantValidation,
  loader: async () => {
    const participants = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            name: 'PARTICIPANT',
          },
        },
      },
    });
    return participants;
  },
});
