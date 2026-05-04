/**
 * Returns true when the current browser is webkit or firefox under
 * Playwright's E2E matrix. Used together with `isE2E` from useContractFlags
 * to gate the Geospatial stub render path. The check is bounded to E2E
 * runs by the caller — production code never reaches this branch because
 * isE2E is false.
 *
 * Detection: chromium's UA contains "Chrome/<version>". Firefox and webkit
 * do not. That's sufficient for the three Playwright targets (chromium,
 * firefox, webkit).
 */
export function isMapboxStubBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return !navigator.userAgent.includes('Chrome/');
}
