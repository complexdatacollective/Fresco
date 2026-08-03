import { describe, expect, it, vi } from 'vitest';
import {
  type UploadedFile,
  uploadToUploadThingWithRetry,
} from '~/lib/uploadthing/uploadWithRetry';

const uploadedFiles: UploadedFile[] = [
  { key: 'key-1', url: 'https://ut/key-1', name: 'p.netcanvas', size: 10 },
];

const file = new File(['x'], 'p.netcanvas');
const NO_BACKOFF = [0, 0, 0];

describe('uploadToUploadThingWithRetry', () => {
  it('returns mapped files on first success', async () => {
    const startUpload = vi.fn().mockResolvedValue({
      done: () => Promise.resolve(uploadedFiles),
    });

    const result = await uploadToUploadThingWithRetry([file], undefined, {
      backoffMs: NO_BACKOFF,
      startUpload,
    });

    expect(result).toEqual(uploadedFiles);
    expect(startUpload).toHaveBeenCalledTimes(1);
  });

  it('retries after a failed attempt then succeeds', async () => {
    const startUpload = vi
      .fn()
      .mockResolvedValueOnce({
        done: () => Promise.reject(new Error('XHR failed 400')),
      })
      .mockResolvedValueOnce({ done: () => Promise.resolve(uploadedFiles) });

    const result = await uploadToUploadThingWithRetry([file], undefined, {
      backoffMs: NO_BACKOFF,
      startUpload,
    });

    expect(result).toEqual(uploadedFiles);
    expect(startUpload).toHaveBeenCalledTimes(2);
  });

  it('throws the last error after exhausting all attempts', async () => {
    const startUpload = vi.fn().mockResolvedValue({
      done: () => Promise.reject(new Error('XHR failed 400')),
    });

    await expect(
      uploadToUploadThingWithRetry([file], undefined, {
        backoffMs: NO_BACKOFF,
        startUpload,
      }),
    ).rejects.toThrow('XHR failed 400');
    expect(startUpload).toHaveBeenCalledTimes(3);
  });

  it('forwards aggregate progress', async () => {
    const startUpload = vi.fn(
      (_files: File[], onProgress: (p: number) => void) => {
        onProgress(42);
        return Promise.resolve({
          done: () => Promise.resolve(uploadedFiles),
        });
      },
    );
    const onProgress = vi.fn();

    await uploadToUploadThingWithRetry([file], onProgress, {
      backoffMs: NO_BACKOFF,
      startUpload,
    });

    expect(onProgress).toHaveBeenCalledWith(42);
  });
});
