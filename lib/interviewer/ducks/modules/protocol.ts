import { type Protocol, type Stage } from '@codaco/protocol-validation';
import { type Asset } from '@prisma/client';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { v4 } from 'uuid';

type ProtocolState = Pick<Protocol, 'codebook' | 'experiments' | 'stages'> & {
  id: string;
  assets?: Asset[];
};

const initialState = {} as ProtocolState;

const DefaultFinishStage = {
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
    getProtocolExperiments: (state) => state.experiments,
    getShouldEncryptNames: (state) => {
      return state.experiments?.encryptedVariables ?? false;
    },
    getCodebook: (state) => state.codebook,
    getStages: createSelector(
      [(state: ProtocolState) => state.stages],
      (stages) => [...(stages ?? []), DefaultFinishStage] as Stage[],
    ),
    getAssetManifest: createSelector(
      [(state: ProtocolState) => state.assets],
      (assets) => {
        if (!assets) {
          return {};
        }

        return (
          assets.reduce(
            (manifest, asset) => {
              manifest[asset.assetId] = asset;
              return manifest;
            },
            {} as Record<string, Asset>,
          ) ?? {}
        );
      },
    ),
    getAssetUrlFromId: createSelector(
      (state: ProtocolState) => state.assets,
      (manifest) => {
        return (id: string) => {
          if (!id) {
            return undefined;
          }
          const asset = manifest?.find((asset) => asset.assetId === id);
          if (!asset) {
            return undefined;
          }
          const { url, type } = asset;
          if (type === 'image') {
            return url;
          }
          if (type === 'video') {
            return url;
          }
          if (type === 'audio') {
            return url;
          }
          if (type === 'document') {
            return url;
          }
          if (type === 'other') {
            return url;
          }
          return undefined;
        };
      },
    ),
    getApiKeyAssetValue: (state) => (key: string) => {
      const manifest = protocolSlice.selectors.getAssetManifest(state);
      return manifest[key]?.value;
    },
  },
});

// export selectors
export const {
  getProtocol,
  getProtocolExperiments,
  getShouldEncryptNames,
  getCodebook,
  getStages,
  getAssetManifest,
  getAssetUrlFromId,
  getApiKeyAssetValue,
} = protocolSlice.selectors;

export default protocolSlice.reducer;
