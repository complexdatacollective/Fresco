/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '../trpc';
import { z } from 'zod';

const updateActive = z.object({
  setActive: z.boolean(),
});

export const protocolRouter = router({
  setActive: protectedProcedure
    .input(updateActive)
    .mutation(async ({ input: { setActive } }) => {
      if (!setActive) {
        return;
      }

      const currentActive = await prisma.protocol.findFirst({
        where: {
          active: true,
        },
      });

      // deactivate the current active protocol
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

      // find the most recently imported protocol
      const recentlyUploaded = await prisma.protocol.findFirst({
        orderBy: {
          importedAt: 'desc',
        },
      });

      // make the selected protocol active
      await prisma.protocol.update({
        where: {
          hash: recentlyUploaded?.hash,
        },
        data: {
          active: true,
        },
      });
    }),
});
