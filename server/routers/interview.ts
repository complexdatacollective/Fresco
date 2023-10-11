/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { publicProcedure, protectedProcedure, router } from '~/server/trpc';

import { participantIdentifierSchema } from '~/shared/schemas';
import { z } from 'zod';

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
            errorType: 'NO_ACTIVE_PROTOCOL',
            error: 'Failed to create interview: no active protocol',
            createdInterview: null,
          };
        }

        const existingInterview = await prisma.interview.findFirst({
          where: {
            participant: {
              identifier,
            },
          },
        });

        if (existingInterview) {
          return {
            errorType: 'IDENTIFIER_IN_USE',
            error: 'Identifier is already in use',
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

        return { error: null, createdInterview, errorType: null };
      } catch (error) {
        return {
          errorType: 'UNKNOWN',
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
          participant: true,
        },
      });
      return interviews;
    }),
    byId: publicProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .query(async ({ input: id }) => {
        const interview = await prisma.interview.findFirst({
          where: id,
          include: {
            protocol: true,
            participant: true,
          },
        });
        return interview;
      }),
  }),
  deleteSingle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
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
    .input(
      z.array(
        z.object({
          id: z.string(),
        }),
      ),
    )
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
