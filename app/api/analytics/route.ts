import { createRouteHandler } from '@codaco/analytics';
import { type NextRequest } from 'next/server';
import { getDisableAnalytics, getInstallationId } from '~/queries/appSettings';

const routeHandler = async (request: NextRequest) => {
  const installationId = await getInstallationId();
  const disableAnalytics = await getDisableAnalytics();

  return createRouteHandler({
    installationId: installationId ?? 'Unknown Installation ID',
    disableAnalytics,
  })(request);
};

export { routeHandler as POST };
