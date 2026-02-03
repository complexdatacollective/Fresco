/**
 * Fresco Service Worker
 *
 * This service worker enables offline functionality for the Fresco dashboard
 * and interview system. It uses Serwist (a Workbox wrapper) with Next.js.
 *
 * ## Caching Strategies
 *
 * - **NetworkFirst**: Used for dashboard and interview pages. Tries network first,
 *   falls back to cache when offline. Good for dynamic content that should be fresh
 *   but needs offline support.
 *
 * - **StaleWhileRevalidate**: Used for API responses. Returns cached data immediately
 *   while fetching fresh data in the background. Good for data that can be slightly stale.
 *
 * - **CacheFirst**: Used for static assets (images, fonts, Next.js bundles).
 *   Returns cached version if available, only fetches if not cached.
 *   Good for assets that rarely change.
 *
 * ## Development Testing
 *
 * The service worker is disabled in development by default. To enable:
 *
 *   ENABLE_SW=true pnpm dev
 *
 * After making changes to this file:
 *
 * 1. Restart the dev server (Ctrl+C, then ENABLE_SW=true pnpm dev)
 * 2. In Chrome DevTools → Application → Service Workers:
 *    - Check "Update on reload" OR
 *    - Click "Update" then "Skipwaiting"
 * 3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
 * 4. If issues persist, click "Clear site data" in Storage section
 *
 * ## Debugging
 *
 * - Application → Service Workers: See worker status, update/unregister
 * - Application → Cache Storage: View cached content by cache name
 * - Network tab: Filter by "ServiceWorker" to see cached responses
 *
 * @see https://serwist.pages.dev/ - Serwist documentation
 * @see https://developer.chrome.com/docs/workbox/ - Workbox documentation
 */

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

/**
 * Main Serwist instance configuration.
 *
 * - precacheEntries: Auto-generated manifest of static assets to precache
 * - skipWaiting: New service worker activates immediately without waiting
 * - clientsClaim: Take control of all clients as soon as active
 * - navigationPreload: Enable navigation preload for faster page loads
 *
 * Note: In development, if you see "bad-precaching-response" errors, clear
 * site data in DevTools (Application → Storage → Clear site data).
 * This happens when old cached file hashes don't match the new build.
 */
const serwist = new Serwist({
  // Precache static assets from the build manifest
  // In development, file hashes change frequently - clear site data if you see 404 errors
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    /**
     * Cross-origin requests - Pass through to network
     *
     * Don't cache cross-origin requests (e.g., UploadThing file storage).
     * These requests are handled directly by the browser to avoid CORS issues.
     * The offline system stores these assets in IndexedDB instead.
     */
    {
      matcher: ({ sameOrigin }) => !sameOrigin,
      handler: new NetworkOnly(),
    },

    /**
     * Dashboard Pages - NetworkFirst with 10s timeout
     *
     * Tries to fetch from network first for fresh content.
     * Falls back to cache if network fails or times out.
     * Cache name: 'dashboard-pages'
     */
    {
      matcher: ({ request, url }) => {
        return (
          request.mode === 'navigate' && url.pathname.startsWith('/dashboard')
        );
      },
      handler: new NetworkFirst({
        cacheName: 'dashboard-pages',
        networkTimeoutSeconds: 10,
        plugins: [
          {
            cacheWillUpdate: ({ response }) => {
              // Only cache successful responses (200 OK)
              if (response?.status === 200) {
                return Promise.resolve(response);
              }
              return Promise.resolve(null);
            },
          },
        ],
      }),
    },

    /**
     * Interview Pages - NetworkFirst with 10s timeout
     *
     * Similar to dashboard, but for interview routes.
     * Ensures interviews can be loaded offline once cached.
     * Cache name: 'interview-pages'
     */
    {
      matcher: ({ request, url }) => {
        return (
          request.mode === 'navigate' && url.pathname.startsWith('/interview')
        );
      },
      handler: new NetworkFirst({
        cacheName: 'interview-pages',
        networkTimeoutSeconds: 10,
      }),
    },

    /**
     * API Responses - StaleWhileRevalidate
     *
     * Returns cached data immediately, then fetches fresh data in background.
     * Excludes auth endpoints (sensitive) and sync endpoints (need real-time).
     * Cache name: 'api-cache'
     */
    {
      matcher: ({ url }) => {
        return (
          url.pathname.startsWith('/api/') &&
          !url.pathname.includes('/auth/') &&
          !url.pathname.includes('/sync')
        );
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'api-cache',
        plugins: [
          {
            cacheWillUpdate: ({ response }) => {
              if (response?.status === 200) {
                return Promise.resolve(response);
              }
              return Promise.resolve(null);
            },
          },
        ],
      }),
    },

    /**
     * Static Assets - CacheFirst
     *
     * Images, fonts, and stylesheets rarely change.
     * Serve from cache when available, only fetch if not cached.
     * Cache name: 'static-assets'
     */
    {
      matcher: ({ request }) => {
        return (
          request.destination === 'image' ||
          request.destination === 'font' ||
          request.destination === 'style'
        );
      },
      handler: new CacheFirst({
        cacheName: 'static-assets',
        plugins: [
          {
            cacheWillUpdate: ({ response }) => {
              if (response?.status === 200) {
                return Promise.resolve(response);
              }
              return Promise.resolve(null);
            },
          },
        ],
      }),
    },

    /**
     * Next.js Static Files - CacheFirst
     *
     * JS/CSS bundles from /_next/static/ are immutable (hashed filenames).
     * Cache name: 'next-static'
     */
    {
      matcher: ({ url }) => {
        return url.pathname.startsWith('/_next/static/');
      },
      handler: new CacheFirst({
        cacheName: 'next-static',
      }),
    },
    // Default caching from Serwist
    ...defaultCache,
  ],
});

serwist.addEventListeners();

/**
 * Message Handler - Receives messages from the main thread
 *
 * Supported message types:
 *
 * - SKIP_WAITING: Force the waiting service worker to become active.
 *   Useful when you want to immediately activate a new version.
 *   Usage from main thread:
 *     navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' })
 *
 * - CACHE_DASHBOARD: Pre-cache all dashboard routes.
 *   Call this after user logs in to ensure offline access to dashboard.
 *   Usage from main thread:
 *     navigator.serviceWorker.controller?.postMessage({ type: 'CACHE_DASHBOARD' })
 */
self.addEventListener('message', (event: MessageEvent<{ type: string }>) => {
  if (event.data?.type === 'SKIP_WAITING') {
    // skipWaiting() activates this service worker immediately,
    // even if there's another version currently controlling the page
    void (
      self as unknown as { skipWaiting: () => Promise<void> }
    ).skipWaiting();
  }

  if (event.data?.type === 'CACHE_DASHBOARD') {
    // Pre-fetch and cache all main dashboard routes
    // This ensures the dashboard works offline even before the user visits each page
    const dashboardRoutes = [
      '/dashboard',
      '/dashboard/protocols',
      '/dashboard/participants',
      '/dashboard/interviews',
      '/dashboard/settings',
    ];

    void Promise.all(
      dashboardRoutes.map(async (route) => {
        try {
          const response = await fetch(route);
          if (response.ok) {
            const cache = await caches.open('dashboard-pages');
            await cache.put(route, response);
          }
        } catch {
          // Ignore fetch errors during pre-caching
        }
      }),
    );
  }
});
