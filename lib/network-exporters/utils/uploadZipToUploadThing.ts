import { File } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { utapi } from '~/app/api/uploadthing/core';

export const uploadZipToUploadThing = async (zipLocation: string) => {
  try {
    const fileName = zipLocation.split('/').pop()?.split('.').shift() ?? 'file';
    const zipBuffer = readFileSync(zipLocation);
    const zipFile = new File([zipBuffer], `${fileName}.zip`, {
      type: 'application/zip',
    });

    const { data, error } = await utapi.uploadFiles(zipFile);

    if (data) {
      await unlink(zipLocation); // Delete the zip file after successful upload
      return {
        data,
        error,
        message: 'Zip file uploaded to UploadThing successfully!',
      };
    }

    return {
      data,
      error,
      message: 'Failed to upload zip file to UploadThing!',
    };
  } catch (error) {
    return {
      data: null,
      error,
      message: 'Failed to upload zip file to UploadThing!',
    };
  }
};
