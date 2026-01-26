import type { TestInfo } from '@playwright/test';
import type { Participant } from '~/lib/db/generated/client';
import { getWorkerContextInfo, type WorkerContext } from './worker-context';

type ParticipantSnapshot = {
  participants: Participant[];
};

type DatabaseFingerprint = {
  participantCount: number;
  participantIds: string[];
};

type IsolationState = 'none' | 'isolated' | 'restored';

/**
 * Database operations for test isolation.
 * Uses data-level snapshots for reliable state management across test operations.
 * Automatically clears Next.js data cache after database mutations to ensure
 * the UI reflects the current database state.
 *
 * Includes state change tracking to detect when tests modify the database
 * without proper isolation.
 */
export class DatabaseSnapshots {
  private context: WorkerContext;
  private testInfo?: TestInfo;
  private _contextInfo: Awaited<
    ReturnType<typeof getWorkerContextInfo>
  > | null = null;
  private snapshots = new Map<string, ParticipantSnapshot>();

  // State tracking for isolation detection
  private initialFingerprint: DatabaseFingerprint | null = null;
  private isolationState: IsolationState = 'none';
  private isolationDepth = 0;

  constructor(context: WorkerContext, testInfo?: TestInfo) {
    this.context = context;
    this.testInfo = testInfo;
  }

  /**
   * Initialize state tracking. Called automatically when the fixture is first used.
   * Records the initial database state to detect unrestored changes.
   */
  async initializeTracking(): Promise<void> {
    this.initialFingerprint ??= await this.getFingerprint();
  }

  /**
   * Get a fingerprint of the current database state.
   * Used to detect if the database was modified without being restored.
   */
  private async getFingerprint(): Promise<DatabaseFingerprint> {
    const participants = await this.context.prisma.participant.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    return {
      participantCount: participants.length,
      participantIds: participants.map((p) => p.id),
    };
  }

  /**
   * Compare two fingerprints to check if the database state changed.
   */
  private fingerprintsMatch(
    a: DatabaseFingerprint,
    b: DatabaseFingerprint,
  ): boolean {
    if (a.participantCount !== b.participantCount) return false;
    if (a.participantIds.length !== b.participantIds.length) return false;
    return a.participantIds.every((id, i) => id === b.participantIds[i]);
  }

  /**
   * Check if the database state was modified and not restored.
   * Returns a warning message if issues are detected, or null if everything is fine.
   */
  async checkForUnrestoredChanges(): Promise<string | null> {
    if (this.initialFingerprint === null) {
      return null; // Tracking wasn't initialized
    }

    // If we're still inside an isolation block, that's a problem
    if (this.isolationDepth > 0) {
      return `Test ended with ${this.isolationDepth} unclosed isolation scope(s). Did you forget to call cleanup()?`;
    }

    const currentFingerprint = await this.getFingerprint();

    if (!this.fingerprintsMatch(this.initialFingerprint, currentFingerprint)) {
      const diff = {
        initialCount: this.initialFingerprint.participantCount,
        currentCount: currentFingerprint.participantCount,
      };

      return (
        `Database state changed during test but was not restored.\n` +
        `  Initial participant count: ${diff.initialCount}\n` +
        `  Current participant count: ${diff.currentCount}\n` +
        `  Isolation state: ${this.isolationState}\n` +
        `  💡 Use database.isolate() or database.withSnapshot() for tests that modify data.`
      );
    }

    return null;
  }

  /**
   * Get the current isolation state for debugging
   */
  getIsolationState(): { state: IsolationState; depth: number } {
    return {
      state: this.isolationState,
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
   * Clear the Next.js data cache to ensure UI reflects current database state.
   * This is necessary because Next.js caches database queries via createCachedFunction.
   */
  async clearNextCache(): Promise<void> {
    try {
      const response = await fetch(
        `${this.context.appUrl}/api/test/clear-cache`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(
          `Failed to clear Next.js cache: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to clear Next.js cache:', error);
    }
  }

  /**
   * Run a function within a transaction that will be rolled back.
   * Useful for tests that need complete isolation within a single callback.
   */
  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    this.isolationDepth++;
    this.isolationState = 'isolated';

    // We use a symbol to mark the rollback result
    const ROLLBACK_MARKER = Symbol('rollback');
    let capturedResult: T | undefined;

    try {
      await this.context.prisma.$transaction(async () => {
        capturedResult = await fn();
        // Throw to trigger rollback - Prisma will catch this
        const error = new Error('Intentional rollback');
        (error as unknown as Record<symbol, boolean>)[ROLLBACK_MARKER] = true;
        throw error;
      });
    } catch (error) {
      // Check if this is our intentional rollback
      if (
        error instanceof Error &&
        (error as unknown as Record<symbol, boolean>)[ROLLBACK_MARKER]
      ) {
        return capturedResult as T;
      }
      throw error;
    } finally {
      this.isolationDepth--;
      if (this.isolationDepth === 0) {
        this.isolationState = 'restored';
      }
    }

    // Should never reach here, but TypeScript needs this
    return capturedResult as T;
  }

  /**
   * Create an isolation context that can be cleaned up.
   * Takes a snapshot of current data and returns a cleanup function that restores it.
   * Tracks isolation state to detect when cleanup is not called.
   * @param name - Optional identifier for the snapshot
   * @returns A cleanup function that restores to the state before isolation
   */
  async isolate(name?: string): Promise<() => Promise<void>> {
    const snapshotName = name ?? `isolate_${Date.now()}`;
    await this.create(snapshotName);

    this.isolationDepth++;
    this.isolationState = 'isolated';

    return async () => {
      await this.clearNextCache();
      await this.restore(snapshotName);
      this.isolationDepth--;
      if (this.isolationDepth === 0) {
        this.isolationState = 'restored';
      }
    };
  }

  /**
   * Create a named snapshot of the current database state.
   * @param name - Name for the snapshot
   */
  async create(name: string): Promise<void> {
    const participants = await this.context.prisma.participant.findMany();
    this.snapshots.set(name, { participants });
  }

  /**
   * Restore to a previously created snapshot.
   * Also clears the Next.js cache to ensure UI reflects the restored state.
   * @param name - Name of the snapshot to restore to
   */
  async restore(name: string): Promise<void> {
    const snapshot = this.snapshots.get(name);
    if (!snapshot) {
      throw new Error(`Snapshot "${name}" does not exist`);
    }

    // Delete all related data first (interviews depend on participants)
    await this.context.prisma.interview.deleteMany();
    await this.context.prisma.participant.deleteMany();

    // Restore participants
    if (snapshot.participants.length > 0) {
      await this.context.prisma.participant.createMany({
        data: snapshot.participants,
      });
    }

    // Clear Next.js cache to ensure UI reflects the restored database state
    await this.clearNextCache();
  }

  /**
   * Run a function within a snapshot scope.
   * Automatically restores to the state before the function was called.
   * @param name - Name for the snapshot scope
   * @param fn - Function to execute within the scope
   * @returns The result of the function
   */
  async withSnapshot<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const cleanup = await this.isolate(name);
    try {
      return await fn();
    } finally {
      await cleanup();
    }
  }

  /**
   * Get access to the underlying Prisma client for direct database operations
   */
  get prisma() {
    return this.context.prisma;
  }

  /**
   * Get the app URL for this context
   */
  get appUrl() {
    return this.context.appUrl;
  }

  /**
   * Get the suite ID for this context
   */
  get suiteId() {
    return this.context.suiteId;
  }

  /**
   * Get the test data for this context (only available for interview suite)
   */
  get testData() {
    return this.context.testData;
  }
}
