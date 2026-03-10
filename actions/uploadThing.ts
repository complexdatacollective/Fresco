'use server';

import { File } from 'node:buffer';
import { readFile, realpath, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import type {
  ArchiveResult,
  ExportReturn,
} from '~/lib/network-exporters/utils/types';
import { getUTApi } from '~/lib/uploadthing/server-helpers';
import { requireApiAuth } from '~/utils/auth';
import { ensureError } from '~/utils/ensureError';

export const deleteZipFromUploadThing = async (key: string) => {
  await requireApiAuth();

  const utapi = await getUTApi();

  const deleteResponse = await utapi.deleteFiles(key);

  if (!deleteResponse.success) {
    throw new Error('Failed to delete the zip file from UploadThing');
  }
};

export const uploadZipToUploadThing = async (
  results: ArchiveResult,
): Promise<ExportReturn> => {
  const { path: zipLocation, completed, rejected } = results;

  try {
    const resolvedPath = await realpath(resolve(zipLocation));
    const tempDir = await realpath(tmpdir());
    if (!resolvedPath.startsWith(tempDir + '/')) {
      return { status: 'error', error: 'Invalid file path' };
    }

    const fileName =
      resolvedPath.split('/').pop()?.split('.').shift() ?? 'file';
    const zipBuffer = await readFile(resolvedPath);
    const zipFile = new File([zipBuffer], `${fileName}.zip`, {
      type: 'application/zip',
    });

    const utapi = await getUTApi();

    const { data, error } = await utapi.uploadFiles(zipFile);

    if (data) {
      void unlink(resolvedPath); // Delete the zip file after successful upload
      return {
        zipUrl: data.ufsUrl,
        zipKey: data.key,
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
