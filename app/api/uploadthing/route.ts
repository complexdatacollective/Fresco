import { type NextRequest } from 'next/server';
import { createRouteHandler } from 'uploadthing/next';
import { getAppSetting } from '~/queries/appSettings';
import { getBaseUrl } from '~/utils/getBaseUrl';
import { ourFileRouter } from './core';

/**
 * Tricky problem here: getAppSetting uses unstable_cache, which can't be
 * called at the top level of a route handler, but _can_ be called inside
 * a function that is called by the route handler. So we need to wrap the
 * route handler in a function that calls getAppSetting.
 *
 * Better solutions welcome!
 *
 */
const routeHandler = async () => {
  const uploadThingToken = await getAppSetting('uploadThingToken');

  const handler = createRouteHandler({
    router: ourFileRouter,
    config: {
      // The URL to where the route handler is hosted
      // UploadThing attempts to automatically detect this value based on the request URL and headers
      // However, the automatic detection fails in docker deployments
      // docs: https://docs.uploadthing.com/api-reference/server#config
      callbackUrl: `${getBaseUrl()}/api/uploadthing`,
      token: uploadThingToken ?? undefined,
    },
  });

  return handler;
};

const POST_HANDLER = async (request: NextRequest) => {
  const { POST } = await routeHandler();
  return POST(request);
};

export { POST_HANDLER as POST };

const GET_HANDLER = async (request: NextRequest) => {
  const { GET } = await routeHandler();
  return GET(request);
};

export { GET_HANDLER as GET };
