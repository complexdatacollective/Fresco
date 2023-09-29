import * as z from 'zod';
import { prisma } from '~/utils/db';
import { publicProcedure, protectedProcedure, router } from '~/server/trpc';
import { safeLoader } from '~/utils/safeLoader';

const deleteSingleSchema = z.object({
  id: z.string(),
});

const deleteManySchema = z.array(
  z.object({
    id: z.string(),
  }),
);

const InterviewValidation = z.array(
  z.object({
    id: z.string(),
    startTime: z.date(),
    finishTime: z.date().nullable(),
    exportTime: z.date().nullable(),
    lastUpdated: z.date(),
    participantId: z.string(),
    protocolId: z.string(),
    currentStep: z.number(),
    participant: z.object({
      id: z.string(),
      identifier: z.string(),
    }),
    protocol: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }),
);

export const interviewRouter = router({
  get: publicProcedure.query(async () => {
    const interviews = safeLoader({
      outputValidation: InterviewValidation,
      loader: () =>
        prisma.interview.findMany({
          include: {
            protocol: true,
            participant: true,
          },
        }),
    });
    return interviews;
  }),
  deleteSingle: protectedProcedure
    .input(deleteSingleSchema)
    .mutation(async ({ input: { id } }) => {
      try {
        // eslint-disable-next-line local-rules/require-data-mapper
        const deletedInterivew = await prisma.interview.delete({
          where: { id },
        });
        return { error: null, interview: deletedInterivew };
      } catch (error) {
        return { error: 'Failed to delete interview', interview: null };
      }
    }),
  deleteMany: protectedProcedure
    .input(deleteManySchema)
    .mutation(async ({ input: data }) => {
      const idsToDelete = data.map((p) => p.id);

      try {
        // eslint-disable-next-line local-rules/require-data-mapper
        const deletedInterviews = await prisma.interview.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });
        return { error: null, participant: deletedInterviews };
      } catch (error) {
        return { error: 'Failed to delete interviews', interview: null };
      }
    }),
});
