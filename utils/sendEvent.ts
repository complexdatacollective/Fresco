'use server';

import { type EventPayload, trackEvent } from '@codaco/analytics';
import { api } from '~/trpc/server';

import { WebServiceClient } from '@maxmind/geoip2-node';
import { env } from 'process';
import { headers } from 'next/headers';

async function getGeoInfo() {
  const maxmindAccountId = env.MAXMIND_ACCOUNT_ID;
  const maxmindLicenseKey = env.MAXMIND_LICENSE_KEY;
  const ip = headers().get('x-forwarded-for');

  if (!maxmindAccountId || !maxmindLicenseKey) {
    throw new Error(
      'MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY environment variables must be set',
    );
  }

  if (!ip) {
    throw new Error('x-forwarded-for header must be set');
  }

  const client = new WebServiceClient(maxmindAccountId, maxmindLicenseKey, {
    host: 'geolite.info',
  });

  try {
    const response = await client.country(ip);

    if (!response || !response.country || !response.country.isoCode) {
      throw new Error('Could not get country code');
    }

    return response.country.isoCode;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return 'unknown';
  }
}

// wrap analytics trackEvent to send events only if user has allowed analytics
export async function sendEvent(
  type: EventPayload['type'],
  metadata?: EventPayload['metadata'],
) {
  const appSettings = await api.appSettings.get.query();
  if (
    !appSettings ||
    !appSettings.installationId ||
    !appSettings.allowAnalytics
  ) {
    return;
  }

  const event: EventPayload = {
    type: type,
    metadata: metadata,
    installationid: appSettings.installationId,
    isocode: await getGeoInfo(),
  };
  await trackEvent(event);
}
