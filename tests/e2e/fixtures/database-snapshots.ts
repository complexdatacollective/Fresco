import type { TestInfo } from '@playwright/test';
import type { TestEnvironmentContext } from './test-environment';
import { ContextResolver } from './context-resolver';

/**
 * Database snapshot operations for test isolation
 */
export class DatabaseSnapshots {
  private context: TestEnvironmentContext;
  private contextInfo: ReturnType<typeof ContextResolver.getContextInfo>;

  constructor(context: TestEnvironmentContext, testInfo?: TestInfo) {
    this.context = context;
    this.contextInfo = ContextResolver.getContextInfo(testInfo);
  }

  /**
   * Get information about the resolved context for debugging
   */
  getContextInfo() {
    return this.contextInfo;
  }

  /**
   * Create a database snapshot with optional name
   * @param name - Optional name for the snapshot. Defaults to timestamp if not provided
   */
  async create(name?: string): Promise<void> {
    const snapshotName = name ?? `snapshot-${Date.now()}`;
    await this.context.createSnapshot(snapshotName);
  }

  /**
   * Restore a database snapshot
   * @param name - Name of the snapshot to restore. Defaults to most recent if not provided
   */
  async restore(name?: string): Promise<void> {
    await this.context.restoreSnapshot(name);
  }

  /**
   * Create a snapshot before test and restore after (for use in test hooks)
   * @param name - Optional name for the snapshot
   */
  async withSnapshot<T>(
    name: string | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    await this.create(name);
    try {
      return await fn();
    } finally {
      await this.restore(name);
    }
  }

  /**
   * Create a snapshot at the beginning of a test and automatically restore at the end
   * Useful for serial tests that need isolation
   * @param name - Optional name for the snapshot
   */
  async isolate(name?: string): Promise<() => Promise<void>> {
    const snapshotName = name ?? `isolate-${Date.now()}`;
    await this.create(snapshotName);

    // Return cleanup function
    return async () => {
      await this.restore(snapshotName);
    };
  }

  /**
   * Get access to the underlying Prisma client for direct database operations
   */
  get prisma() {
    return this.context.prisma;
  }
}
