import {
  type Stage,
  type VersionedProtocol,
} from '@codaco/protocol-validation';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { v4 } from 'uuid';
import type {
  ProtocolPayload,
  ResolvedAsset,
} from '~/lib/interviewer/contract/types';

type ProtocolState = ProtocolPayload;

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
    getShouldEncryptNames: (state) => {
      // experiments only exists in schema version 8+
      if (typeof state.schemaVersion === 'number' && state.schemaVersion >= 8) {
        const experiments = (
          state as Extract<VersionedProtocol, { schemaVersion: 8 }>
        ).experiments;
        return experiments?.encryptedVariables ?? false;
      }
      return false;
    },
    getCodebook: (state) => {
      // Both schema 7 and 8 have the same codebook structure, but we didn't
      // provide exhaustive typing for schema 7 before moving to schema 8.
      return state.codebook as Extract<
        VersionedProtocol,
        { schemaVersion: 8 }
      >['codebook'];
    },
    getStages: createSelector(
      [(state: ProtocolState) => state.stages],
      (stages) => [...((stages ?? []) as Stage[]), DefaultFinishStage as Stage],
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
            {} as Record<string, ResolvedAsset>,
          ) ?? {}
        );
      },
    ),
  },
});

// export selectors
export const {
  getShouldEncryptNames,
  getCodebook,
  getStages,
  getAssetManifest,
} = protocolSlice.selectors;

export default protocolSlice.reducer;
