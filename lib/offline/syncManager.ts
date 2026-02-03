import { type NcNetwork } from '@codaco/shared-consts';
import { logOfflineError, offlineDb } from '~/lib/offline/db';
import { postMessage } from '~/lib/offline/tabSync';
import { ensureError } from '~/utils/ensureError';

export type SyncResult = {
  interviewId: string;
  success: boolean;
  error?: string;
};

export type BatchSyncResult = {
  total: number;
  succeeded: string[];
  failed: { interviewId: string; error: string | null }[];
};

type InterviewData = {
  network: NcNetwork;
  currentStep: number;
  stageMetadata?: Record<string, unknown>;
  lastUpdated: string;
};

type SyncResponse =
  | { success: true; version: number; serverId?: string }
  | { conflict: true; serverVersion: number; serverData: ServerInterviewData };

type ServerInterviewData = {
  network: NcNetwork;
  currentStep: number;
  stageMetadata?: Record<string, unknown>;
  version: number;
  lastUpdated: string;
};

type RetryConfig = {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
};

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 6,
  baseDelay: 1000,
  maxDelay: 32000,
};

const SYNC_TIMEOUT = 30000;

export class SyncManager {
  private activeSyncs = new Set<string>();
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  async syncInterview(interviewId: string): Promise<SyncResult> {
    if (this.activeSyncs.has(interviewId)) {
      return { interviewId, success: true };
    }

    this.activeSyncs.add(interviewId);

    try {
      await this.syncWithRetry(interviewId);
      return { interviewId, success: true };
    } catch (error) {
      const err = ensureError(error);
      await logOfflineError('syncInterview', err, { interviewId });
      return { interviewId, success: false, error: err.message };
    } finally {
      this.activeSyncs.delete(interviewId);
    }
  }

  async scheduleSync(interviewId: string): Promise<void> {
    const interview = await offlineDb.interviews.get(interviewId);

    if (!interview) {
      return;
    }

    const data = JSON.parse(interview.data) as InterviewData;

    const existingQueueItem = await offlineDb.syncQueue
      .where('interviewId')
      .equals(interviewId)
      .first();

    if (existingQueueItem?.id) {
      await offlineDb.syncQueue.update(existingQueueItem.id, {
        payload: JSON.stringify(data),
      });
    } else {
      await offlineDb.syncQueue.add({
        interviewId,
        operation: interview.isOfflineCreated ? 'create' : 'update',
        createdAt: Date.now(),
        payload: JSON.stringify(data),
      });
    }

    await offlineDb.interviews.update(interviewId, {
      syncStatus: 'pending',
    });
  }

  async processPendingSyncs(): Promise<void> {
    const pendingItems = await offlineDb.syncQueue.toArray();

    for (const item of pendingItems) {
      if (!this.activeSyncs.has(item.interviewId)) {
        void this.syncInterview(item.interviewId);
      }
    }
  }

  async processPendingSyncsWithResults(): Promise<BatchSyncResult> {
    const pendingItems = await offlineDb.syncQueue.toArray();
    const results: SyncResult[] = [];

    for (const item of pendingItems) {
      if (!this.activeSyncs.has(item.interviewId)) {
        const result = await this.syncInterview(item.interviewId);
        results.push(result);
      }
    }

    const succeeded = results
      .filter((r) => r.success)
      .map((r) => r.interviewId);
    const failed = results
      .filter((r) => !r.success)
      .map((r) => ({ interviewId: r.interviewId, error: r.error ?? null }));

    return {
      total: results.length,
      succeeded,
      failed,
    };
  }

  async retryFailedSyncs(interviewIds: string[]): Promise<BatchSyncResult> {
    const results: SyncResult[] = [];

    for (const interviewId of interviewIds) {
      const result = await this.syncInterview(interviewId);
      results.push(result);
    }

    const succeeded = results
      .filter((r) => r.success)
      .map((r) => r.interviewId);
    const failed = results
      .filter((r) => !r.success)
      .map((r) => ({ interviewId: r.interviewId, error: r.error ?? null }));

    return {
      total: results.length,
      succeeded,
      failed,
    };
  }

  private async syncWithRetry(interviewId: string, attempt = 0): Promise<void> {
    try {
      const interview = await offlineDb.interviews.get(interviewId);

      if (!interview) {
        await this.removeFromSyncQueue(interviewId);
        return;
      }

      const data = JSON.parse(interview.data) as InterviewData;

      if (interview.isOfflineCreated) {
        await this.syncOfflineCreatedInterview(
          interviewId,
          interview.protocolId,
          data,
        );
      } else {
        await this.syncExistingInterview(interviewId, data);
      }

      await this.removeFromSyncQueue(interviewId);
      await offlineDb.interviews.update(interviewId, {
        syncStatus: 'synced',
      });

      postMessage({
        type: 'INTERVIEW_SYNCED',
        tempId: interviewId,
        realId: interviewId,
      });
    } catch (error) {
      if (attempt < this.retryConfig.maxRetries) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        await this.syncWithRetry(interviewId, attempt + 1);
      } else {
        throw error;
      }
    }
  }

  private async syncOfflineCreatedInterview(
    tempId: string,
    protocolId: string,
    data: InterviewData,
  ): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT);

    try {
      const response = await fetch('/api/interviews/create-offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolId,
          data,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const result = (await response.json()) as { serverId: string };

      await this.reconcileTempId(tempId, result.serverId);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async syncExistingInterview(
    interviewId: string,
    data: InterviewData,
  ): Promise<void> {
    const serverState = await this.fetchServerState(interviewId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT);

    try {
      const response = await fetch(`/interview/${interviewId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: interviewId,
          ...data,
          lastKnownVersion: serverState?.version ?? 0,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const result = (await response.json()) as SyncResponse;

      if ('conflict' in result && result.conflict) {
        await this.handleConflict(interviewId, data, result.serverData);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async fetchServerState(
    interviewId: string,
  ): Promise<ServerInterviewData | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT);

    try {
      const response = await fetch(`/api/interviews/${interviewId}/state`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as ServerInterviewData;
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  }

  private async handleConflict(
    interviewId: string,
    localData: InterviewData,
    serverData: ServerInterviewData,
  ): Promise<void> {
    await offlineDb.conflicts.add({
      interviewId,
      detectedAt: Date.now(),
      resolvedAt: null,
      localData: JSON.stringify(localData),
      serverData: JSON.stringify(serverData),
    });

    await offlineDb.interviews.update(interviewId, {
      syncStatus: 'conflict',
    });
  }

  private async reconcileTempId(
    tempId: string,
    serverId: string,
  ): Promise<void> {
    const interview = await offlineDb.interviews.get(tempId);

    if (!interview) {
      return;
    }

    await offlineDb.interviews.delete(tempId);
    await offlineDb.interviews.add({
      ...interview,
      id: serverId,
      isOfflineCreated: false,
    });

    await offlineDb.syncQueue
      .where('interviewId')
      .equals(tempId)
      .modify({ interviewId: serverId });

    postMessage({ type: 'INTERVIEW_SYNCED', tempId, realId: serverId });
  }

  private async removeFromSyncQueue(interviewId: string): Promise<void> {
    await offlineDb.syncQueue.where('interviewId').equals(interviewId).delete();
  }
}

export const syncManager = new SyncManager();
