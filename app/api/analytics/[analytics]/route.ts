import { WebServiceClient } from '@maxmind/geoip2-node';
import { env } from '~/env.mjs';
import { analytics } from '~/lib/analytics';

const maxMindClient = new WebServiceClient(
  env.MAXMIND_ACCOUNT_ID,
  env.MAXMIND_LICENSE_KEY,
  {
    host: 'geolite.info',
  },
);

const handler = analytics.createRouteHandler(maxMindClient)!;

export { handler as GET, handler as POST };
