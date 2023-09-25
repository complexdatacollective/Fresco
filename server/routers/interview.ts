/* eslint-disable local-rules/require-data-mapper */
import * as z from 'zod';
import { prisma } from '~/utils/db';
import { publicProcedure, protectedProcedure, router } from '~/server/trpc';

const deleteSingleSchema = z.object({
  id: z.string(),
});

const deleteManySchema = z.array(
  z.object({
    id: z.string(),
  }),
);

export const interviewRouter = router({
  get: publicProcedure.query(async () => {
    const interviews = await prisma.interview.findMany();
    return interviews;
  }),
  deleteSingle: protectedProcedure
    .input(deleteSingleSchema)
    .mutation(async ({ input: { id } }) => {
      try {
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
