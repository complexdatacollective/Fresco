/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '~/server/trpc';
import { z } from 'zod';

const updateActiveProtocolSchema = z.object({
  input: z.boolean(),
  hash: z.string(),
});

export const protocolRouter = router({
  get: router({
    all: protectedProcedure.query(async () => {
      const protocols = await prisma.protocol.findMany({
        include: { interviews: true },
      });

      return protocols;
    }),
    byHash: protectedProcedure
      .input(z.string())
      .query(async ({ input: hash }) => {
        const protocol = await prisma.protocol.findFirst({
          where: {
            hash,
          },
        });

        return protocol;
      }),
    lastUploaded: protectedProcedure.query(async () => {
      const protocol = await prisma.protocol.findFirst({
        orderBy: {
          importedAt: 'desc',
        },
      });

      return protocol;
    }),
  }),
  getActive: protectedProcedure
    .input(z.string())
    .query(async ({ input: hash }) => {
      const protocol = await prisma.protocol.findFirst({
        where: {
          hash,
        },
        select: {
          active: true,
        },
      });

      return protocol?.active || false;
    }),
  setActive: protectedProcedure
    .input(updateActiveProtocolSchema)
    .mutation(async ({ input: { input, hash } }) => {
      const currentActive = await prisma.protocol.findFirst({
        where: {
          active: true,
        },
      });

      // if input is false, deactivate the active protocol
      if (!input) {
        await prisma.protocol.update({
          where: {
            hash: hash,
            active: true,
          },
          data: {
            active: false,
          },
        });
        return;
      }

      // deactivate the current active protocol, if it exists
      if (currentActive) {
        await prisma.protocol.update({
          where: {
            id: currentActive?.id,
          },
          data: {
            active: false,
          },
        });
      }
      // make the protocol with the given hash active
      await prisma.protocol.update({
        where: {
          hash,
        },
        data: {
          active: true,
        },
      });
    }),
  delete: router({
    all: protectedProcedure.mutation(async () => {
      try {
        const deletedProtocols = await prisma.protocol.deleteMany();
        return { error: null, deletedProtocols };
      } catch (error) {
        return {
          error: 'Failed to delete protocols',
          deletedProtocols: null,
        };
      }
    }),
    byHash: protectedProcedure
      .input(z.array(z.string()))
      .mutation(async ({ input: hashes }) => {
        try {
          const deletedProtocols = await prisma.protocol.deleteMany({
            where: { hash: { in: hashes } },
          });
          return { error: null, deletedProtocols: deletedProtocols };
        } catch (error) {
          return {
            error: 'Failed to delete protocols',
            deletedProtocols: null,
          };
        }
      }),
  }),
});
