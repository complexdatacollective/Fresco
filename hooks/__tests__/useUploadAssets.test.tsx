import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { UploadedFile } from '~/lib/uploadthing/uploadWithRetry';

const { uploadToUploadThingWithRetry } = vi.hoisted(() => ({
  uploadToUploadThingWithRetry:
    vi.fn<
      (
        files: File[],
        onProgress?: (progress: number) => void,
      ) => Promise<UploadedFile[]>
    >(),
}));

vi.mock('~/lib/uploadthing/uploadWithRetry', () => ({
  uploadToUploadThingWithRetry,
}));

import { useUploadAssets } from '~/hooks/useUploadAssets';

const makeFiles = (count: number, bytes = 10) =>
  Array.from(
    { length: count },
    (_, i) => new File(['x'.repeat(bytes)], `${String(i)}.png`),
  );

function mockPresign() {
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ provider: 'uploadthing' }),
    } as Response),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useUploadAssets (UploadThing batching)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('sends a single upload when within the route file limit', async () => {
    mockPresign();
    uploadToUploadThingWithRetry.mockResolvedValue([]);

    const { result } = renderHook(() => useUploadAssets());
    await result.current.uploadAssets(makeFiles(50));

    expect(uploadToUploadThingWithRetry).toHaveBeenCalledTimes(1);
    expect(uploadToUploadThingWithRetry.mock.calls[0]?.[0]).toHaveLength(50);
  });

  test('splits larger imports into batches of at most 50 and preserves order', async () => {
    mockPresign();
    uploadToUploadThingWithRetry.mockImplementation((files) =>
      Promise.resolve(
        files.map((file) => ({
          key: `key-${file.name}`,
          url: `url-${file.name}`,
          name: file.name,
          size: file.size,
        })),
      ),
    );

    const { result } = renderHook(() => useUploadAssets());
    const uploaded = await result.current.uploadAssets(makeFiles(120));

    expect(uploadToUploadThingWithRetry).toHaveBeenCalledTimes(3);
    expect(
      uploadToUploadThingWithRetry.mock.calls.map((call) => call[0].length),
    ).toEqual([50, 50, 20]);
    expect(uploaded.map((file) => file.name)).toEqual(
      makeFiles(120).map((file) => file.name),
    );
  });

  test('reports overall progress weighted across batches', async () => {
    mockPresign();
    const progressValues: number[] = [];

    uploadToUploadThingWithRetry.mockImplementation((files, onProgress) => {
      onProgress?.(50);
      onProgress?.(100);
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useUploadAssets());
    await result.current.uploadAssets(makeFiles(100), (progress) => {
      progressValues.push(progress);
    });

    // Two equally sized batches: the first batch's 50% and 100% are half of the
    // overall total, and the second batch completes the bar.
    expect(progressValues).toEqual([25, 50, 75, 100]);
  });
});
