'use client';

import { useCallback } from 'react';
import type { PresignedUploadUrl } from '~/lib/storage/services/AssetStorage';

type UploadedFile = {
  key: string;
  url: string;
  name: string;
  size: number;
};

async function fetchPresignedUrls(
  files: { name: string; size: number }[],
): Promise<PresignedUploadUrl[]> {
  const response = await fetch('/api/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error ?? 'Failed to get upload URLs');
  }

  const data = (await response.json()) as { urls: PresignedUploadUrl[] };
  return data.urls;
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

export function useUploadAssets() {
  const uploadAssets = useCallback(
    async (
      files: File[],
      onProgress?: (progress: number) => void,
    ): Promise<UploadedFile[]> => {
      const fileMeta = files.map((f) => ({ name: f.name, size: f.size }));
      const presignedUrls = await fetchPresignedUrls(fileMeta);

      const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
      const loaded = new Array<number>(files.length).fill(0);

      const uploadPromises = files.map(async (file, index) => {
        const presigned = presignedUrls[index];
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
    },
    [],
  );

  return { uploadAssets };
}
