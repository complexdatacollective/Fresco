import { z } from 'zod';
import { prisma } from '~/utils/db';
import { safeLoader } from '~/utils/safeLoader';

const ParticipantValidation = z.array(
  z.object({
    id: z.string(),
    identifier: z.string(),
  }),
);

export const safeLoadParticipants = () =>
  safeLoader({
    outputValidation: ParticipantValidation,
    loader: () => prisma.participant.findMany(),
  });
