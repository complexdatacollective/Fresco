import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import { buildAppSuperProperties } from '@codaco/shared-consts';

// Deliberately imported without a `with { type: 'json' }` attribute.
// Storybook's Next.js Vite builder transforms this file with Next's SWC, and
// `vite-plugin-storybook-nextjs` hardcodes `emitAssertForImportAttributes`,
// rewriting the attribute to the legacy `assert` keyword that Chromium
// removed — which breaks every story importing this module. `resolveJsonModule`
// and bundler resolution make the plain form equivalent everywhere Fresco
// loads this file. `next.config.ts` keeps the attribute: it is loaded by Next
// itself, never by the Storybook pipeline.
import pkg from './package.json';

export const PROTOCOL_EXTENSION = '.netcanvas';

/**
 * The oldest protocol schema version Fresco accepts for upload. Files at or
 * above this version but below the compatible version are migrated during
 * import (`lib/protocol/validateAndMigrateProtocol.ts`); anything older is
 * rejected outright. This floor is a product decision, so it stays explicit.
 */
const OLDEST_SUPPORTED_SCHEMA_VERSION = 7;

/**
 * Every protocol schema version Fresco accepts for upload, inclusive.
 *
 * The ceiling is the version the embedded `@codaco/interview` runtime can
 * execute, so bumping that package's compatible version widens this window
 * automatically rather than leaving a literal behind to be forgotten.
 */
export const APP_SUPPORTED_SCHEMA_VERSIONS: readonly number[] = Array.from(
  {
    length:
      COMPATIBLE_PROTOCOL_SCHEMA_VERSION - OLDEST_SUPPORTED_SCHEMA_VERSION + 1,
  },
  (_, offset) => OLDEST_SUPPORTED_SCHEMA_VERSION + offset,
);

// Analytics. The project key, relay host and super-property shape are shared by
// every Network Canvas product so their events land in one project under one
// schema — see `@codaco/shared-consts`.
export const POSTHOG_APP_NAME = 'Fresco';
export const POSTHOG_APP_VERSION = pkg.version;
export const POSTHOG_APP_PROPERTIES = buildAppSuperProperties({
  appKey: POSTHOG_APP_NAME,
  appName: POSTHOG_APP_NAME,
  version: POSTHOG_APP_VERSION,
});
export {
  POSTHOG_API_KEY,
  POSTHOG_HOST as POSTHOG_PROXY_HOST,
} from '@codaco/shared-consts';

// If unconfigured, the app will shut down after 2 hours (7200000 ms)
export const UNCONFIGURED_TIMEOUT = 7200000;

// Maximum size of a .netcanvas protocol file that can be imported.
// This matches the UploadThing per-file limit (256MB) and is enforced
// regardless of storage provider to keep messaging consistent.
export const MAX_PROTOCOL_UPLOAD_BYTES = 256 * 1024 * 1024;
