import { createRouteHandler } from '@codaco/analytics';
import { type NextRequest } from 'next/server';
import { getAppSetting, getDisableAnalytics } from '~/queries/appSettings';

const routeHandler = async (request: NextRequest) => {
  const installationId = await getAppSetting('installationId');
  const disableAnalytics = await getDisableAnalytics();

  return createRouteHandler({
    installationId: installationId ?? 'Unknown Installation ID',
    disableAnalytics,
  })(request);
};

export { routeHandler as POST };
