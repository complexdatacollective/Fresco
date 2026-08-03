'use server';

import { Effect } from 'effect';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { env } from 'process';
import { requireApiAuth } from '~/lib/auth/guards';
import { CacheTags, safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { resetDatabase } from '~/lib/db/resetDatabase';
import { getStorageLayer } from '~/lib/storage/layers/StorageLayer';
import { AssetStorage } from '~/lib/storage/services/AssetStorage';

export const resetAppSettings = async (): Promise<void> => {
  if (env.NODE_ENV !== 'development') {
    await requireApiAuth();
  }

  try {
    const allAssets = await prisma.asset.findMany({
      select: { key: true },
    });
    const assetKeys = allAssets.map((a) => a.key);

    if (assetKeys.length > 0) {
      try {
        const storageLayer = await getStorageLayer();
        await Effect.gen(function* () {
          const assetStorage = yield* AssetStorage;
          yield* assetStorage.deleteAssets(assetKeys);
        }).pipe(Effect.provide(storageLayer), Effect.runPromise);
      } catch {
        // eslint-disable-next-line no-console
        console.log('Could not delete storage files during reset');
      }
    }

    await resetDatabase();

    revalidatePath('/');
    safeUpdateTag(CacheTags);
  } finally {
    redirect('/setup');
  }
};
