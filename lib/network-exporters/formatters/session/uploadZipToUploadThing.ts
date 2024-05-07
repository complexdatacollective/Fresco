import { File } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { utapi } from '~/app/api/uploadthing/core';
import type archive from '../../utils/archive';
import { ensureError } from '~/utils/ensureError';

export const uploadZipToUploadThing = async (
  results: ReturnType<typeof archive>,
) => {
  const { path: zipLocation, completed, rejected } = await results;

  try {
    const fileName = zipLocation.split('/').pop()?.split('.').shift() ?? 'file';
    const zipBuffer = readFileSync(zipLocation);
    const zipFile = new File([zipBuffer], `${fileName}.zip`, {
      type: 'application/zip',
    });

    const { data, error } = await utapi.uploadFiles(zipFile);

    if (data) {
      void unlink(zipLocation); // Delete the zip file after successful upload
      return {
        status: rejected.length ? 'partial' : 'success',
        error: rejected.length ? 'Some exports failed' : null,
        failedExports: rejected,
        successfulExports: completed,
      };
    }

    return {
      status: 'error',
      error: error.message,
    };
  } catch (error) {
    const e = ensureError(error);
    return {
      status: 'error',
      error: e.message,
    };
  }
};
