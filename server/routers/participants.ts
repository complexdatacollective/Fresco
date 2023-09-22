/* eslint-disable local-rules/require-data-mapper */
import { z } from 'zod';
import { prisma } from '~/utils/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';

const createSchema = z.object({
  identifier: z.string(),
});

const updateSchema = z.object({
  identifier: z.string(),
  newIdentifier: z.string(),
});

const deleteSingleSchema = z.object({
  id: z.string(),
});

const deleteManySchema = z.array(
  z.object({
    id: z.string(),
    identifier: z.string(),
  }),
);

const createManySchema = z.array(
  z.object({
    identifier: z.string(),
  }),
);

export const participantsRouter = router({
  get: publicProcedure.query(async () => {
    const participants = await prisma.participant.findMany();
    return participants;
  }),
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ input: { identifier } }) => {
      try {
        // check if participant already exist
        const existingParticipant = await prisma.participant.findFirst({
          where: { identifier },
        });

        if (existingParticipant)
          return { error: 'Participant already exists', participant: null };

        // create new participant
        const newParticipant = await prisma.participant.create({
          data: { identifier },
        });
        return { error: null, participant: newParticipant };
      } catch (error) {
        return { error: 'Failed to create participant', participant: null };
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
  deleteSingle: protectedProcedure
    .input(deleteSingleSchema)
    .mutation(async ({ input: { id } }) => {
      try {
        const deletedParticipant = await prisma.participant.delete({
          where: { id },
        });
        return { error: null, participant: deletedParticipant };
      } catch (error) {
        return { error: 'Failed to delete participant', participant: null };
      }
    }),
  deleteMany: protectedProcedure
    .input(deleteManySchema)
    .mutation(async ({ input: data }) => {
      const idsToDelete = data.map((p) => p.id);

      try {
        const deletedParticipants = await prisma.participant.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });
        return { error: null, participant: deletedParticipants };
      } catch (error) {
        return { error: 'Failed to delete participants', participant: null };
      }
    }),
  createMany: protectedProcedure
    .input(createManySchema)
    .mutation(async ({ input: data }) => {
      try {
        const existingParticipants = await prisma.participant.findMany({
          where: {
            identifier: {
              in: data.map((p) => p.identifier),
            },
          },
        });

        const createdParticipants = await prisma.participant.createMany({
          data,
          skipDuplicates: true,
        });

        if (!(existingParticipants && createdParticipants)) {
          return { error: 'Failed to import participants', data: null };
        }

        return {
          error: null,
          data: { existingParticipants, createdParticipants },
        };
      } catch (error) {
        return { error: 'Failed to import participants', data: null };
      }
    }),
});
