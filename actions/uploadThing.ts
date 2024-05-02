'use server';

import { utapi } from '~/app/api/uploadthing/core';
import { requireApiAuth } from '~/utils/auth';
import { File } from 'node:buffer';
import { unlink, readFile } from 'node:fs/promises';
import { ensureError } from '~/utils/ensureError';

export const deleteZipFromUploadThing = async (key: string) => {
  await requireApiAuth();

  const deleteResponse = await utapi.deleteFiles(key);

  if (!deleteResponse.success) {
    throw new Error('Failed to delete the zip file from UploadThing');
  }
};

export const uploadZipToUploadThing = async (
  zipLocation: string,
  fileName: string,
) => {
  try {
    const zipBuffer = await readFile(zipLocation);
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
