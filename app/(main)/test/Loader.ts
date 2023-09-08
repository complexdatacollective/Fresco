// fetch the first interview and render it

import { prisma } from '~/utils/db';
import { z } from 'zod';
import { safeLoader } from '~/lib/data-mapper/safeLoader';

const InterviewValidation = z.object({
  id: z.string(),
  startTime: z.date(),
  finishTime: z.date().nullable(),
  exportTime: z.date().nullable(),
  lastUpdated: z.date(),
  userId: z.string(),
  protocolId: z.string(),
  network: z.string(),
});

export const safeLoadInterview = safeLoader({
  outputValidation: InterviewValidation,
  loader: async (id: string) => {
    const interview = await prisma.interview.findUnique({
      where: {
        id: id,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
        protocol: true,
      },
    });

    return interview;
  },
});
