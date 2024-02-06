import { getInstallationId } from '~/analytics/utils';
import { env } from '~/env.mjs';
import { createRouteHandler } from '@codaco/analytics';
import { WebServiceClient } from '@maxmind/geoip2-node';

const maxMindClient = new WebServiceClient(
  env.MAXMIND_ACCOUNT_ID!,
  env.MAXMIND_LICENSE_KEY!,
  {
    host: 'geolite.info',
  },
);

const installationId = await getInstallationId();

const routeHandler = createRouteHandler({
  installationId,
  maxMindClient,
});

export { routeHandler as POST };
