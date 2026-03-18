'use server';

import { Effect } from 'effect';
import { ExportLayer } from '~/lib/export/layers/ExportLayer';
import { FileStorage } from '~/lib/export/services/FileStorage';
import { requireApiAuth } from '~/utils/auth';

export const deleteZipFromUploadThing = async (key: string) => {
  await requireApiAuth();

  await Effect.gen(function* () {
    const fileStorage = yield* FileStorage;
    yield* fileStorage.delete(key);
  }).pipe(Effect.provide(ExportLayer), Effect.runPromise);
};
