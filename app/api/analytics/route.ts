import { createRouteHandler } from '@codaco/analytics';
import { type NextRequest } from 'next/server';
import { getAppSetting } from '~/queries/appSettings';

const routeHandler = async (request: NextRequest) => {
  const installationId = await getAppSetting('installationId');
  const disableAnalytics = await getAppSetting('disableAnalytics');

  return createRouteHandler({
    installationId,
    disableAnalytics,
  })(request);
};

export { routeHandler as POST };
