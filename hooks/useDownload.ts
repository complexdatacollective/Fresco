import { useCallback } from 'react';

export const useDownload = () => {
  const download = useCallback((url: string, nameWithExtension: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = nameWithExtension;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return download;
};
