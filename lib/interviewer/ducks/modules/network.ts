import { createSlice, createAction } from '@reduxjs/toolkit';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { reject, find, isMatch, omit, keys, get } from 'lodash';
import { v4 as uuid } from 'uuid';
import { SET_SERVER_SESSION } from './setServerSession';

// Property names passed to user worker scripts
export const primaryKeyPropertyForWorker = 'networkCanvasId';
export const nodeTypePropertyForWorker = 'networkCanvasType';

// Initial network model structure
export const initialState = {
  ego: {
    [entityPrimaryKeyProperty]: uuid(),
    [entityAttributesProperty]: {},
  },
  nodes: [],
  edges: [],
};

// Action creators
const addNode = createAction('ADD_NODE');
const updateEgo = createAction('UPDATE_EGO');
const batchAddNodes = createAction('BATCH_ADD_NODES');
const toggleNodeAttributes = createAction('TOGGLE_NODE_ATTRIBUTES');
const updateNode = createAction('UPDATE_NODE');
const removeNode = createAction('REMOVE_NODE');
const addNodeToPrompt = createAction('ADD_NODE_TO_PROMPT');
const removeNodeFromPrompt = createAction('REMOVE_NODE_FROM_PROMPT');
const addEdge = createAction('ADD_EDGE');
const updateEdge = createAction('UPDATE_EDGE');
const toggleEdge = createAction('TOGGLE_EDGE');
const removeEdge = createAction('REMOVE_EDGE');
const addSession = createAction('ADD_SESSION');

// Reducer
const networkReducer = createSlice({
  name: 'network',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(SET_SERVER_SESSION, (state, action) => {
        if (!action.payload.session.network) {
          return state;
        }
        return action.session.network;
      })
      .addCase(addNode, (state, action) => {
        // Handle ADD_NODE logic here
      })
      .addCase(updateEgo, (state, action) => {
        // Handle UPDATE_EGO logic here
      })
      .addCase(batchAddNodes, (state, action) => {
        // Handle BATCH_ADD_NODES logic here
      })
      .addCase(toggleNodeAttributes, (state, action) => {
        // Handle TOGGLE_NODE_ATTRIBUTES logic here
      })
      .addCase(updateNode, (state, action) => {
        // Handle UPDATE_NODE logic here
      })
      .addCase(removeNode, (state, action) => {
        // Handle REMOVE_NODE logic here
      })
      .addCase(addNodeToPrompt, (state, action) => {
        // Handle ADD_NODE_TO_PROMPT logic here
      })
      .addCase(removeNodeFromPrompt, (state, action) => {
        // Handle REMOVE_NODE_FROM_PROMPT logic here
      })
      .addCase(addEdge, (state, action) => {
        // Handle ADD_EDGE logic here
      })
      .addCase(updateEdge, (state, action) => {
        // Handle UPDATE_EDGE logic here
      })
      .addCase(toggleEdge, (state, action) => {
        // Handle TOGGLE_EDGE logic here
      })
      .addCase(removeEdge, (state, action) => {
        // Handle REMOVE_EDGE logic here
      })
      .addCase(addSession, (state, action) => {
        // Handle ADD_SESSION logic here
      });
  },
});

export const { reducer: networkReducer, actions } = networkSlice;

const {
  addNode,
  updateEgo,
  batchAddNodes,
  toggleNodeAttributes,
  updateNode,
  removeNode,
  addNodeToPrompt,
  removeNodeFromPrompt,
  addEdge,
  updateEdge,
  toggleEdge,
  removeEdge,
  addSession,
} = actions;

export {
  addNode,
  updateEgo,
  batchAddNodes,
  toggleNodeAttributes,
  updateNode,
  removeNode,
  addNodeToPrompt,
  removeNodeFromPrompt,
  addEdge,
  updateEdge,
  toggleEdge,
  removeEdge,
  addSession,
};
