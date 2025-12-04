import type { Participant } from '@prisma/client';
import type { TestInfo } from '@playwright/test';
import { getWorkerContextInfo, type WorkerContext } from './worker-context';

type ParticipantSnapshot = {
  participants: Participant[];
};

/**
 * Database operations for test isolation.
 * Uses data-level snapshots for reliable state management across test operations.
 * Note: PostgreSQL savepoints don't work across Prisma operations since each
 * operation runs in its own transaction by default.
 */
export class DatabaseSnapshots {
  private context: WorkerContext;
  private testInfo?: TestInfo;
  private _contextInfo: Awaited<
    ReturnType<typeof getWorkerContextInfo>
  > | null = null;
  private snapshots: Map<string, ParticipantSnapshot> = new Map();

  constructor(context: WorkerContext, testInfo?: TestInfo) {
    this.context = context;
    this.testInfo = testInfo;
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
        baseURL: this.testInfo?.project?.use?.baseURL as string | undefined,
      }
    );
  }

  /**
   * Run a function within a transaction that will be rolled back.
   * Useful for tests that need complete isolation within a single callback.
   */
  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.context.prisma
      .$transaction(async () => {
        const result = await fn();
        throw { __rollback: true, result };
      })
      .catch((error) => {
        if (error?.__rollback) {
          return error.result as T;
        }
        throw error;
      });
  }

  /**
   * Create an isolation context that can be cleaned up.
   * Takes a snapshot of current data and returns a cleanup function that restores it.
   * @param name - Optional identifier for the snapshot
   * @returns A cleanup function that restores to the state before isolation
   */
  async isolate(name?: string): Promise<() => Promise<void>> {
    const snapshotName = name ?? `isolate_${Date.now()}`;
    await this.create(snapshotName);

    return async () => {
      await this.restore(snapshotName);
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
}
