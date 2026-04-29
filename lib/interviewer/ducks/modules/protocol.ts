import { type Stage } from '@codaco/protocol-validation';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { v4 } from 'uuid';
import type { ProtocolPayload } from '~/lib/interviewer/contract/types';

type ProtocolState = ProtocolPayload;

const initialState = {} as ProtocolState;

// FinishSession is a UI sentinel appended to every interview's stage list;
// it is not part of the protocol schema, so it has no Stage variant. The
// cast at the use site below bridges it into the Stage union expected
// downstream — runtime consumers branch on `stage.type === 'FinishSession'`.
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
    getShouldEncryptNames: (state) =>
      state.experiments?.encryptedVariables ?? false,
    getCodebook: (state) => state.codebook,
    getStages: createSelector(
      [(state: ProtocolState) => state.stages],
      (stages) => [...(stages ?? []), DefaultFinishStage as Stage],
    ),
    getAssetManifest: createSelector(
      [(state: ProtocolState) => state.assets],
      (assets) =>
        assets ? Object.fromEntries(assets.map((a) => [a.assetId, a])) : {},
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
