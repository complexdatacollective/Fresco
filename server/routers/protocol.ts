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
      try {
        const protocols = await prisma.protocol.findMany({
          include: { interviews: true },
        });
        return protocols;
      } catch (error) {
        return { error: 'Failed to fetch all protocols', protocols: null };
      }
    }),

    byHash: protectedProcedure
      .input(z.string())
      .query(async ({ input: hash }) => {
        try {
          const protocol = await prisma.protocol.findFirst({
            where: {
              hash,
            },
          });
          return protocol;
        } catch (error) {
          return { error: 'Failed to fetch protocol by hash', protocol: null };
        }
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

  getCurrentlyActive: protectedProcedure.query(async () => {
    const protocol = await prisma.protocol.findFirst({
      where: {
        active: true,
      },
    });
    return protocol;
  }),

  setActive: protectedProcedure
    .input(updateActiveProtocolSchema)
    .mutation(async ({ input: { input, hash } }) => {
      try {
        const currentActive = await prisma.protocol.findFirst({
          where: {
            active: true,
          },
        });

        // If input is false, deactivate the active protocol
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
          return { error: null, success: true };
        }

        // Deactivate the current active protocol, if it exists
        if (currentActive) {
          await prisma.protocol.update({
            where: {
              id: currentActive.id,
            },
            data: {
              active: false,
            },
          });
        }

        // Make the protocol with the given hash active
        await prisma.protocol.update({
          where: {
            hash,
          },
          data: {
            active: true,
          },
        });

        return { error: null, success: true };
      } catch (error) {
        return { error: 'Failed to set active protocol', success: false };
      }
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
