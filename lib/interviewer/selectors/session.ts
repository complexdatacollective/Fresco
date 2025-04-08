import type {
  Codebook,
  NodeDefinition,
  Stage,
  StageSubject,
} from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  entityAttributesProperty,
  type NcNetwork,
  type NcNode,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { intersection } from 'es-toolkit';
import { filter, findKey, includes } from 'es-toolkit/compat';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import customFilter from '~/lib/network-query/filter';
import { getCodebook, getStages } from '../ducks/modules/protocol';
import { type RootState } from '../store';
import { getStageSubject, getSubjectType, stagePromptIds } from './prop';
import { calculateProgress } from './utils';

export const getActiveSession = (state: RootState) => {
  return state.session;
};

export const getStageIndex = (state: RootState) => state.session.currentStep;

export const getStageMetadata = createSelector(
  getActiveSession,
  getStageIndex,
  (session, stageIndex) => {
    if (!stageIndex) return undefined;
    return session?.stageMetadata?.[stageIndex] ?? undefined;
  },
);

export const getCurrentStage = createSelector(
  getStages,
  getStageIndex,
  (stages, currentStep) => {
    if (currentStep === null) return null;
    const result = stages[currentStep];

    if (!result) {
      return null;
    }

    return result;
  },
);

export const getCurrentStageId = createSelector(
  getCurrentStage,
  (currentStage) => {
    if (!currentStage) return null;
    return currentStage.id;
  },
);

export const getPromptIndex = createSelector(
  getActiveSession,
  (session) => session?.promptIndex ?? 0,
);

export const getPrompts = createSelector(getCurrentStage, (stage) => {
  if (!stage) {
    return null;
  }

  if ('prompts' in stage) {
    return stage.prompts;
  }

  return null;
});

export const getPromptCount = createSelector(
  getPrompts,
  (prompts) => prompts?.length ?? 1, // If there are no prompts we have "1" prompt
);

const getIsFirstPrompt = createSelector(
  getPromptIndex,
  (promptIndex) => promptIndex === 0,
);

const getIsLastPrompt = createSelector(
  getPromptIndex,
  getPromptCount,
  (promptIndex, promptCount) => promptIndex === promptCount - 1,
);

const getIsFirstStage = createSelector(
  getStageIndex,
  (currentStep) => currentStep === 0,
);

const getIsLastStage = createSelector(
  getStageIndex,
  getStages,
  (currentStep, stages) => currentStep === stages.length - 1,
);

export const getStageCount = createSelector(getStages, (stages) => stages.length);

const getSessionProgress = createSelector(
  getStageIndex,
  getStageCount,
  getPromptIndex,
  getPromptCount,
  calculateProgress,
);

export const getNavigationInfo = createSelector(
  getSessionProgress,
  getStageIndex,
  getPromptIndex,
  getIsFirstPrompt,
  getIsLastPrompt,
  getIsFirstStage,
  getIsLastStage,
  (
    progress,
    currentStep,
    promptIndex,
    isFirstPrompt,
    isLastPrompt,
    isFirstStage,
    isLastStage,
  ) => {
    return {
      progress,
      currentStep,
      promptIndex,
      isFirstPrompt,
      isLastPrompt,
      isFirstStage,
      isLastStage,
      canMoveForward: !(isLastPrompt && isLastStage),
      canMoveBackward: !(isFirstPrompt && isFirstStage),
    };
  },
);

export const getNetwork = createSelector(
  getActiveSession,
  (session) => session?.network,
);

const getPropStageFilter = (_: unknown, props?: { stage: Stage }) =>
  props?.stage.filter ?? null;

type FilterFunction = (network: NcNetwork) => NcNetwork;

// Filtered network
const getFilteredNetwork = createSelector(
  getNetwork,
  getPropStageFilter,
  (network, nodeFilter) => {
    if (!network) {
      return null;
    }

    if (nodeFilter) {
      const filterFunction: FilterFunction = customFilter(nodeFilter);
      return filterFunction(network);
    }

    return network;
  },
);

export const getNetworkNodes = createSelector(
  getFilteredNetwork,
  (network) => network?.nodes ?? [],
);

export const getNetworkEgo = createSelector(
  getFilteredNetwork,
  (network) => network?.ego ?? null,
);

export const getEgoAttributes = createSelector(
  getNetworkEgo,
  (ego) => ego?.[entityAttributesProperty] ?? {},
);

export const getNetworkEdges = createSelector(
  getFilteredNetwork,
  (network) => network?.edges ?? [],
);

export const getNodeTypeDefinition = createSelector(
  getCodebook,
  getStageSubject,
  (codebook, subject: StageSubject) => {
    if (!subject || subject.entity === 'ego') {
      return null;
    }

    return codebook.node?.[subject.type] ?? null;
  },
);

// See: https://github.com/complexdatacollective/Network-Canvas/wiki/Node-Labeling
export const labelLogic = (
  codebookForNodeType: NodeDefinition,
  nodeAttributes: NcNode[EntityAttributesProperty],
): string => {
  // 1. In the codebook for the stage's subject, look for a variable with a name
  // property of "name", and try to retrieve this value by key in the node's
  // attributes
  const variableCalledName =
    codebookForNodeType?.variables &&
    // Ignore case when looking for 'name'
    findKey(
      codebookForNodeType.variables,
      (variable) => variable.name.toLowerCase() === 'name',
    );

  if (variableCalledName && nodeAttributes[variableCalledName]) {
    return nodeAttributes[variableCalledName] as string;
  }

  // 2. Look for a property in nodeAttributes with a key of ‘name’, and return the value
  const nodeVariableCalledName = Object.entries(nodeAttributes).find(
    ([key]) => key.toLowerCase() === 'name',
  )?.[1];

  if (nodeVariableCalledName) {
    // cast to string
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(nodeVariableCalledName);
  }

  // 3. Collect all the codebook variables of type text, and iterate over them on the
  // node, returning the first one that has a value assigned.
  const textVariables = Object.entries(
    codebookForNodeType?.variables ?? {},
  ).filter(([_, variable]) => variable.type === 'text');

  for (const [variableKey] of textVariables) {
    if (nodeAttributes[variableKey]) {
      return nodeAttributes[variableKey] as string;
    }
  }

  // 3. Last resort!
  return `${codebookForNodeType.name}`;
};

export const getNodeLabel = createSelector(
  getNodeTypeDefinition,
  (nodeTypeDefinition: NodeDefinition | null) => (node: NcNode) => {
    if (!nodeTypeDefinition) {
      return 'Node';
    }

    const nodeAttributes = getEntityAttributes(node);

    return labelLogic(nodeTypeDefinition, nodeAttributes);
  },
);

const getType = (_: unknown, props: Record<string, string>) =>
  props.type ?? null;

const getNodeColorSelector = createSelector(
  getCodebook,
  getType,
  (codebook, nodeType) => {
    if (!nodeType) {
      return 'node-color-seq-1';
    }

    return codebook.node?.[nodeType]?.color ?? 'node-color-seq-1';
  },
);

// Pure state selector variant of makeGetNodeColor
export const getNodeColor = (nodeType: string) => (state: RootState) =>
  getNodeColorSelector(state, { type: nodeType });

export const getNodeTypeLabel = (nodeType: string) => (state: RootState) => {
  const codebook = getCodebook(state) as unknown as Codebook;
  return codebook.node?.[nodeType]?.name ?? '';
};

export const makeGetEdgeLabel = () =>
  createSelector(
    getCodebook,
    (_, props: Record<string, string>) => props.type ?? null,
    (codebook, edgeType: string | null) => {
      if (!edgeType) {
        return '';
      }

      return (codebook as Codebook)?.edge?.[edgeType]?.name ?? '';
    },
  );

export const getEdgeColor = createSelector(
  getCodebook,
  (_, props: Record<string, string>) => props.type ?? null,
  (codebook, edgeType: string | null) => {
    if (!edgeType) {
      return 'edge-color-seq-1';
    }

    return (
      (codebook as Codebook)?.edge?.[edgeType]?.color ?? 'edge-color-seq-1'
    );
  },
);

export const makeGetEdgeColor = () => getEdgeColor;

export const makeGetNodeAttributeLabel = () =>
  createSelector(
    getCodebook,
    getSubjectType,
    (_, props: Record<string, string>) => props.variableId ?? null,
    (codebook, subjectType: string | null, variableId: string | null) => {
      if (!subjectType || !variableId) {
        return '';
      }

      return (
        (codebook as Codebook).node?.[subjectType]?.variables?.[variableId]
          ?.name ?? undefined
      );
    },
  );

export const getCategoricalOptions = createSelector(
  getCodebook,
  getSubjectType,
  (_, props: Record<string, string>) => props.variableId ?? null,
  (codebook, subjectType: string | null, variableId: string | null) => {
    if (!subjectType || !variableId) {
      return [];
    }

    const variable = (codebook as Codebook).node?.[subjectType]?.variables?.[
      variableId
    ];
    return variable && 'options' in variable ? variable.options : [];
  },
);

export const makeGetCategoricalOptions = () => getCategoricalOptions;

/**
 * makeNetworkEdgesForType()
 * Get the current prompt/stage subject, and filter the network by this edge type.
 */

const getNetworkEdgesForType = createSelector(
  getNetworkEdges,
  getStageSubject,
  (edges, subject: StageSubject) => {
    if (!subject || !edges) {
      return [];
    }

    if (subject.entity === 'ego') {
      return [];
    }

    filter(edges, ['type', subject.type]);
  },
);

export const makeNetworkEdgesForType = () => getNetworkEdgesForType;

/**
 * makeNetworkEntitiesForType()
 * Get the current prompt/stage subject, and filter the network by this entity type.
 */
export const getNetworkEntitiesForType = createSelector(
  getNetwork,
  getStageSubject,
  (network, subject: StageSubject) => {
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

export const getNetworkNodesForType = createSelector(
  getNetworkNodes,
  getStageSubject,
  (nodes, subject: StageSubject) => {
    if (!subject || !nodes) {
      return [];
    }

    if (subject.entity === 'ego') {
      return [];
    }

    return filter(nodes, ['type', subject.type]);
  },
);

export const makeNetworkNodesForType = () => getNetworkNodesForType;

export const getStageNodeCount = createSelector(
  getNetworkNodesForType,
  stagePromptIds,
  (nodes, promptIds: string[]) =>
    filter(
      nodes,
      (node) => intersection(node.promptIDs ?? [], promptIds).length > 0,
    ).length,
);

export const makeGetStageNodeCount = () => {
  return createSelector(
    getNetworkNodesForType,
    stagePromptIds,
    (nodes, promptIds: string[]) =>
      filter(
        nodes,
        (node) => intersection(node.promptIDs ?? [], promptIds).length > 0,
      ).length,
  );
};

export const getPromptId = createSelector(
  getPrompts,
  getPromptIndex,
  (prompts, promptIndex) => {
    if (!prompts) {
      return null;
    }

    return prompts[promptIndex]?.id ?? null;
  },
);

export const getNetworkNodesForPrompt = createSelector(
  getNetworkNodesForType,
  getPromptId,
  (nodes, promptId) =>
    filter(nodes, (node) => includes(node.promptIDs ?? [], promptId)),
);

/**
 * makeNetworkNodesForOtherPrompts()
 *
 * Same as above, except returns a filtered node list that **excludes** nodes that match the current
 * prompt's promptId.
 */

export const getNetworkNodesForOtherPrompts = createSelector(
  getNetworkNodesForType,
  getPromptId,
  (nodes, promptId) =>
    filter(nodes, (node) => !includes(node.promptIDs ?? [], promptId)),
);
