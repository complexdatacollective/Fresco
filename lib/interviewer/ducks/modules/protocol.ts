import { type Asset } from '@prisma/client';
import { createSlice } from '@reduxjs/toolkit';
import { setServerSession, type ProtocolWithAssets } from './setServerSession';

const initialState = {} as ProtocolWithAssets;

// export default createReducer(initialState, (builder) => {
//   builder.addCase(setServerSession, (_state, action) => {
//     return action.payload.protocol;
//   });

//   builder.addDefaultCase((_state, _action) => {
//     return initialState;
//   });
// });

const protocolSlice = createSlice({
  name: 'protocol',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(setServerSession, (_state, action) => {
      return action.payload.protocol;
    });
  },
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
