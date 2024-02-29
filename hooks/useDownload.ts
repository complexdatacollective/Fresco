import { useCallback } from 'react';

export const useDownload = () => {
  const download = useCallback(
    async (url: string, nameWithExtension: string) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = nameWithExtension;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
      } catch (error) {
        throw new Error('Failed to download file');
      }
    },
    [],
  );

  return download;
};
