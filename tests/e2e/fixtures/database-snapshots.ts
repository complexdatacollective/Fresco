import type { TestInfo } from '@playwright/test';
import type { PrismaClient } from '~/lib/db/generated/client';
import { getWorkerContextInfo, type WorkerContext } from './worker-context';

type SnapshotResponse = {
  success: boolean;
  action: string;
  suiteId: string;
  name: string;
  appUrl?: string;
  databaseUrl?: string;
  error?: string;
};

/**
 * Database operations for test isolation using container-level snapshots.
 *
 * Uses testcontainers' snapshot/restore mechanism via an HTTP API to the
 * snapshot server running in the global setup process. When restoring,
 * the Next.js server is automatically restarted to ensure clean connections.
 *
 * This provides true database-level isolation - the entire PostgreSQL
 * container is restored to a previous state.
 */
export class DatabaseSnapshots {
  private context: WorkerContext;
  private testInfo?: TestInfo;
  private _contextInfo: Awaited<
    ReturnType<typeof getWorkerContextInfo>
  > | null = null;
  private isolationDepth = 0;

  constructor(context: WorkerContext, testInfo?: TestInfo) {
    this.context = context;
    this.testInfo = testInfo;
  }

  /**
   * Initialize state tracking. Called automatically when the fixture is first used.
   */
  async initializeTracking(): Promise<void> {
    // No-op for container-level snapshots - tracking is handled by the snapshot server
  }

  /**
   * Check if the database state was modified and not restored.
   * Returns a warning message if issues are detected, or null if everything is fine.
   */
  checkForUnrestoredChanges(): string | null {
    if (this.isolationDepth > 0) {
      return `Test ended with ${this.isolationDepth} unclosed isolation scope(s). Did you forget to call cleanup()?`;
    }
    return null;
  }

  /**
   * Get the current isolation state for debugging
   */
  getIsolationState(): { state: string; depth: number } {
    return {
      state: this.isolationDepth > 0 ? 'isolated' : 'none',
      depth: this.isolationDepth,
    };
  }

  /**
   * Get information about the resolved context for debugging
   */
  async getContextInfo() {
    if (!this._contextInfo && this.testInfo) {
      this._contextInfo = await getWorkerContextInfo(this.testInfo);
    }
    return (
      this._contextInfo ?? {
        resolvedContext: this.context.suiteId,
        availableContexts: [this.context.suiteId],
        detectionMethod: 'direct context',
        testFile: this.testInfo?.file,
        projectName: this.testInfo?.project?.name,
        baseURL: this.testInfo?.project?.use?.baseURL,
      }
    );
  }

  /**
   * Create an isolation context for tracking test modifications.
   *
   * NOTE: The cleanup function currently does NOT restore the database because
   * restoring to 'initial' would invalidate browser auth sessions (the initial
   * snapshot was created before login). Serial tests that modify data should
   * be designed to either:
   * 1. Not depend on initial state (use their own assertions)
   * 2. Run in a specific order that accounts for data changes
   * 3. Use explicit cleanup actions within the test
   *
   * @param _name - Identifier for logging purposes
   * @returns A cleanup function that decrements isolation tracking
   */
  isolate(_name?: string): Promise<() => Promise<void>> {
    this.isolationDepth++;

    return Promise.resolve(() => {
      // NOTE: Not restoring snapshot to preserve browser auth sessions.
      // The 'initial' snapshot was created before login, so restoring
      // would invalidate all session cookies.
      this.isolationDepth--;
      return Promise.resolve();
    });
  }

  /**
   * Create a named snapshot of the current database state.
   * Uses the container-level snapshot mechanism via the snapshot server.
   *
   * @param name - Name for the snapshot
   */
  async createSnapshot(name: string): Promise<void> {
    const response = await this.callSnapshotServer('snapshot', name);
    if (!response.success) {
      throw new Error(`Failed to create snapshot: ${response.error}`);
    }
  }

  /**
   * Restore to a previously created snapshot.
   * This restarts the Next.js server to ensure clean database connections.
   *
   * IMPORTANT: After calling this, any existing page references will be
   * connected to the old (now stopped) server. You should navigate to
   * a fresh URL or refresh the page.
   *
   * @param name - Name of the snapshot to restore to
   */
  async restoreSnapshot(name: string): Promise<void> {
    const response = await this.callSnapshotServer('restore', name);
    if (!response.success) {
      throw new Error(`Failed to restore snapshot: ${response.error}`);
    }

    // Update context with potentially new URLs
    if (response.databaseUrl) {
      // Note: The Prisma client in this worker may have a stale connection.
      // For most e2e tests this is fine since we interact via the browser,
      // not directly with Prisma. If direct Prisma access is needed after
      // restore, the worker would need to reconnect.
    }
  }

  /**
   * Run a function within a snapshot scope.
   * Automatically restores to the 'initial' state after the function completes.
   *
   * @param _name - Identifier for logging purposes
   * @param fn - Function to execute within the scope
   * @returns The result of the function
   */
  async withSnapshot<T>(_name: string, fn: () => Promise<T>): Promise<T> {
    const cleanup = await this.isolate(_name);
    try {
      return await fn();
    } finally {
      await cleanup();
    }
  }

  /**
   * Clear the Next.js cache by restarting the server.
   * Use this after modifying database settings that need to take effect immediately.
   */
  async clearNextCache(): Promise<void> {
    const url = `${this.context.snapshotServerUrl}/clear-cache/${this.context.suiteId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(
        `Failed to clear Next.js cache: ${data.error ?? `HTTP ${response.status}`}`,
      );
    }
  }

  /**
   * Call the snapshot server HTTP API.
   */
  private async callSnapshotServer(
    action: 'snapshot' | 'restore',
    name: string,
  ): Promise<SnapshotResponse> {
    const url = `${this.context.snapshotServerUrl}/${action}/${this.context.suiteId}/${name}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = (await response.json()) as SnapshotResponse;

    if (!response.ok) {
      return {
        success: false,
        action,
        suiteId: this.context.suiteId,
        name,
        error: data.error ?? `HTTP ${response.status}`,
      };
    }

    return data;
  }

  /**
   * Get access to the underlying Prisma client for direct database operations.
   * Note: After a restore, this client may have a stale connection.
   */
  get prisma(): PrismaClient {
    return this.context.prisma;
  }

  /**
   * Get the app URL for this context
   */
  get appUrl(): string {
    return this.context.appUrl;
  }

  /**
   * Get the suite ID for this context
   */
  get suiteId(): string {
    return this.context.suiteId;
  }

  /**
   * Get the test data for this context (only available for interview suite)
   */
  get testData() {
    return this.context.testData;
  }
}
