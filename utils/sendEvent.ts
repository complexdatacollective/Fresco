'use server';

import { type EventPayload, trackEvent } from '@codaco/analytics';
import { api } from '~/trpc/server';

import { WebServiceClient } from '@maxmind/geoip2-node';
import { env } from 'process';
import { headers } from 'next/headers';

async function getGeoInfo(): Promise<string | null> {
  const maxmindAccountId = env.MAXMIND_ACCOUNT_ID;
  const maxmindLicenseKey = env.MAXMIND_LICENSE_KEY;
  const ip = headers().get('x-forwarded-for');

  // if ip doesn't exit or is not an ipv4 address, return null
  if (!ip || !ip.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
    return null;
  }

  if (!maxmindAccountId || !maxmindLicenseKey) {
    throw new Error(
      'MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY environment variables must be set',
    );
  }

  const client = new WebServiceClient(maxmindAccountId, maxmindLicenseKey, {
    host: 'geolite.info',
  });

  try {
    const response = await client.country(ip);

    if (!response || !response.country || !response.country.isoCode) {
      // eslint-disable-next-line no-console
      console.error('Could not get country code');
      return null;
    }

    return response.country.isoCode;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting country code');
    return null;
  }
}

// wrap analytics trackEvent to send events only if the user has allowed analytics
export async function sendEvent(
  type: EventPayload['type'],
  metadata?: EventPayload['metadata'],
) {
  const appSettings = await api.appSettings.get.query();
  if (!appSettings || !appSettings.installationId) {
    return;
  }

  if (!appSettings.allowAnalytics) {
    return;
  }

  const isocode = await getGeoInfo();

  const event: EventPayload = {
    type,
    metadata,
    installationid: appSettings.installationId,
  };

  if (isocode) {
    event.isocode = isocode;
  }
  await trackEvent(event);
}
