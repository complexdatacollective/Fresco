'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { env } from 'process';
import { CacheTags, safeUpdateTag } from '~/lib/cache';
import { resetDatabase } from '~/lib/db/resetDatabase';
import { getUTApi } from '~/lib/uploadthing/server-helpers';
import { requireApiAuth } from '~/utils/auth';

export const resetAppSettings = async (): Promise<void> => {
  if (env.NODE_ENV !== 'development') {
    await requireApiAuth();
  }

  try {
    await resetDatabase();

    revalidatePath('/');
    safeUpdateTag(CacheTags);

    const utapi = await getUTApi();

    // Remove all files from UploadThing:
    await utapi.listFiles({}).then(({ files }) => {
      const keys = files.map((file) => file.key);
      return utapi.deleteFiles(keys);
    });
  } finally {
    redirect('/setup');
  }
};
