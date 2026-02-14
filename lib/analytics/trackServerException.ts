import { APP_NAME } from '~/fresco.config';
import { getAppSetting } from '~/queries/appSettings';
import posthog from './server';

export async function trackServerException(
  error: unknown,
  additionalProperties?: Record<string, unknown>,
) {
  const installationId = await getAppSetting('installationId');

  if (!installationId) return;

  posthog.captureException(error, installationId, {
    app: APP_NAME,
    installation_id: installationId,
    ...additionalProperties,
  });
}
