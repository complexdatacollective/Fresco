import { z } from 'zod';
import { env } from '~/env.mjs';
import { safeLoader } from '~/utils/safeLoader';

const ParticipantValidation = z.array(
  z.object({
    id: z.string(),
    identifier: z.string(),
  }),
);

export const safeLoadParticipants = safeLoader({
  outputValidation: ParticipantValidation,
  loader: async () => {
    try {
      const data = await fetch(`${env.NEXT_PUBLIC_URL}/api/participants`, {
        method: 'GET',
        cache: 'no-store',
      }).then(async (res) => await res.json());

      if (data.error) throw new Error(data.msg);
      return data.participants;
    } catch (error) {
      console.error(error);
    }
  },
});
