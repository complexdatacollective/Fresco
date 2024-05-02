import { File } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { utapi } from '~/app/api/uploadthing/core';
import { ensureError } from '~/utils/ensureError';

export const uploadZipToUploadThing = async (
  zipLocation: string,
  fileName: string,
) => {
  try {
    const zipBuffer = readFileSync(zipLocation);
    const zipFile = new File([zipBuffer], `${fileName}.zip`, {
      type: 'application/zip',
    });

    const { data, error } = await utapi.uploadFiles(zipFile);

    if (error) {
      return {
        data,
        error: error.message,
      };
    }

    await unlink(zipLocation); // Delete the zip file after successful upload
    return {
      data,
      error: null,
    };
  } catch (error) {
    const e = ensureError(error);
    return {
      data: null,
      error: e.message,
    };
  }
};
