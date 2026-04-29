'use client';

import { useEffect, useState } from 'react';
import { useContractHandlers } from '~/lib/interviewer/contract/context';

type AssetUrlState = {
  url: string | null;
  isLoading: boolean;
  error: Error | null;
};

export function useAssetUrl(assetId: string | undefined): AssetUrlState {
  const { onRequestAsset } = useContractHandlers();
  const [state, setState] = useState<AssetUrlState>({
    url: null,
    isLoading: Boolean(assetId),
    error: null,
  });

  useEffect(() => {
    if (!assetId) {
      setState({ url: null, isLoading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ url: null, isLoading: true, error: null });

    onRequestAsset(assetId)
      .then((url) => {
        if (!cancelled) setState({ url, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            url: null,
            isLoading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
      });

    return () => {
      cancelled = true;
    };
  }, [assetId, onRequestAsset]);

  return state;
}
