/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { publicProcedure, protectedProcedure, router } from '~/server/trpc';
import { participantIdentifierSchema } from '~/shared/schemas/schemas';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { NcNetworkZod } from '~/shared/schemas/network-canvas';
import { ensureError } from '~/utils/ensureError';

export const interviewRouter = router({
  sync: router({
    stageIndex: publicProcedure
      .input(
        z.object({
          interviewId: z.string().cuid(),
          stageIndex: z.number(),
        }),
      )
      .mutation(async ({ input: { interviewId, stageIndex } }) => {
        try {
          const result = await prisma.interview.update({
            where: {
              id: interviewId,
            },
            data: {
              currentStep: stageIndex,
              lastUpdated: new Date(),
            },
          });

          console.log(result);

          return { success: true, error: null };
        } catch (error) {
          return { success: false, error: 'Failed to update interview' };
        }
      }),
    network: publicProcedure
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
              lastUpdated: new Date(),
            },
          });

          return { error: null, updatedInterview };
        } catch (error) {
          return {
            error: 'Failed to update interview',
            updatedInterview: null,
          };
        }
      }),
  }),
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
            createdInterviewId: null,
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

        return {
          error: null,
          createdInterviewId: createdInterview.id,
          errorType: null,
        };
      } catch (error) {
        const e = ensureError(error);
        return {
          errorType: e.message,
          error: 'Failed to create interview',
          createdInterviewId: null,
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
