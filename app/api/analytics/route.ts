import { getInstallationId } from '~/analytics/utils';
import { createRouteHandler } from '@codaco/analytics';

const installationId = await getInstallationId();

const routeHandler = createRouteHandler({
  installationId,
});

export { routeHandler as POST };
