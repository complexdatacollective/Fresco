import { type Protocol, type Stage } from '@codaco/protocol-validation';
import { type Asset } from '@prisma/client';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { v4 } from 'uuid';
import { type RootState } from '../../store';

type ProtocolState = Partial<Protocol> & {
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
    getProtocolExperiments: (state: ProtocolState) => state.experiments,
    getCodebook: (state) => state.codebook,
    getStages: createSelector(
      [(state: ProtocolState) => state.stages, () => DefaultFinishStage],
      (stages, finishStage) => [...(stages ?? []), finishStage] as Stage[],
    ),
    getAssetManifest: createSelector(
      [(state: typeof initialState) => state.assets],
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
    getAssetUrlFromId: (state) => (id: string) => {
      const manifest = protocolSlice.selectors.getAssetManifest(state);
      return manifest[id]?.url;
    },
    getApiKeyAssetValue: (state) => (key: string) => {
      const manifest = protocolSlice.selectors.getAssetManifest(state);
      return manifest[key]?.value;
    },
  },
});

export const getShouldEncryptNames = createSelector(
  [(state: RootState) => state.protocol.experiments],
  (experiments) => {
    console.log('getShouldEncryptNames', experiments);
    return experiments?.encryptNames ?? false;
  },
);

// export selectors
export const {
  getProtocol,
  getProtocolExperiments,
  getCodebook,
  getStages,
  getAssetManifest,
  getAssetUrlFromId,
  getApiKeyAssetValue,
} = protocolSlice.selectors;

export default protocolSlice.reducer;
