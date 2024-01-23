/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { publicProcedure, protectedProcedure, router } from '~/server/trpc';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { NcNetworkZod } from '~/shared/schemas/network-canvas';
import { ensureError } from '~/utils/ensureError';
import { revalidateTag } from 'next/cache';

export const interviewRouter = router({
  sync: publicProcedure
    .input(
      z.object({
        id: z.string(),
        network: NcNetworkZod,
        currentStep: z.number(),
      }),
    )
    .mutation(async ({ input: { id, network, currentStep } }) => {
      try {
        await prisma.interview.update({
          where: {
            id,
          },
          data: {
            network,
            currentStep,
            lastUpdated: new Date(),
          },
        });
        return { success: true };
      } catch (error) {
        const message = ensureError(error).message;
        return { success: false, error: message };
      }
    }),
  create: publicProcedure
    .input(
      z.object({
        participantId: z.string().optional(),
        participantIdentifier: z.string().optional(),
        protocolId: z.string(),
      }),
    )
    .mutation(
      async ({
        input: { participantId, participantIdentifier, protocolId },
      }) => {
        if (!participantId && !participantIdentifier) {
          return {
            error:
              'One of participant ID or participant identifier must be provided!',
            createdInterviewId: null,
            errorType: null,
          };
        }

        try {
          let createdInterview;
          // If we are given a participant Id, link to it.
          if (participantId) {
            createdInterview = await prisma.interview.create({
              data: {
                startTime: new Date(),
                lastUpdated: new Date(),
                network: Prisma.JsonNull,
                participant: {
                  connect: {
                    id: participantId,
                  },
                },
                protocol: {
                  connect: {
                    id: protocolId,
                  },
                },
              },
            });
          }

          if (participantIdentifier) {
            // If we are given a participant identifier, create a new participant and link to it.
            createdInterview = await prisma.interview.create({
              data: {
                startTime: new Date(),
                lastUpdated: new Date(),
                network: Prisma.JsonNull,
                participant: {
                  connectOrCreate: {
                    where: {
                      identifier: participantIdentifier,
                    },
                    create: {
                      identifier: participantIdentifier,
                    },
                  },
                },
                protocol: {
                  connect: {
                    id: protocolId,
                  },
                },
              },
            });
          }

          revalidateTag('interview.get.all');

          // Because a new participant may have been created as part of creating the interview,
          // we need to also revalidate the participant cache.
          revalidateTag('participant.get.all');

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
      },
    ),
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
  finish: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input: { id } }) => {
      try {
        const updatedInterview = await prisma.interview.update({
          where: {
            id,
          },
          data: {
            finishTime: new Date(),
          },
        });

        return { error: null, interview: updatedInterview };
      } catch (error) {
        return { error: 'Failed to update interview', interview: null };
      }
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
