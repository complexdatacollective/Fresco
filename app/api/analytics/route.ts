import { getInstallationId } from '~/analytics/utils';
import { env } from '~/env.mjs';
import { createRouteHandler } from '@codaco/analytics';
import { WebServiceClient } from '@maxmind/geoip2-node';

const maxMindClient = new WebServiceClient(
  env.MAXMIND_ACCOUNT_ID,
  env.MAXMIND_LICENSE_KEY,
  {
    host: 'geolite.info',
  },
);

const installationId = await getInstallationId();

let routeHandler;

if (env.DISABLE_ANALYTICS && env.DISABLE_ANALYTICS === true) {
  routeHandler = async () => {
    return new Response(null, { status: 204 });
  };
} else {
  routeHandler = createRouteHandler({
    installationId,
    platformUrl: 'https://frescoanalytics.networkcanvas.dev',
    maxMindClient,
  });
}

export { routeHandler as POST };
