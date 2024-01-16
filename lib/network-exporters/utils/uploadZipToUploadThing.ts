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

    const { data } = await utapi.uploadFiles(zipFile);
    return { data, message: 'Zip file uploaded successfully!', error: null };
  } catch (error) {
    return { data: null, message: 'Failed to upload zip file! ', error };
  }
};
