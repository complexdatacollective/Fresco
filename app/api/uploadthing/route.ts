import { invariant } from 'es-toolkit';
import { type NextRequest } from 'next/server';
import { createRouteHandler } from 'uploadthing/next';
import { getStorageConfig } from '~/lib/storage/config';
import { getBaseUrl } from '~/utils/getBaseUrl';
import { ourFileRouter } from './core';

/**
 * getStorageConfig reads cached app settings ('use cache'), which can't be
 * called at the top level of a route handler. We wrap the route handler in a
 * function that resolves the config to work around this limitation.
 */
const routeHandler = async () => {
  const config = await getStorageConfig();

  invariant(
    config.provider === 'uploadthing',
    'UploadThing is not the configured storage provider',
  );

  const handler = createRouteHandler({
    router: ourFileRouter,
    config: {
      // The URL to where the route handler is hosted
      // UploadThing attempts to automatically detect this value based on the request URL and headers
      // However, the automatic detection fails in docker deployments
      // docs: https://docs.uploadthing.com/api-reference/server#config
      callbackUrl: `${getBaseUrl()}/api/uploadthing`,
      token: config.token,
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
