/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '~/server/trpc';
import { z } from 'zod';
import { hash } from 'ohash';
import { Prisma } from '@prisma/client';
import { utapi } from '~/app/api/uploadthing/core';
import type { Protocol } from '@codaco/shared-consts';

export const assetInsertSchema = z.array(
  z.object({
    key: z.string(),
    assetId: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
    size: z.number(),
  }),
);

// When deleting protocols we must first delete the assets associated with them
// from the cloud storage.
export const deleteProtocols = async (hashes: string[]) => {
  // We put asset deletion in a separate try/catch because if it fails, we still
  // want to delete the protocol.
  try {
    // eslint-disable-next-line no-console
    console.log('deleting protocol assets...');
    const protocolIds = await prisma.protocol.findMany({
      where: { hash: { in: hashes } },
      select: { id: true },
    });

    const assets = await prisma.asset.findMany({
      where: { protocolId: { in: protocolIds.map((p) => p.id) } },
      select: { key: true },
    });

    await deleteFilesFromUploadThing(assets.map((a) => a.key));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error deleting protocol assets!', error);
  }

  try {
    const deletedProtocols = await prisma.protocol.deleteMany({
      where: { hash: { in: hashes } },
    });
    return { error: null, deletedProtocols: deletedProtocols };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('delete protocols error: ', error);
    return {
      error: 'Failed to delete protocols',
      deletedProtocols: null,
    };
  }
};

export const deleteFilesFromUploadThing = async (
  fileKey: string | string[],
) => {
  if (fileKey.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No assets to delete');
    return;
  }

  const response = await utapi.deleteFiles(fileKey);

  if (!response.success) {
    throw new Error('Failed to delete files from uploadthing');
  }

  return;
};

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
      .mutation(async ({ input: hash }) => {
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
  active: router({
    get: protectedProcedure.query(async () => {
      const protocol = await prisma.protocol.findFirst({
        where: {
          active: true,
        },
      });
      return protocol?.id ?? null;
    }),
    is: protectedProcedure
      .input(z.string())
      .mutation(async ({ input: protocolId }) => {
        const protocol = await prisma.protocol.findFirst({
          where: {
            id: protocolId,
          },
        });

        return protocol?.active ?? false;
      }),
    set: protectedProcedure
      .input(z.string())
      .mutation(async ({ input: protocolId }) => {
        try {
          await prisma.$transaction([
            prisma.protocol.updateMany({
              where: {
                active: true,
              },
              data: {
                active: false,
              },
            }),
            prisma.protocol.update({
              where: {
                id: protocolId,
              },
              data: {
                active: true,
              },
            }),
          ]);

          return { error: null, success: true };
        } catch (error) {
          return { error: 'Failed to set active protocol', success: false };
        }
      }),
  }),
  delete: router({
    all: protectedProcedure.mutation(async () => {
      const hashes = await prisma.protocol.findMany({
        select: {
          hash: true,
        },
      });
      return deleteProtocols(hashes.map((protocol) => protocol.hash));
    }),
    byHash: protectedProcedure
      .input(z.array(z.string()))
      .mutation(async ({ input: hashes }) => {
        return deleteProtocols(hashes);
      }),
  }),
  insert: protectedProcedure
    .input((value) => {
      return z
        .object({
          protocol: z.unknown(), // TODO: replace this with zod schema version of Protocol type
          protocolName: z.string(),
          assets: assetInsertSchema,
        })
        .passthrough()
        .parse(value);
    })
    .mutation(async ({ input }) => {
      const { protocol: inputProtocol, protocolName, assets } = input;

      const protocol = inputProtocol as Protocol;

      try {
        const protocolHash = hash(protocol);

        // eslint-disable-next-line local-rules/require-data-mapper
        await prisma.protocol.create({
          data: {
            hash: protocolHash,
            lastModified: protocol.lastModified,
            name: protocolName,
            schemaVersion: protocol.schemaVersion,
            stages: protocol.stages as unknown as Prisma.JsonArray, // The Stage interface needs to be changed to be a type: https://www.totaltypescript.com/type-vs-interface-which-should-you-use#index-signatures-in-types-vs-interfaces
            codebook: protocol.codebook,
            description: protocol.description,
            assets: {
              create: assets,
            },
          },
        });

        return { error: null, success: true };
      } catch (e) {
        // Attempt to delete any assets we uploaded to storage
        if (assets.length > 0) {
          await deleteFilesFromUploadThing(assets.map((a) => a.key));
        }
        // Check for protocol already existing
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === 'P2002') {
            return {
              error:
                'The protocol you attempted to add already exists in the database. Please remove it and try again.',
              success: false,
              errorDetails: e,
            };
          }

          return {
            error:
              'There was an error adding your protocol to the database. See the error details for more information.',
            success: false,
            errorDetails: e,
          };
        }

        throw e;
      }
    }),
});
