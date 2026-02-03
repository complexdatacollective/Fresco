export function registerServiceWorkerIfEnabled(): void {
  // CRITICAL: Synchronous check BEFORE any async operations
  if (!localStorage.getItem('offlineModeEnabled')) return;
  if (!('serviceWorker' in navigator)) return;

  void navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            const isInterview =
              window.location.pathname.startsWith('/interview/');

            // Defer updates during interviews
            if (!isInterview) {
              if (confirm('A new version is available. Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          }
        });
      });
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Service worker registration failed:', error);
    });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
