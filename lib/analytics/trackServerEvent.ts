import { APP_NAME } from '~/fresco.config';
import { getAppSetting } from '~/queries/appSettings';
import posthog from './server';
import { trackServerException } from './trackServerException';

export async function trackServerEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  try {
    const installationId = await getAppSetting('installationId');

    if (!installationId) return;

    posthog.capture({
      distinctId: installationId,
      event,
      properties: {
        installationId,
        app: APP_NAME,
        ...properties,
      },
    });
  } catch (e) {
    await trackServerException(e, { event, ...properties });
  }
}
