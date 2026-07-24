'use server';

import { UTApi } from 'uploadthing/server';
import { getStorageConfig } from '~/lib/storage/config';

export const getUTApi = async () => {
  const config = await getStorageConfig();
  if (config.provider !== 'uploadthing') {
    throw new Error('UploadThing is not the configured storage provider');
  }
  return new UTApi({ token: config.token });
};
