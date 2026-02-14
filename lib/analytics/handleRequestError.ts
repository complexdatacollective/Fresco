import type { Instrumentation } from 'next';
import { PostHog } from 'posthog-node';
import { APP_NAME, POSTHOG_HOST, POSTHOG_KEY } from '~/fresco.config';
import { getAppSetting } from '~/queries/appSettings';

let posthog: PostHog | null = null;

function getPostHog() {
  posthog ??= new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });
  return posthog;
}

export const handleRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  const installationId = await getAppSetting('installationId');

  if (!installationId) return;

  const ph = getPostHog();

  ph.captureException(err, 'server', {
    app: APP_NAME,
    installationId,
    request_path: request.path,
    request_method: request.method,
    route_path: context.routePath,
    route_type: context.routeType,
    render_source: context.renderSource,
  });

  await ph.flush();
};
