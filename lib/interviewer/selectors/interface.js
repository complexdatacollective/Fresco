/* eslint-disable import/prefer-default-export */

import { createSelector } from 'reselect';
import { filter, includes, intersection } from 'lodash';
import { assert } from './utils';
import { getProtocolCodebook } from './protocol';
import { getNetwork, getNetworkEdges, getNetworkNodes } from './network';
import { makeGetSessionStageSubject } from './session';
import { getPromptOtherVariable, getStageSubject, stagePromptIds, getPropPromptId, getPromptVariable } from './prop';

// Selectors that are generic between interfaces

/*
These selectors assume the following props:
  stage: which contains the protocol config for the stage
  prompt: which contains the protocol config for the prompt
*/


const nodeTypeIsDefined = (codebook, nodeType) => {
  if (!codebook) { return false; }
  return codebook.node[nodeType];
};

// TODO: Once schema validation is in place, we don't need these asserts.
export const getSubjectType = createSelector(
  getProtocolCodebook,
  getStageSubject,
  (codebook, subject) => {
    assert(subject, 'The "subject" property is not defined for this prompt');
    assert(nodeTypeIsDefined(codebook, subject.type), `Node type "${subject.type}" is not defined in the registry`);
    return subject && subject.type;
  },
);

export const getNodeVariables = createSelector(
  getProtocolCodebook,
  getSubjectType,
  (codebook, nodeType) => {
    const nodeInfo = codebook.node;
    return nodeInfo && nodeInfo[nodeType] && nodeInfo[nodeType].variables;
  },
)

export const makeGetNodeVariables = () => getNodeVariables;

export const makeGetVariableOptions = (includeOtherVariable = false) => createSelector(
  getNodeVariables, getPromptVariable, getPromptOtherVariable,
  (
    nodeVariables,
    promptVariable,
    [promptOtherVariable, promptOtherOptionLabel, promptOtherVariablePrompt],
  ) => {
    const optionValues = nodeVariables[promptVariable].options || [];
    const otherValue = {
      label: promptOtherOptionLabel,
      value: null,
      otherVariablePrompt: promptOtherVariablePrompt,
      otherVariable: promptOtherVariable,
    };

    return includeOtherVariable && promptOtherVariable
      ? [...optionValues, otherValue]
      : optionValues;
  },
);

/**
 * makeNetworkEdgesForType()
 * Get the current prompt/stage subject, and filter the network by this edge type.
*/

export const makeNetworkEdgesForType = () => createSelector(
  getNetworkEdges,
  getStageSubject,
  (edges, subject) => filter(edges, ['type', subject.type]),
);

/**
 * makeNetworkEntitiesForType()
 * Get the current prompt/stage subject, and filter the network by this entity type.
*/
export const makeNetworkEntitiesForType = () => createSelector(
  getNetwork,
  makeGetSessionStageSubject(),
  (network, subject) => {
    if (!subject || !network) {
      return [];
    }
    if (subject.entity === 'node') {
      return filter(network.nodes, ['type', subject.type]);
    }
    if (subject.entity === 'edge') {
      return filter(network.edges, ['type', subject.type]);
    }
    return [network.ego];
  },
);

/**
 * makeNetworkNodesForType()
 * Get the current prompt/stage subject, and filter the network by this node type.
*/

const getNetworkNodesForType = createSelector(
  getNetworkNodes,
  getStageSubject,
  (nodes, subject) => filter(nodes, ['type', subject.type]),
);

export const makeNetworkNodesForType = () => getNetworkNodesForType;

// makeNetworkNodesForStage()
export const getStageNodeCount = createSelector(
  getNetworkNodesForType,
  stagePromptIds,
  (nodes, promptIds) => filter(
    nodes, (node) => intersection(node.promptIDs, promptIds).length > 0,
  ).length,
);

export const makeGetStageNodeCount = () => {
  const getNetworkNodesForSubject = makeNetworkNodesForType();

  return createSelector(
    getNetworkNodesForSubject, stagePromptIds,
    (nodes, promptIds) => filter(
      nodes, (node) => intersection(node.promptIDs, promptIds).length > 0,
    ).length,
  );
};

/**
 * makeNetworkNodesForPrompt
 *
 * Return a filtered node list containing only nodes where node IDs contains the current promptId.
*/

export const getNetworkNodesForPrompt = createSelector(
  getNetworkNodesForType,
  getPropPromptId,
  (nodes, promptId) => filter(nodes, (node) => includes(node.promptIDs, promptId)),
)

export const makeNetworkNodesForPrompt = () => getNetworkNodesForPrompt;

/**
 * makeNetworkNodesForOtherPrompts()
 *
 * Same as above, except returns a filtered node list that **excludes** nodes that match the current
 * prompt's promptId.
*/

export const makeNetworkNodesForOtherPrompts = () => {
  const getNetworkNodesForSubject = makeNetworkNodesForType();

  return createSelector(
    getNetworkNodesForSubject, getPropPromptId,
    (nodes, promptId) => filter(nodes, (node) => !includes(node.promptIDs, promptId)),
  );
};
