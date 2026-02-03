# Fresco

## **This is the GitHub repository for Fresco. It is indended for developers who want to contribute to the code. If you want to deploy Fresco, or learn more about how it works, please visit the documentation website: [https://documentation.networkcanvas.com/en/fresco](https://documentation.networkcanvas.com/en/fresco).**

The Fresco project aims to bring Network Canvas interviews to the web browser. It is a pilot project that does not
add new features to Network Canvas, but rather provides a new way to conduct interviews.

![Alt](https://repobeats.axiom.co/api/embed/3902b97960b7e32971202cbd5b0d38f39d51df51.svg 'Repobeats analytics image')

## Offline Support

Fresco supports offline interviews through a service worker and IndexedDB. When enabled, users can:

- Download protocols for offline use
- Start and conduct interviews without network connectivity
- Automatically sync interview data when back online

### Testing the Service Worker in Development

The service worker is disabled by default in development mode. To enable it:

```bash
ENABLE_SW=true pnpm dev
```

### Testing Service Worker Changes

When making changes to `lib/pwa/sw.ts`, follow this workflow:

1. **Make your changes** to `lib/pwa/sw.ts`

2. **Restart the dev server** (required for the service worker to rebuild):

   ```bash
   # Stop the server (Ctrl+C), then:
   ENABLE_SW=true pnpm dev
   ```

3. **In Chrome DevTools** (Application tab → Service Workers):
   - Check **"Update on reload"** to force-update the service worker on each page refresh
   - Or click **"Update"** manually, then **"Skipwaiting"** if the new worker is waiting

4. **Hard refresh** the page (`Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows/Linux)

5. **Clear cache if needed** (Application tab → Storage → Clear site data)

### Testing Offline Behavior

1. Open DevTools → Network tab
2. Check **"Offline"** checkbox to simulate offline mode
3. Navigate around the dashboard - pages should load from cache
4. Try starting an offline interview with a cached protocol

### Useful DevTools Locations

| Location                                  | Purpose                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| Application → Service Workers             | View registered workers, update/unregister them       |
| Application → Cache Storage               | See cached content (dashboard-pages, api-cache, etc.) |
| Application → IndexedDB → FrescoOfflineDB | View offline interviews, cached protocols, assets     |
| Network tab (filter: "ServiceWorker")     | See which requests are served from cache              |

### Common Issues

| Issue                                 | Solution                                                          |
| ------------------------------------- | ----------------------------------------------------------------- |
| `bad-precaching-response` error (404) | Clear site data in Application → Storage, then restart dev server |
| Service worker not updating           | Enable "Update on reload" in DevTools, or clear site data         |
| Old cached pages                      | Clear site data in Application tab                                |
| Changes not taking effect             | Restart dev server with `ENABLE_SW=true`                          |
| Service worker not registering        | Check browser console for errors; ensure HTTPS or localhost       |

**Note:** The `bad-precaching-response` error typically occurs when the service worker's precache manifest references files from an old build. Always clear site data after rebuilding.

## Thanks

<a href="https://www.chromatic.com/"><img src="https://user-images.githubusercontent.com/321738/84662277-e3db4f80-af1b-11ea-88f5-91d67a5e59f6.png" width="153" height="30" alt="Chromatic" /></a>

Thanks to [Chromatic](https://www.chromatic.com/) for providing the visual testing platform that helps us review UI changes and catch visual regressions.
