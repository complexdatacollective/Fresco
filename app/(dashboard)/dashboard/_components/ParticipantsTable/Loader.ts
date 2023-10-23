import { z } from 'zod';
import { trpc } from '~/trpc/server';
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
    loader: () => trpc.participant.get.all.query(),
  });
