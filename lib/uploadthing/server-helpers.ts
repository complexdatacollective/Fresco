'use server';

import { UTApi } from 'uploadthing/server';
import { getAppSetting } from '~/queries/appSettings';

export const getUTApi = async () => {
  const UPLOADTHING_TOKEN = await getAppSetting('uploadThingToken');

  const utapi = new UTApi({
    token: UPLOADTHING_TOKEN ?? undefined,
  });

  return utapi;
};
