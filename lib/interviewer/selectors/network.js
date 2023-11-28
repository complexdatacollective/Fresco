import { findKey, find, get } from 'lodash';
import { getActiveSession, getStageSubjectType } from './session';
import { createDeepEqualSelector } from './utils';
import { getProtocolCodebook } from './protocol';
import { getEntityAttributes } from '../ducks/modules/network';
import customFilter from '~/lib/network-query/filter';
import { createSelector } from '@reduxjs/toolkit';
import { getStageSubject } from './prop';

export const getNetwork = createSelector(
  getActiveSession,
  // Todo - this shouldn't have a default value. 
  (session) => (session && session.network) || { nodes: [], edges: [], ego: {} },
);

export const getPropStageFilter = (_, props) => props && props.stage && props.stage.filter;

// Filtered network
export const getFilteredNetwork = createSelector(
  getNetwork,
  getPropStageFilter,
  (network, nodeFilter) => {
    if (nodeFilter && typeof nodeFilter !== 'function') {
      const filterFunction = customFilter(nodeFilter);
      return filterFunction(network);
    }
    return network;
  },
);

export const getNetworkNodes = createSelector(
  getFilteredNetwork,
  (network) => network.nodes,
);

export const getNetworkEgo = createSelector(
  getFilteredNetwork,
  (network) => network.ego,
);

export const getNetworkEdges = createSelector(
  getFilteredNetwork,
  (network) => network.edges,
);

export const getNodeTypeDefinition = createSelector(
  getProtocolCodebook,
  getStageSubject,
  (codebook, { type }) => {
    const nodeDefinitions = codebook && codebook.node;
    return nodeDefinitions && nodeDefinitions[type];
  }
)

// The user-defined name of a node type; e.g. `codebook.node[uuid].name == 'person'`
export const makeGetNodeTypeDefinition = () => getNodeTypeDefinition;

// See: https://github.com/complexdatacollective/Network-Canvas/wiki/Node-Labeling
export const labelLogic = (codebookForNodeType, nodeAttributes) => {
  // 1. In the codebook for the stage's subject, look for a variable with a name
  // property of "name", and try to retrieve this value by key in the node's
  // attributes
  const variableCalledName = codebookForNodeType
    && codebookForNodeType.variables
    // Ignore case when looking for 'name'
    && findKey(codebookForNodeType.variables, (variable) => variable.name.toLowerCase() === 'name');

  if (variableCalledName && nodeAttributes[variableCalledName]) {
    return nodeAttributes[variableCalledName];
  }

  // 2. Look for a property on the node with a key of ‘name’, and try to retrieve this
  // value as a key in the node's attributes.
  // const nodeVariableCalledName = get(nodeAttributes, 'name');

  const nodeVariableCalledName = find(
    nodeAttributes,
    (_, key) => key.toLowerCase() === 'name',
  );

  if (nodeVariableCalledName) {
    return nodeVariableCalledName;
  }

  // 3. Last resort!
  return 'No \'name\' variable!';
};

const getNodeLabel = createSelector(
  getNodeTypeDefinition,
  (nodeTypeDefinition) => (node) => labelLogic(nodeTypeDefinition, getEntityAttributes(node)),
)

// Gets the node label variable and returns its value, or "No label".
// See: https://github.com/complexdatacollective/Network-Canvas/wiki/Node-Labeling
export const makeGetNodeLabel = () => getNodeLabel

const getType = (_, props) => props.type;

export const getNodeColorSelector = createSelector(
  getProtocolCodebook,
  getType,
  (codebook, nodeType) => {
    const nodeDefinitions = codebook.node;
    const nodeColor = get(nodeDefinitions, [nodeType, 'color'], 'node-color-seq-1');
    return nodeColor;
  },
)

export const makeGetNodeColor = () => getNodeColorSelector;

// Pure state selector variant of makeGetNodeColor
export const getNodeColor = (nodeType) => (state) => getNodeColorSelector(state, { type: nodeType });

export const getNodeTypeLabel = (nodeType) => (state) => {
  const codebook = getProtocolCodebook(state);
  const nodeDefinitions = codebook.node;
  const nodeLabel = get(nodeDefinitions, [nodeType, 'name'], '');
  return nodeLabel;
};

export const makeGetEdgeLabel = () => createDeepEqualSelector(
  getProtocolCodebook,
  (_, props) => props.type,
  (codebook, edgeType) => {
    const edgeInfo = codebook.edge;
    const edgeLabel = get(edgeInfo, [edgeType, 'name'], '');
    return edgeLabel;
  },
);

export const makeGetEdgeColor = () => createDeepEqualSelector(
  getProtocolCodebook,
  (_, props) => props.type,
  (codebook, edgeType) => {
    const edgeInfo = codebook.edge;
    const edgeColor = get(edgeInfo, [edgeType, 'color'], 'edge-color-seq-1');
    return edgeColor;
  },
);

export const makeGetNodeAttributeLabel = () => createDeepEqualSelector(
  getProtocolCodebook,
  getStageSubjectType(),
  (_, props) => props.variableId,
  (codebook, subjectType, variableId) => {
    const nodeDefinitions = codebook.node;
    const variables = get(nodeDefinitions, [subjectType, 'variables'], {});
    const attributeLabel = get(variables, [variableId, 'name'], variableId);
    return attributeLabel;
  },
);

export const makeGetCategoricalOptions = () => createDeepEqualSelector(
  (state, props) => getProtocolCodebook(state, props),
  getStageSubjectType(),
  (_, props) => props.variableId,
  (codebook, subjectType, variableId) => {
    const nodeDefinitions = codebook.node;
    const variables = get(nodeDefinitions, [subjectType, 'variables'], {});
    const options = get(variables, [variableId, 'options'], []);
    return options;
  },
);
