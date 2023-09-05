import { useState } from 'react';

import { DANGEROUS__uploadFiles } from 'uploadthing/client';
import type { FileRouter } from 'uploadthing/server';

import { useEvent } from './useEvent';
import useFetch from './useFetch';
import { OurFileRouter } from '../../app/api/uploadthing/core';

type EndpointMetadata = {
  slug: string;
  config: OurFileRouter;
}[];
const useEndpointMetadata = (endpoint: string) => {
  const { data } = useFetch<EndpointMetadata>('/api/uploadthing');

  // TODO: Log on errors in dev

  return data?.find((x) => x.slug === endpoint);
};

export const useUploadThing = <T extends string>({
  endpoint,
  onClientUploadComplete,
  onUploadError,
  onUploadBegin,
  onUploadProgress,
}: {
  endpoint: T;
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>,
  ) => void;
  onUploadError?: (e: Error) => void;
  onUploadBegin?: () => void;
  onUploadProgress?: (file: string, progress: number) => void;
}) => {
  const [isUploading, setUploading] = useState(false);

  const permittedFileInfo = useEndpointMetadata(endpoint);

  const startUpload = useEvent(async (files: File[]) => {
    setUploading(true);
    try {
      onUploadBegin?.();
      const res = await DANGEROUS__uploadFiles({
        endpoint,
        onUploadProgress: ({ file, progress }) => {
          onUploadProgress?.(file, progress);
        },
        files,
      });
      setUploading(false);
      onClientUploadComplete?.(res);
      return res;
    } catch (e) {
      setUploading(false);
      onUploadError?.(e as Error);
      return;
    }
  });
  return {
    startUpload,
    isUploading,
    permittedFileInfo,
  } as const;
};

export const generateReactHelpers = <TRouter extends FileRouter>() => {
  type TRouterKey = keyof TRouter extends string ? keyof TRouter : string;

  return {
    useUploadThing: useUploadThing<TRouterKey>,
    uploadFiles: DANGEROUS__uploadFiles<OurFileRouter>,
  } as const;
};

export type FullFile = {
  file: File;
  contents: string;
};
