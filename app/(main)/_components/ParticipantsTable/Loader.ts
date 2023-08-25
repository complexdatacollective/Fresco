import { prisma } from '~/utils/db';
import { safeLoader } from '~/lib/data-mapper/safeLoader';
import { UserValidation } from '~/lib/data-mapper/validation';

async function loadParticiapnts() {
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
}

export const safeLoadParticipants = safeLoader({
  outputValidation: UserValidation,
  loader: loadParticiapnts,
});
