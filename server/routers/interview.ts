/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { publicProcedure, protectedProcedure, router } from '~/server/trpc';

import {
  interviewIdSchema,
  interviewListInputSchema,
  participantIdentifierSchema,
} from '~/shared/schemas';

export const interviewRouter = router({
  create: publicProcedure
    .input(participantIdentifierSchema)
    .mutation(async ({ input: identifier }) => {
      try {
        // get the active protocol id to connect to the interview
        const activeProtocol = await prisma.protocol.findFirst({
          where: { active: true },
        });

        if (!activeProtocol) {
          return {
            error: 'Failed to create interview: no active protocol',
            createdInterview: null,
          };
        }

        const createdInterview = await prisma.interview.create({
          data: {
            startTime: new Date(),
            lastUpdated: new Date(),
            currentStep: 0,
            network: '',
            participant: {
              create: {
                identifier: identifier,
              },
            },
            protocol: {
              connect: {
                id: activeProtocol.id,
              },
            },
          },
        });

        return { error: null, createdInterview };
      } catch (error) {
        return {
          error: 'Failed to create interview',
          createdInterview: null,
        };
      }
    }),
  get: router({
    all: publicProcedure.query(async () => {
      const interviews = await prisma.interview.findMany({
        include: {
          protocol: true,
        },
      });
      return interviews;
    }),
    byId: publicProcedure
      .input(interviewIdSchema)
      .query(async ({ input: id }) => {
        const interview = await prisma.interview.findFirst({
          where: id,
          include: {
            protocol: true,
          },
        });
        return interview;
      }),
  }),
  deleteSingle: protectedProcedure
    .input(interviewIdSchema)
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
    .input(interviewListInputSchema)
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