/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { publicProcedure, protectedProcedure, router } from '~/server/trpc';
import { participantIdentifierSchema } from '~/shared/schemas/schemas';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { NcNetworkZod } from '~/shared/schemas/network-canvas';

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

        const createdInterview = await prisma.interview.create({
          data: {
            startTime: new Date(),
            lastUpdated: new Date(),
            network: Prisma.JsonNull,
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
  updateNetwork: publicProcedure
    .input(
      z.object({
        interviewId: z.string().cuid(),
        network: NcNetworkZod.or(z.null()),
      }),
    )
    .mutation(async ({ input: { interviewId, network } }) => {
      try {
        const updatedInterview = await prisma.interview.update({
          where: {
            id: interviewId,
          },
          data: {
            network,
          },
        });

        return { error: null, updatedInterview };
      } catch (error) {
        return { error: 'Failed to update interview', updatedInterview: null };
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
            protocol: {
              include: {
                assets: true,
              },
            },
          },
        });

        return interview;
      }),
  }),
  delete: protectedProcedure
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
        const deletedInterviews = await prisma.interview.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });
        return { error: null, interview: deletedInterviews };
      } catch (error) {
        return { error: 'Failed to delete interviews', interview: null };
      }
    }),
});
