import { chunk } from 'es-toolkit';
import { zip } from 'fflate';
import type { ExportOptions } from '@codaco/network-exporters/options';
import { consumeBatchStream } from '~/lib/export/streamProtocol';

export const EXPORT_BATCH_SIZE = 200;
const EXPORT_CONCURRENCY = 3;
export const EXPORT_BATCH_RETRIES = 2;

const BATCH_ENDPOINT = '/api/export-interviews/batch';

type BatchExportResult = {
  blob: Blob;
  exportedIds: string[];
  failedIds: string[];
};

function abortError(): DOMException {
  return new DOMException('The export was aborted.', 'AbortError');
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function backoffDelay(attempt: number, signal: AbortSignal): Promise<void> {
  const ms = 500 * 2 ** attempt;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function fetchBatchWithRetry(
  interviewIds: string[],
  exportOptions: ExportOptions,
  signal: AbortSignal,
): Promise<{
  files: Map<string, Uint8Array<ArrayBuffer>>;
  failedSessionIds: string[];
}> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= EXPORT_BATCH_RETRIES; attempt++) {
    if (signal.aborted) throw abortError();
    try {
      const res = await fetch(BATCH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewIds, exportOptions }),
        signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(
          `Export batch failed with status ${String(res.status)}`,
        );
      }
      return await consumeBatchStream(res.body, () => undefined);
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
      if (attempt < EXPORT_BATCH_RETRIES) await backoffDelay(attempt, signal);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Export batch failed');
}

function zipAsync(
  files: Record<string, Uint8Array>,
): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    zip(files, { level: 6 }, (error, data) =>
      error ? reject(error) : resolve(data),
    );
  });
}

/**
 * Orchestrates a batched export entirely client-side: bounded per-batch
 * requests (with retry), first-wins dedup of shared files, then one zip in the
 * browser. The single zip means each server request stays small, so a large
 * export never approaches the serverless time/memory limit.
 */
export async function runBatchedExport(
  interviewIds: string[],
  exportOptions: ExportOptions,
  signal: AbortSignal,
  onProgress: (completed: number, total: number) => void,
): Promise<BatchExportResult> {
  const ids = [...new Set(interviewIds)];
  const total = ids.length;
  if (signal.aborted) throw abortError();

  const batches = chunk(ids, EXPORT_BATCH_SIZE);
  const files = new Map<string, Uint8Array<ArrayBuffer>>();
  const failedIds = new Set<string>();
  let completed = 0;

  // Abort sibling batches as soon as one fails, and propagate external cancel.
  const internal = new AbortController();
  const onExternalAbort = () => internal.abort();
  signal.addEventListener('abort', onExternalAbort, { once: true });

  let cursor = 0;
  const worker = async () => {
    for (;;) {
      if (internal.signal.aborted) throw abortError();
      const index = cursor++;
      if (index >= batches.length) return;
      const batch = batches[index]!;
      const { files: batchFiles, failedSessionIds } = await fetchBatchWithRetry(
        batch,
        exportOptions,
        internal.signal,
      );
      for (const [name, bytes] of batchFiles) {
        if (!files.has(name)) files.set(name, bytes);
      }
      for (const id of failedSessionIds) failedIds.add(id);
      completed += batch.length;
      onProgress(completed, total);
    }
  };

  try {
    const workerCount = Math.min(EXPORT_CONCURRENCY, batches.length || 1);
    // First failure aborts the siblings. Collect every outcome (rather than
    // Promise.all, which rejects with whichever rejection lands first) so we can
    // surface the genuine batch error instead of a sibling's by-product
    // AbortError.
    const outcomes = await Promise.allSettled(
      Array.from({ length: workerCount }, () =>
        worker().catch((error: unknown) => {
          internal.abort();
          throw error;
        }),
      ),
    );
    if (signal.aborted) throw abortError();
    const genuineFailure = outcomes.find(
      (outcome): outcome is PromiseRejectedResult =>
        outcome.status === 'rejected' && !isAbortError(outcome.reason),
    );
    if (genuineFailure) throw genuineFailure.reason;
    const aborted = outcomes.find(
      (outcome): outcome is PromiseRejectedResult =>
        outcome.status === 'rejected',
    );
    if (aborted) throw aborted.reason;
  } finally {
    signal.removeEventListener('abort', onExternalAbort);
  }

  const filesObject: Record<string, Uint8Array> = Object.fromEntries(files);
  const zipped = await zipAsync(filesObject);
  const blob = new Blob([zipped], { type: 'application/zip' });
  const exportedIds = ids.filter((id) => !failedIds.has(id));
  return { blob, exportedIds, failedIds: [...failedIds] };
}
