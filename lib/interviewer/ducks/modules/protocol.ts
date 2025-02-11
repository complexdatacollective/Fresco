import { type Asset } from '@prisma/client';
import { createSlice } from '@reduxjs/toolkit';
import { type ProtocolWithAssets } from '~/actions/interviews';

const initialState = {} as ProtocolWithAssets;

const protocolSlice = createSlice({
  name: 'protocol',
  initialState,
  reducers: {},
  selectors: {
    getProtocol: (state) => state,
    getAssetManifest: (state) =>
      state.assets.reduce(
        (manifest, asset) => {
          manifest[asset.assetId] = asset;
          return manifest;
        },
        {} as Record<string, Asset>,
      ) ?? {},
    getAssetUrlFromId: (state) => (id: string) => {
      const manifest = protocolSlice.selectors.getAssetManifest(state);
      return manifest[id]?.url;
    },
  },
});

// export selectors
export const getProtocol = protocolSlice.selectors.getProtocol;

export default protocolSlice;
