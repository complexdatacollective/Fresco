'use server';

import { Effect } from 'effect';
import { getStorageLayer } from '~/lib/storage/layers/StorageLayer';
import { FileStorage } from '~/lib/storage/services/FileStorage';
import { requireApiAuth } from '~/utils/auth';

export const deleteZipFromStorage = async (key: string) => {
  await requireApiAuth();

  const storageLayer = await getStorageLayer();

  await Effect.gen(function* () {
    const fileStorage = yield* FileStorage;
    yield* fileStorage.delete(key);
  }).pipe(Effect.provide(storageLayer), Effect.runPromise);
};
