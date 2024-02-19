/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import {
  participantIdentifierSchema,
  participantListInputSchema,
  updateSchema,
} from '~/shared/schemas/schemas';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createId } from '@paralleldrive/cuid2';

export const participantRouter = router({
  get: router({
    all: publicProcedure.query(async () => {
      const participants = await prisma.participant.findMany({
        include: {
          interviews: true,
          _count: { select: { interviews: true } },
        },
      });
      return participants;
    }),
    byIdentifier: publicProcedure
      .input(participantIdentifierSchema)
      .query(async ({ input: identifier }) => {
        const participant = await prisma.participant.findFirst({
          where: { identifier },
        });
        return participant;
      }),
    byId: publicProcedure.input(z.string()).query(async ({ input: id }) => {
      const participant = await prisma.participant.findFirst({
        where: { id },
      });
      return participant;
    }),
  }),
  create: protectedProcedure
    .input(participantListInputSchema)
    .mutation(async ({ input: participants }) => {
      // Ensure all participants have an identifier by generating one for any
      // that don't have one.
      const participantsWithIdentifiers = participants.map((participant) => {
        return {
          identifier: participant.identifier ?? createId(),
          ...participant,
        };
      });

      try {
        const [existingParticipants, createdParticipants] =
          await prisma.$transaction([
            prisma.participant.findMany({
              where: {
                identifier: {
                  in: participantsWithIdentifiers.map((p) => p.identifier),
                },
              },
            }),
            prisma.participant.createMany({
              data: participantsWithIdentifiers,
              skipDuplicates: true,
            }),
          ]);
        await prisma.events.create({
          data: {
            type: 'Participant(s) Added',
            message: `Added ${createdParticipants.count} participant(s)`,
          },
        });

        revalidateTag('dashboard.getActivities');
        revalidateTag('dashboard.getSummaryStatistics.participantCount');
        revalidateTag('dashboard.getSummaryStatistics.interviewCount');

        revalidateTag('participant.get.all');
        revalidatePath('/dashboard/participants');

        return {
          error: null,
          createdParticipants: createdParticipants.count,
          existingParticipants: existingParticipants,
        };
      } catch (error) {
        return {
          error: 'Failed to create participant',
          createdParticipants: null,
          existingParticipants: null,
        };
      }
    }),
  update: protectedProcedure
    .input(updateSchema)
    .mutation(async ({ input: { identifier, data } }) => {
      try {
        const updatedParticipant = await prisma.participant.update({
          where: { identifier },
          data,
        });
        return { error: null, participant: updatedParticipant };
      } catch (error) {
        return { error: 'Failed to update participant', participant: null };
      }
    }),
  delete: router({
    all: protectedProcedure.mutation(async () => {
      try {
        const deletedParticipants = await prisma.participant.deleteMany();

        await prisma.events.create({
          data: {
            type: 'Participant(s) Removed',
            message: `Removed ${deletedParticipants.count} participant(s)`,
          },
        });

        revalidateTag('dashboard.getActivities');
        revalidateTag('dashboard.getSummaryStatistics.participantCount');
        revalidateTag('dashboard.getSummaryStatistics.interviewCount');

        revalidateTag('participant.get.all');
        revalidatePath('/dashboard/participants');

        return { error: null, deletedParticipants: deletedParticipants.count };
      } catch (error) {
        return {
          error: 'Failed to delete participants',
          deletedParticipants: null,
        };
      }
    }),
    byId: protectedProcedure
      .input(z.array(participantIdentifierSchema))
      .mutation(async ({ input: identifiers }) => {
        try {
          const deletedParticipants = await prisma.participant.deleteMany({
            where: { identifier: { in: identifiers } },
          });

          await prisma.events.create({
            data: {
              type: 'Participant(s) Removed',
              message: `Removed ${deletedParticipants.count} participant(s)`,
            },
          });

          revalidateTag('dashboard.getActivities');
          revalidateTag('dashboard.getSummaryStatistics.participantCount');
          revalidateTag('participant.get.all');
          revalidatePath('/dashboard/participants');

          return {
            error: null,
            deletedParticipants: deletedParticipants.count,
          };
        } catch (error) {
          return {
            error: 'Failed to delete participants',
            deletedParticipants: null,
          };
        }
      }),
  }),
});
