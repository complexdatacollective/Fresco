import { createRouteHandler } from 'uploadthing/next';
import { getAppSetting } from '~/queries/appSettings';
import { ourFileRouter } from './core';

// get env variable from db
const uploadThingToken = await getAppSetting('uploadThingToken');

if (!uploadThingToken) {
  throw new Error('Missing UploadThing environment variable');
}

const publicUrl = await getAppSetting('publicUrl');

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // The URL to where the route handler is hosted
    // UploadThing attempts to automatically detect this value based on the request URL and headers
    // However, the automatic detection fails in docker deployments
    // docs: https://docs.uploadthing.com/api-reference/server#config
    callbackUrl: publicUrl ? `${publicUrl}/api/uploadthing` : undefined,
    token: uploadThingToken,
  },
});
