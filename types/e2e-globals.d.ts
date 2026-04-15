import type { Map as MapboxMap } from 'mapbox-gl';

// E2E-only window handles, populated when NEXT_PUBLIC_E2E_TEST is true so
// test fixtures can query live client-side state directly (see
// lib/interviewer/Interfaces/Geospatial/useMapbox.ts).
declare global {
  interface Window {
    __e2eMap?: MapboxMap;
  }
}

export type {};
