/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '~/server/trpc';
import { z } from 'zod';

const updateActiveProtocolSchema = z.object({
  input: z.boolean(),
  hash: z.string().optional(),
});

export const protocolRouter = router({
  get: router({
    all: protectedProcedure.query(async () => {
      const protocols = await prisma.protocol.findMany();

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
      // if hash is undefined, this is being called from protocol uploader
      // if setActive is also false then do nothing

      if (!hash && !input) {
        return;
      }

      const currentActive = await prisma.protocol.findFirst({
        where: {
          active: true,
        },
      });

      // update the most recently uploaded protocol to be active
      if (!hash && input) {
        const recentlyUploaded = await prisma.protocol.findFirst({
          orderBy: {
            importedAt: 'desc',
          },
        });

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

        // make the most recent protocol active
        await prisma.protocol.update({
          where: {
            hash: recentlyUploaded?.hash,
          },
          data: {
            active: true,
          },
        });
        return;
      }

      // everything below this point is for when hash is defined

      // if input is false, deactivate the active protocol
      if (!input && hash) {
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

      // setActive is true and hash is defined

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
