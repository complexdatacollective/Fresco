import { unzipSync } from 'fflate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ExportOptions } from '@codaco/network-exporters/options';
import {
  EXPORT_BATCH_RETRIES,
  EXPORT_BATCH_SIZE,
  runBatchedExport,
} from '~/lib/export/runBatchedExport';
import { encodeExportEvent } from '~/lib/export/streamProtocol';

// A valid ExportOptions value; the actual contents are irrelevant because fetch
// is mocked (it is only JSON-serialized into the request body).
const exportOptions: ExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    useScreenLayoutCoordinates: false,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

function sseResponse(events: Parameters<typeof encodeExportEvent>[0][]) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) controller.enqueue(encodeExportEvent(event));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

const b64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');

function fileBatch(
  name: string,
  bytes: number[],
  failedSessionIds: string[] = [],
) {
  return sseResponse([
    { type: 'file-open', name },
    { type: 'file-chunk', b64: b64(bytes) },
    { type: 'file-close' },
    { type: 'complete', failedSessionIds },
  ]);
}

afterEach(() => vi.restoreAllMocks());

describe('runBatchedExport', () => {
  it('zips files collected across batches, deduping shared files first-wins', async () => {
    const ids = Array.from(
      { length: EXPORT_BATCH_SIZE + 1 },
      (_, i) => `id${i}`,
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        sseResponse([
          { type: 'file-open', name: 'shared.txt' },
          { type: 'file-chunk', b64: b64([1]) },
          { type: 'file-close' },
          { type: 'file-open', name: 'a.txt' },
          { type: 'file-chunk', b64: b64([10]) },
          { type: 'file-close' },
          { type: 'complete', failedSessionIds: [] },
        ]),
      )
      .mockResolvedValueOnce(
        sseResponse([
          { type: 'file-open', name: 'shared.txt' },
          { type: 'file-chunk', b64: b64([2]) },
          { type: 'file-close' },
          { type: 'file-open', name: 'b.txt' },
          { type: 'file-chunk', b64: b64([20]) },
          { type: 'file-close' },
          { type: 'complete', failedSessionIds: [] },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    const progress: [number, number][] = [];
    const { blob, exportedIds, failedIds } = await runBatchedExport(
      ids,
      exportOptions,
      new AbortController().signal,
      (completed, total) => progress.push([completed, total]),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const entries = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    expect(Object.keys(entries).sort()).toEqual([
      'a.txt',
      'b.txt',
      'shared.txt',
    ]);
    expect(Array.from(entries['shared.txt']!)).toEqual([1]); // first-wins
    expect(failedIds).toEqual([]);
    expect(exportedIds).toEqual(ids);
    expect(progress.at(-1)).toEqual([ids.length, ids.length]);
  });

  it('retries a failing batch then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockResolvedValueOnce(fileBatch('a.txt', [7]));
    vi.stubGlobal('fetch', fetchMock);

    const { exportedIds } = await runBatchedExport(
      ['id0'],
      exportOptions,
      new AbortController().signal,
      () => undefined,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(exportedIds).toEqual(['id0']);
  });

  it('rejects after exhausting retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('nope', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      runBatchedExport(
        ['id0'],
        exportOptions,
        new AbortController().signal,
        () => undefined,
      ),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(EXPORT_BATCH_RETRIES + 1);
  });

  it('excludes failed session ids from exportedIds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fileBatch('a.txt', [1], ['id1']));
    vi.stubGlobal('fetch', fetchMock);

    const { exportedIds, failedIds } = await runBatchedExport(
      ['id0', 'id1'],
      exportOptions,
      new AbortController().signal,
      () => undefined,
    );
    expect(failedIds).toEqual(['id1']);
    expect(exportedIds).toEqual(['id0']);
  });

  it('aborts when the signal is already aborted', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();

    await expect(
      runBatchedExport(
        ['id0'],
        exportOptions,
        controller.signal,
        () => undefined,
      ),
    ).rejects.toThrow(/abort/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
