import { type Stage } from '@codaco/protocol-validation';
import { type Asset } from '@prisma/client';
import { createSlice } from '@reduxjs/toolkit';
import { v4 } from 'uuid';
import { type ProtocolWithAssets } from '~/actions/interviews';

const initialState = {} as ProtocolWithAssets;

const DefaultFinishStage = {
  // `id` is used as component key; must be unique from user input
  id: v4(),
  type: 'FinishSession',
  label: 'Finish Interview',
};

const protocolSlice = createSlice({
  name: 'protocol',
  initialState,
  reducers: {},
  selectors: {
    getProtocol: (state) => state,
    getCodebook: (state) => state.codebook,
    getStages: (state) =>
      [...(state.stages ?? []), DefaultFinishStage] as Stage[],
    getAssetManifest: (state) =>
      state.assets.reduce(
        (manifest, asset) => {
          manifest[asset.assetId] = asset;
          return manifest;
        },
        {} as Record<string, Asset>,
      ) ?? {},
    getAssetUrlFromId: (state) => (id: string) => {
      const manifest = protocolSlice.selectors.getAssetManifest({
        protocol: state,
      });
      return manifest[id]?.url;
    },
    getApiKeyAssetValue: (state) => (key: string) => {
      const manifest = protocolSlice.selectors.getAssetManifest({
        protocol: state,
      });
      return manifest[key]?.value;
    },
  },
});

// export selectors
export const {
  getProtocol,
  getCodebook,
  getStages,
  getAssetManifest,
  getAssetUrlFromId,
  getApiKeyAssetValue,
} = protocolSlice.selectors;

export default protocolSlice;
