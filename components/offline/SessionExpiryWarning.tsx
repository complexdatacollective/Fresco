'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import {
  sessionManager,
  type SessionState,
} from '~/lib/offline/sessionManager';
import { ensureError } from '~/utils/ensureError';

export function SessionExpiryWarning() {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    sessionManager.startMonitoring();

    const unsubscribe = sessionManager.onSessionChange((state) => {
      setSessionState(state);
    });

    return () => {
      unsubscribe();
      sessionManager.stopMonitoring();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const success = await sessionManager.refreshSession();
      if (success) {
        const newState = await sessionManager.checkSession();
        setSessionState(newState);
      }
    } catch (error) {
      const err = ensureError(error);
      // eslint-disable-next-line no-console
      console.error('Failed to refresh session:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (!sessionState?.needsReauth) {
    return null;
  }

  if (sessionState.status === 'expired') {
    return (
      <Alert variant="warning">
        <AlertTitle>Session Expired</AlertTitle>
        <AlertDescription>
          Your session has expired. Your work is saved offline. Please sign in
          again to sync your data.
          <div className="mt-3">
            <Button size="sm" onClick={() => (window.location.href = '/login')}>
              Sign In
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning">
      <AlertTitle>Session Expiring Soon</AlertTitle>
      <AlertDescription>
        Your session will expire soon. Refresh now to continue syncing data
        without interruption.
        <div className="mt-3">
          <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Session'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
