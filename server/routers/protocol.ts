/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '~/server/trpc';
import { z } from 'zod';
import { hash } from 'ohash';
import { Prisma } from '@prisma/client';
import { utapi } from '~/app/api/uploadthing/core';
import type { Protocol } from '@codaco/shared-consts';
import { revalidatePath, revalidateTag } from 'next/cache';

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
  const protocolsToBeDeleted = await prisma.protocol.findMany({
    where: { hash: { in: hashes } },
    select: { id: true, name: true },
  });

  // Select assets that are ONLY associated with the protocols to be deleted
  const assetKeysToDelete = await prisma.asset.findMany({
    where: {
      protocols: {
        every: {
          id: {
            in: protocolsToBeDeleted.map((p) => p.id),
          },
        },
      },
    },
    select: { key: true },
  });

  // We put asset deletion in a separate try/catch because if it fails, we still
  // want to delete the protocol.
  try {
    // eslint-disable-next-line no-console
    console.log('deleting protocol assets...');

    await deleteFilesFromUploadThing(assetKeysToDelete.map((a) => a.key));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error deleting protocol assets!', error);
  }

  // Delete assets in assetKeysToDelete from the database

  try {
    // eslint-disable-next-line no-console
    console.log('deleting assets from database...');
    await prisma.asset.deleteMany({
      where: {
        key: {
          in: assetKeysToDelete.map((a) => a.key),
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error deleting assets from database!', error);
  }

  try {
    const deletedProtocols = await prisma.protocol.deleteMany({
      where: { hash: { in: hashes } },
    });

    // insert an event for each protocol deleted
    // eslint-disable-next-line no-console
    console.log('inserting events for deleted protocols...');
    const events = protocolsToBeDeleted.map((p) => {
      return {
        type: 'Protocol Uninstalled',
        message: `Protocol "${p.name}" uninstalled`,
      };
    });

    await prisma.events.createMany({
      data: events,
    });

    revalidateTag('dashboard.getActivities');
    revalidateTag('protocol.get.all');
    revalidatePath('/dashboard/protocols');
    revalidateTag('dashboard.getSummaryStatistics.protocolCount');
    revalidateTag('dashboard.getSummaryStatistics.interviewCount');

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
          newAssets: assetInsertSchema,
          existingAssetIds: z.array(z.string()),
        })
        .passthrough()
        .parse(value);
    })
    .mutation(async ({ input }) => {
      const {
        protocol: inputProtocol,
        protocolName,
        newAssets,
        existingAssetIds,
      } = input;

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
              create: newAssets,
              connect: existingAssetIds.map((assetId) => ({ assetId })),
            },
          },
        });

        await prisma.events.create({
          data: {
            type: 'Protocol Installed',
            message: `Protocol "${protocolName}" installed`,
          },
        });

        revalidateTag('dashboard.getActivities');
        revalidateTag('protocol.get.all');
        revalidateTag('dashboard.getSummaryStatistics.protocolCount');
        revalidatePath('/dashboard/protocols');

        return { error: null, success: true };
      } catch (e) {
        // Attempt to delete any assets we uploaded to storage
        if (newAssets.length > 0) {
          await deleteFilesFromUploadThing(newAssets.map((a) => a.key));
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
