'use client';

import { useEffect } from 'react';
import { registerServiceWorkerIfEnabled } from '~/lib/pwa/registerServiceWorker';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    registerServiceWorkerIfEnabled();
  }, []);

  return null;
}
