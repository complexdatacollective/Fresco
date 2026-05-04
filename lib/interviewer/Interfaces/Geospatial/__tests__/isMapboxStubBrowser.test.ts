import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMapboxStubBrowser } from '~/lib/interviewer/Interfaces/Geospatial/isMapboxStubBrowser';

describe('isMapboxStubBrowser', () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalNavigator) {
      vi.stubGlobal('navigator', originalNavigator);
    }
  });

  it('returns false for chromium UA', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/119.0.0.0 Safari/537.36',
    });
    expect(isMapboxStubBrowser()).toBe(false);
  });

  it('returns true for firefox UA', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
    });
    expect(isMapboxStubBrowser()).toBe(true);
  });

  it('returns true for webkit UA', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    });
    expect(isMapboxStubBrowser()).toBe(true);
  });

  it('returns false when navigator is undefined (SSR)', () => {
    vi.stubGlobal('navigator', undefined);
    expect(isMapboxStubBrowser()).toBe(false);
  });
});
