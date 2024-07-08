import { createRouteHandler } from 'uploadthing/next';
import { env } from '~/env';
import { ourFileRouter } from './core';

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    callbackUrl:
      env.NODE_ENV === 'production' && env.PUBLIC_URL
        ? env.PUBLIC_URL + '/api/uploadthing'
        : undefined,
  },
});
