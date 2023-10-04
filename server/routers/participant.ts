/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import {
  participantIdentifierSchema,
  participantListInputSchema,
  updateSchema,
} from '~/shared/schemas';

export const participantRouter = router({
  get: router({
    all: publicProcedure.query(async () => {
      const participants = await prisma.participant.findMany();
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

        return { error: null, createdParticipants, existingParticipants };
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
        return { error: null, deletedParticipants };
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
          return { error: null, deletedParticipants: deletedParticipants };
        } catch (error) {
          return {
            error: 'Failed to delete participants',
            deletedParticipants: null,
          };
        }
      }),
  }),
});
