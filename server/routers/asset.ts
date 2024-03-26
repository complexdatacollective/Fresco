/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '~/server/trpc';
import { z } from 'zod';

export const assetRouter = router({
  get: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input: assetIds }) => {
      const assets = await prisma.asset.findMany({
        where: {
          assetId: {
            in: assetIds,
          },
        },
      });
      const existingAssets = assets.map((asset) => asset.assetId);
      // Return the assetIds that are not in the database
      return assetIds.filter((assetId) => !existingAssets.includes(assetId));
    }),
});
