import {
  type Stage,
  type VersionedProtocol,
} from '@codaco/protocol-validation';
import { type Asset } from '~/lib/db/generated/client';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { v4 } from 'uuid';
import { type GetInterviewByIdQuery } from '~/queries/interviews';
import { type Serialize } from '~/utils/serializeHelpers';

// Redux stores dates as ISO strings to ensure serializability
type ProtocolState = Serialize<NonNullable<GetInterviewByIdQuery>['protocol']>;

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
      if (state.schemaVersion >= 8) {
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
          return asset.url || undefined;
        };
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
  getAssetUrlFromId,
} = protocolSlice.selectors;

export default protocolSlice.reducer;
