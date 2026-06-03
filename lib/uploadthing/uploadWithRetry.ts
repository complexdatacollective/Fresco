import { createUpload } from '~/lib/uploadthing/client-helpers';
import { ensureError } from '~/utils/ensureError';

export type UploadedFile = {
  key: string;
  url: string;
  name: string;
  size: number;
};

type AssetUploadHandle = {
  done: () => Promise<UploadedFile[]>;
};

type StartAssetUpload = (
  files: File[],
  onProgress: (totalProgress: number) => void,
) => Promise<AssetUploadHandle>;

// Delay (ms) applied before attempt index N. Index 0 (first attempt) never
// waits. Length determines the number of attempts.
const DEFAULT_BACKOFF_MS = [0, 2000, 5000];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Default uploader: drives UploadThing's resumable `createUpload` and maps the
// SDK result to the app's `UploadedFile` shape. `createUpload`'s
// `onUploadProgress` reports `totalProgress` (overall bytes across the batch),
// which avoids the per-file progress overwrites that made the bar jump.
const startAssetUpload: StartAssetUpload = async (files, onProgress) => {
  const { done } = await createUpload('assetRouter', {
    files,
    onUploadProgress: ({ totalProgress }) => onProgress(totalProgress),
  });

  return {
    done: async () => {
      const results = await done();
      return results.map((result) => ({
        key: result.key,
        url: result.ufsUrl,
        name: result.name,
        size: result.size,
      }));
    },
  };
};

/**
 * Uploads files to UploadThing via the resumable `createUpload` API, retrying
 * the whole upload on failure. UploadThing's single-PUT upload has no built-in
 * retry, so a transient ingest rejection (observed as `XHR failed 400` on large
 * files) would otherwise abort the import permanently.
 */
export async function uploadToUploadThingWithRetry(
  files: File[],
  onProgress?: (progress: number) => void,
  options: { backoffMs?: number[]; startUpload?: StartAssetUpload } = {},
): Promise<UploadedFile[]> {
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;
  const startUpload = options.startUpload ?? startAssetUpload;
  let lastError: Error = new Error('Upload failed');

  for (let attempt = 0; attempt < backoffMs.length; attempt++) {
    const delay = backoffMs[attempt] ?? 0;
    if (attempt > 0 && delay > 0) {
      await wait(delay);
    }

    try {
      const { done } = await startUpload(files, (progress) =>
        onProgress?.(progress),
      );
      return await done();
    } catch (error) {
      lastError = ensureError(error);
    }
  }

  throw lastError;
}
