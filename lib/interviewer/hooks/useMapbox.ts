import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getAssetUrlFromId } from '../selectors/protocol';

export const useMapboxToken = (tokenId: string) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const getAssetUrl = useSelector(getAssetUrlFromId);
  const assetUrl = getAssetUrl(tokenId) as string;

  if (!assetUrl) {
    throw new Error('No asset URL found for token ID');
  }

  useEffect(() => {
    const fetchTokenFile = async () => {
      try {
        const response = await fetch(assetUrl);
        if (!response.ok) {
          throw new Error('Error fetching the token file');
        }
        const tokenText = await response.text();
        setAccessToken(tokenText);
      } catch (error) {
        throw new Error('Error fetching the token file');
      }
    };

    void fetchTokenFile();
  }, [assetUrl, getAssetUrl, tokenId]);

  return accessToken;
};
