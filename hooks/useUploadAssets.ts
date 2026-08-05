'use client';

import { useCallback } from 'react';

import type { PresignedUploadUrl } from '~/lib/storage/services/AssetStorage';
import {
  type UploadedFile,
  uploadToUploadThingWithRetry,
} from '~/lib/uploadthing/uploadWithRetry';

type PresignResponse =
  | { provider: 's3'; urls: PresignedUploadUrl[] }
  | { provider: 'uploadthing' };

async function fetchPresignResponse(
  files: { name: string; size: number }[],
): Promise<PresignResponse> {
  const response = await fetch('/api/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? 'Failed to prepare upload');
  }

  return (await response.json()) as PresignResponse;
}

async function uploadFileToUrl(
  file: File,
  uploadUrl: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded, event.total);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${String(xhr.status)}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.send(file);
  });
}

async function uploadViaS3(
  files: File[],
  urls: PresignedUploadUrl[],
  onProgress?: (progress: number) => void,
): Promise<UploadedFile[]> {
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const loaded = Array.from<number>({ length: files.length }).fill(0);

  const uploadPromises = files.map(async (file, index) => {
    const presigned = urls[index];
    if (!presigned) {
      throw new Error(`No presigned URL for file: ${file.name}`);
    }

    await uploadFileToUrl(file, presigned.uploadUrl, (fileLoaded) => {
      loaded[index] = fileLoaded;
      if (onProgress) {
        const totalLoaded = loaded.reduce((sum, l) => sum + l, 0);
        const progress =
          totalBytes > 0 ? Math.round((totalLoaded / totalBytes) * 100) : 0;
        onProgress(progress);
      }
    });

    return {
      key: presigned.fileKey,
      url: presigned.publicUrl,
      name: file.name,
      size: file.size,
    };
  });

  return Promise.all(uploadPromises);
}

// The `assetRouter` route accepts at most 50 files per upload (see
// app/api/uploadthing/core.ts), and one huge request also risks timeouts, so
// larger imports are sent as sequential batches rather than rejected.
const UPLOADTHING_MAX_FILES_PER_UPLOAD = 50;

const totalSize = (files: File[]) => files.reduce((sum, f) => sum + f.size, 0);

async function uploadViaUploadThing(
  files: File[],
  onProgress?: (progress: number) => void,
): Promise<UploadedFile[]> {
  if (files.length <= UPLOADTHING_MAX_FILES_PER_UPLOAD) {
    return uploadToUploadThingWithRetry(files, onProgress);
  }

  const batches: File[][] = [];
  for (let i = 0; i < files.length; i += UPLOADTHING_MAX_FILES_PER_UPLOAD) {
    batches.push(files.slice(i, i + UPLOADTHING_MAX_FILES_PER_UPLOAD));
  }

  const batchBytes = batches.map(totalSize);
  const totalBytes = totalSize(files);
  // Percentage reported so far by each batch, so a batch's own progress can be
  // re-weighted by its share of the total bytes into a single overall figure.
  const batchProgress = Array.from<number>({ length: batches.length }).fill(0);

  const uploaded: UploadedFile[] = [];

  for (const [index, batch] of batches.entries()) {
    const results = await uploadToUploadThingWithRetry(batch, (progress) => {
      batchProgress[index] = progress;
      if (onProgress) {
        const loadedBytes = batchProgress.reduce(
          (sum, percent, i) => sum + ((batchBytes[i] ?? 0) * percent) / 100,
          0,
        );
        onProgress(
          totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : 0,
        );
      }
    });

    batchProgress[index] = 100;
    uploaded.push(...results);
  }

  return uploaded;
}

export function useUploadAssets() {
  const uploadAssets = useCallback(
    async (
      files: File[],
      onProgress?: (progress: number) => void,
    ): Promise<UploadedFile[]> => {
      const fileMeta = files.map((f) => ({ name: f.name, size: f.size }));
      const presign = await fetchPresignResponse(fileMeta);

      if (presign.provider === 'uploadthing') {
        return uploadViaUploadThing(files, onProgress);
      }

      return uploadViaS3(files, presign.urls, onProgress);
    },
    [],
  );

  return { uploadAssets };
}
