/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import {
  participantIdentifierSchema,
  participantListInputSchema,
  updateSchema,
} from '~/shared/schemas';
import { z } from 'zod';

export const participantRouter = router({
  get: router({
    all: publicProcedure.query(async () => {
      const participants = await prisma.participant.findMany({
        include: { interviews: true },
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
      console.log('id', id);
      const participant = await prisma.participant.findFirst({
        where: { id },
      });
      return participant;
    }),
  }),
  create: protectedProcedure
    .input(participantListInputSchema)
    .mutation(async ({ input: identifiers }) => {
      try {
        const existingParticipants = await prisma.participant.findMany({
          where: { identifier: { in: identifiers } },
        });

        const createdParticipants = await prisma.participant.createMany({
          data: identifiers.map((identifier) => ({ identifier })),
          skipDuplicates: true,
        });

        return {
          error: null,
          createdParticipants: createdParticipants.count,
          existingParticipants: existingParticipants.length,
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
    .mutation(async ({ input: { identifier, newIdentifier } }) => {
      try {
        const updatedParticipant = await prisma.participant.update({
          where: { identifier },
          data: {
            identifier: newIdentifier,
          },
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
        return { error: null, deletedParticipants: deletedParticipants.count };
      } catch (error) {
        return {
          error: 'Failed to delete participants',
          deletedParticipants: null,
        };
      }
    }),
    byId: protectedProcedure
      .input(participantListInputSchema)
      .mutation(async ({ input: identifiers }) => {
        try {
          const deletedParticipants = await prisma.participant.deleteMany({
            where: { identifier: { in: identifiers } },
          });
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
