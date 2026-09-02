import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
// Deliberate deep import: Next exposes no public API for matching a `source`
// pattern, and a local prefix matcher would be a second implementation of the
// same semantics that could drift from production. If a Next upgrade moves this
// module, the import throws and the file fails loudly — it cannot pass
// vacuously.
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { describe, expect, it } from 'vitest';

import nextConfig from '~/next.config';

/**
 * `withPostHogConfig` returns the config in the function form Next also
 * accepts — `(phase, { defaultConfig }) => Promise<NextConfig>` — even though
 * its declared return type is the plain object. Resolve it the way Next does
 * before reading anything off it.
 */
type NextConfigFunction = (
  phase: string,
  context: { defaultConfig: NextConfig },
) => NextConfig | Promise<NextConfig>;

const isConfigFunction = (
  exported: NextConfig | NextConfigFunction,
): exported is NextConfigFunction => typeof exported === 'function';

async function loadNextConfig(): Promise<NextConfig> {
  return isConfigFunction(nextConfig)
    ? nextConfig(PHASE_PRODUCTION_BUILD, { defaultConfig: {} })
    : nextConfig;
}

/**
 * The header value a browser receives for `key` on a response to `pathname`,
 * resolved the way Next resolves it: every `headers()` entry whose `source`
 * matches contributes, and when two matching entries set the same key the
 * later one wins.
 * https://nextjs.org/docs/app/api-reference/config/next-config-js/headers#header-overriding-behavior
 *
 * `source` patterns are compiled with the matcher Next itself uses, so this
 * reads `/:path*` and `/interview/:path*` exactly as production does rather
 * than approximating them. `has`/`missing` would make an entry conditional on
 * the request, which this resolver cannot model — it fails loudly if one
 * appears instead of silently treating the entry as unconditional.
 *
 * Returns `undefined` when no matching entry sets the key, so an empty
 * `headers()` cannot satisfy an equality assertion by accident.
 */
async function effectiveHeader(
  pathname: string,
  key: string,
): Promise<string | undefined> {
  const { headers } = await loadNextConfig();
  if (typeof headers !== 'function') {
    throw new Error('next.config.ts declares no headers()');
  }
  const entries = await headers();
  expect(entries.length, 'headers() declared no entries').toBeGreaterThan(0);

  let value: string | undefined;
  for (const entry of entries) {
    expect(entry.has, `${entry.source} is conditional`).toBeUndefined();
    expect(entry.missing, `${entry.source} is conditional`).toBeUndefined();
    if (!getPathMatch(entry.source)(pathname)) continue;
    for (const header of entry.headers) {
      if (header.key.toLowerCase() === key.toLowerCase()) value = header.value;
    }
  }
  return value;
}

/**
 * Participant-facing URLs. The id in each is the participant's unauthenticated
 * access capability: whoever knows it can read and overwrite the interview.
 */
const PARTICIPANT_ROUTES = [
  '/interview/clzq3n5p40000356m1a2b3c4d',
  '/onboard/clzq3n5p40001356m1a2b3c4d',
  // The dashboard's copyable recruitment link carries a trailing slash.
  '/onboard/clzq3n5p40001356m1a2b3c4d/',
];

describe('Referrer-Policy', () => {
  /**
   * `strict-origin-when-cross-origin` is the one value that satisfies both
   * requirements on these routes:
   *
   * - the interview id lives in the path, and this policy never sends the path
   *   cross-origin — a third party sees the scheme and host only, and nothing
   *   at all on an HTTPS→HTTP downgrade;
   * - Mapbox evaluates URL-restricted tokens from the Referer header and
   *   answers 403 when it is absent, so a Geospatial stage can only use a
   *   restricted token if the origin is sent.
   *
   * The alternatives each fail one of them: `no-referrer` withholds the origin
   * and breaks every restricted token (the policy these routes used to carry);
   * `origin` and `origin-when-cross-origin` send the origin on a downgrade;
   * `no-referrer-when-downgrade` sends the full path, id included, to every
   * HTTPS third party.
   */
  it.each(PARTICIPANT_ROUTES)(
    'sends only the origin cross-origin from %s',
    async (route) => {
      await expect(effectiveHeader(route, 'Referrer-Policy')).resolves.toBe(
        'strict-origin-when-cross-origin',
      );
    },
  );

  it('applies the same policy to the rest of the app', async () => {
    await expect(
      effectiveHeader('/dashboard/protocols', 'Referrer-Policy'),
    ).resolves.toBe('strict-origin-when-cross-origin');
  });
});

describe('security headers on participant routes', () => {
  it.each(PARTICIPANT_ROUTES)('%s keeps the baseline set', async (route) => {
    await expect(
      effectiveHeader(route, 'X-Content-Type-Options'),
    ).resolves.toBe('nosniff');
    await expect(effectiveHeader(route, 'X-Frame-Options')).resolves.toBe(
      'SAMEORIGIN',
    );
    await expect(
      effectiveHeader(route, 'Strict-Transport-Security'),
    ).resolves.toBe('max-age=63072000; includeSubDomains');
  });
});
