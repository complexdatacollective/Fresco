'use client';

import { ensureError } from '~/utils/ensureError';
import { logOfflineError } from './db';

type SessionStatus = 'valid' | 'expired' | 'unknown';

export type SessionState = {
  status: SessionStatus;
  expiresAt: number | null;
  needsReauth: boolean;
};

const SESSION_CHECK_INTERVAL = 60000;
const SESSION_WARNING_THRESHOLD = 300000;

export class SessionManager {
  private checkInterval: number | null = null;
  private listeners = new Set<(state: SessionState) => void>();

  onSessionChange(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(state: SessionState): void {
    this.listeners.forEach((listener) => listener(state));
  }

  async checkSession(): Promise<SessionState> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return {
          status: 'expired',
          expiresAt: null,
          needsReauth: true,
        };
      }

      const data = (await response.json()) as {
        valid: boolean;
        expiresAt?: number;
      };

      if (!data.valid) {
        return {
          status: 'expired',
          expiresAt: null,
          needsReauth: true,
        };
      }

      const expiresAt = data.expiresAt ?? null;
      const timeUntilExpiry = expiresAt ? expiresAt - Date.now() : null;
      const needsReauth =
        timeUntilExpiry !== null && timeUntilExpiry < SESSION_WARNING_THRESHOLD;

      return {
        status: 'valid',
        expiresAt,
        needsReauth,
      };
    } catch (error) {
      await logOfflineError('checkSession', error);
      return {
        status: 'unknown',
        expiresAt: null,
        needsReauth: false,
      };
    }
  }

  startMonitoring(): void {
    if (this.checkInterval !== null) {
      return;
    }

    this.checkInterval = window.setInterval(() => {
      this.checkSession()
        .then((state) => this.notifyListeners(state))
        .catch((error) => {
          const err = ensureError(error);
          // eslint-disable-next-line no-console
          console.error('Session check failed:', err);
        });
    }, SESSION_CHECK_INTERVAL);

    void this.checkSession().then((state) => this.notifyListeners(state));
  }

  stopMonitoring(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      await logOfflineError('refreshSession', error);
      return false;
    }
  }
}

export const sessionManager = new SessionManager();
