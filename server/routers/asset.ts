/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '~/server/trpc';
import { z } from 'zod';

export const assetRouter = router({
  get: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: assetId }) => {
      const asset = await prisma.asset.findFirst({
        where: {
          assetId,
        },
      });
      return asset;
    }),
});
