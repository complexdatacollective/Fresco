/* eslint-disable local-rules/require-data-mapper */
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '~/server/trpc';
import { NcNetworkZod } from '~/shared/schemas/network-canvas';
import { prisma } from '~/utils/db';
import { ensureError } from '~/utils/ensureError';
import { revalidateTag } from 'next/cache';
import { faker } from '@faker-js/faker';
import { trackEvent } from '~/analytics/utils';

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
        protocolId: z.string(),
      }),
    )
    .mutation(async ({ input: { participantId, protocolId } }) => {
      if (!participantId) {
        // Check if anonymous recruitment is enabled, and if it is use it to
        // generate a participant identifier.
        const appSettings = await prisma.appSettings.findFirst();
        if (!appSettings || !appSettings.allowAnonymousRecruitment) {
          return {
            errorType: 'no-anonymous-recruitment',
            error: 'Anonymous recruitment is not enabled',
            createdInterviewId: null,
          };
        }

        // anonymous recruitment is enabled, so generate a participant
        const participantIdentifier = faker.string.uuid();
        const { id } = await prisma.participant.create({
          data: {
            identifier: participantIdentifier,
          },
        });

        participantId = id;
      }

      try {
        const createdInterview = await prisma.interview.create({
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

        void trackEvent({
          type: 'Error',
          error: {
            message: e.name,
            details: e.message,
            path: '/routers/interview.ts',
            stacktrace: e.stack ?? '',
          },
        });

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
    forExport: protectedProcedure
      .input(z.array(z.string()))
      .query(async ({ input: interviewIds }) => {
        const interviews = await prisma.interview.findMany({
          where: {
            id: {
              in: interviewIds,
            },
          },
          include: {
            protocol: true,
          },
        });
        return interviews;
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
  updateExportTime: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input: interviewIds }) => {
      try {
        const updatedInterviews = await prisma.interview.updateMany({
          where: {
            id: {
              in: interviewIds,
            },
          },
          data: {
            exportTime: new Date(),
          },
        });

        return { error: null, interviews: updatedInterviews };
      } catch (error) {
        return { error: 'Failed to update interviews', interviews: null };
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
