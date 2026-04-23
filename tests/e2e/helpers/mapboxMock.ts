import type { BrowserContext } from '@playwright/test';

const SUGGEST_URL = /api\.mapbox\.com\/search\/searchbox\/v1\/suggest/;
const RETRIEVE_URL = /api\.mapbox\.com\/search\/searchbox\/v1\/retrieve/;

const SUGGEST_RESPONSE = {
  suggestions: [{ name: 'Sidetrack', mapbox_id: 'e2e-mock' }],
};

const RETRIEVE_RESPONSE = {
  features: [
    { geometry: { type: 'Point', coordinates: [-87.6298, 41.8781] } },
  ],
};

/**
 * Intercept Mapbox Search Box API calls so e2e runs don't burn billable
 * sessions. Tile/style/glyph URLs use different paths and pass through.
 */
export async function mockMapboxSearchBox(
  context: BrowserContext,
): Promise<void> {
  await context.route(SUGGEST_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(SUGGEST_RESPONSE),
    }),
  );

  await context.route(RETRIEVE_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(RETRIEVE_RESPONSE),
    }),
  );
}
