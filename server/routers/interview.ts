/* eslint-disable local-rules/require-data-mapper */
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '~/server/trpc';
import { NcNetworkZod } from '~/shared/schemas/network-canvas';
import { prisma } from '~/utils/db';
import { ensureError } from '~/utils/ensureError';
import { revalidatePath, revalidateTag } from 'next/cache';
import { trackEvent } from '~/analytics/utils';
import { createId } from '@paralleldrive/cuid2';

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

        revalidateTag('interview.get.all');
        revalidatePath('/dashboard/interviews');

        return { success: true };
      } catch (error) {
        const message = ensureError(error).message;
        return { success: false, error: message };
      }
    }),
  create: publicProcedure
    .input(
      z.object({
        participantIdentifier: z.string().optional(),
        protocolId: z.string(),
      }),
    )
    .mutation(async ({ input: { participantIdentifier, protocolId } }) => {
      /**
       * If no participant identifier is provided, we check if anonymous recruitment is enabled.
       * If it is, we create a new participant and use that identifier.
       */
      const participantStatement = participantIdentifier
        ? {
            connect: {
              identifier: participantIdentifier,
            },
          }
        : {
            create: {
              identifier: `p-${createId()}`,
              label: 'Anonymous Participant',
            },
          };

      try {
        if (!participantIdentifier) {
          const appSettings = await prisma.appSettings.findFirst();
          if (!appSettings || !appSettings.allowAnonymousRecruitment) {
            return {
              errorType: 'no-anonymous-recruitment',
              error: 'Anonymous recruitment is not enabled',
              createdInterviewId: null,
            };
          }
        }

        const createdInterview = await prisma.interview.create({
          select: {
            participant: true,
            id: true,
          },
          data: {
            network: Prisma.JsonNull,
            participant: participantStatement,
            protocol: {
              connect: {
                id: protocolId,
              },
            },
          },
        });

        await prisma.events.create({
          data: {
            type: 'Interview started',
            message: `Participant "${
              createdInterview.participant.label ??
              createdInterview.participant.identifier
            }" started an interview`,
          },
        });

        revalidateTag('interview.get.all');
        revalidatePath('/dashboard/interviews');

        // Because a new participant may have been created as part of creating the interview,
        // we need to also revalidate the participant cache.
        revalidateTag('participant.get.all');
        revalidateTag('participant.get.byId');

        revalidateTag('dashboard.getActivities');
        revalidateTag('dashboard.getSummaryStatistics.interviewCount');
        revalidateTag('dashboard.getSummaryStatistics.participantCount');

        return {
          error: null,
          createdInterviewId: createdInterview.id,
          errorType: null,
        };
      } catch (error) {
        const e = ensureError(error);

        void trackEvent({
          type: 'Error',
          name: e.name,
          message: e.message,
          stack: e.stack,
          metadata: {
            path: '/routers/interview.ts',
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
  finish: publicProcedure
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
          select: {
            participant: true,
            network: true,
          },
          data: {
            finishTime: new Date(),
          },
        });

        await prisma.events.create({
          data: {
            type: 'Interview completed',
            message: `Participant "${updatedInterview.participant.identifier}" completed an interview`,
          },
        });

        void trackEvent({
          type: 'InterviewCompleted',
          metadata: {
            nodeCount: updatedInterview.network?.nodes.length ?? 0,
            edgeCount: updatedInterview.network?.edges.length ?? 0,
          },
        });

        revalidateTag('interview.get.all');
        revalidateTag('dashboard.getActivities');
        revalidatePath('/dashboard/interviews');

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

        await prisma.events.create({
          data: {
            type: 'Data Exported',
            message: `Exported data for ${updatedInterviews.count} participant(s)`,
          },
        });

        revalidateTag('dashboard.getActivities');

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

        await prisma.events.create({
          data: {
            type: 'Interview Deleted',
            message: `Deleted ${deletedInterviews.count} interview(s)`,
          },
        });

        revalidateTag('dashboard.getActivities');
        revalidateTag('dashboard.getSummaryStatistics.interviewCount');
        revalidateTag('interview.get.all');

        return { error: null, interview: deletedInterviews };
      } catch (error) {
        return { error: 'Failed to delete interviews', interview: null };
      }
    }),
});
