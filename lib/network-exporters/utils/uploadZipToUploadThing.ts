import { File } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { utapi } from '~/app/api/uploadthing/core';

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

    if (data) {
      return { data, error, message: 'Zip file uploaded successfully!' };
    }

    return { data, error, message: 'Failed to upload zip file!' };
  } catch (error) {
    return { data: null, error, message: 'Failed to upload zip file!' };
  }
};
