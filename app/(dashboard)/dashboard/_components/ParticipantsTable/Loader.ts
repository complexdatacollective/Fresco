import { z } from 'zod';
import { api } from '~/app/_trpc/server';
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
    loader: () => api.participants.get.query(),
  });
