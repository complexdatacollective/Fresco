import type { Map as MapboxMap } from 'mapbox-gl';

// E2E-only window handles populated by @codaco/interview when
// NEXT_PUBLIC_E2E_TEST is true. Fresco's e2e tests query these.
declare global {
  interface Window {
    __e2eMap?: MapboxMap;
  }
}

export type {};
