import { prisma } from '~/utils/db';
import { safeLoader } from '~/utils/safeLoader';
import { z } from 'zod';

const InterviewValidation = z.array(
  z.object({
    id: z.string(),
    startTime: z.date(),
    finishTime: z.date().nullable(),
    exportTime: z.date().nullable(),
    lastUpdated: z.date(),
    protocolId: z.string(),
    currentStep: z.number(),
    network: z.string(),
  }),
);

export const safeLoadInterviews = safeLoader({
  outputValidation: InterviewValidation,
  loader: () =>
    prisma.interview.findMany({
      include: {
        protocol: true,
      },
    }),
});
