import { createRouteHandler } from '@codaco/analytics';
import { type NextRequest } from 'next/server';
import { getInstallationId } from '~/queries/appSettings';

const routeHandler = async (request: NextRequest) => {
  const installationId = await getInstallationId();

  return createRouteHandler({
    installationId,
  })(request);
};

export { routeHandler as POST };
