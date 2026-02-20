'use server';

import { revalidatePath } from 'next/cache';
import { env } from 'process';
import { CacheTags, safeRevalidateTag } from '~/lib/cache';
import { resetDatabase } from '~/lib/db/resetDatabase';
import { getUTApi } from '~/lib/uploadthing/server-helpers';
import { requireApiAuth } from '~/utils/auth';

export const resetAppSettings = async () => {
  if (env.NODE_ENV !== 'development') {
    await requireApiAuth();
  }

  try {
    await resetDatabase();

    revalidatePath('/');
    safeRevalidateTag(CacheTags);

    const utapi = await getUTApi();

    // Remove all files from UploadThing:
    await utapi.listFiles({}).then(({ files }) => {
      const keys = files.map((file) => file.key);
      return utapi.deleteFiles(keys);
    });

    return { error: null, appSettings: null };
  } catch (error) {
    return { error: 'Failed to reset appSettings', appSettings: null };
  }
};
