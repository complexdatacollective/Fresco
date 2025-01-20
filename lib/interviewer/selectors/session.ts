import { createSelector } from '@reduxjs/toolkit';
import { intersection } from 'es-toolkit';
import { filter, findKey, includes } from 'es-toolkit/compat';
import customFilter from '~/lib/network-query/filter';
import {
  entityAttributesProperty,
  type Codebook,
  type FilterDefinition,
  type NcNetwork,
  type NcNode,
  type NodeTypeDefinition,
  type Stage,
  type StageSubject,
} from '~/lib/shared-consts';
import { getEntityAttributes } from '~/utils/general';
import { type RootState } from '../store';
import { getStageSubject, getSubjectType, stagePromptIds } from './prop';
import { getProtocolCodebook, getProtocolStages } from './protocol';
import { createDeepEqualSelector } from './utils';

export const getActiveSession = (state: RootState) => {
  return state.session;
};

export const getStageIndex = (state: RootState) => state.session.currentStep;

// Stage stage is temporary storage for stages used by TieStrengthCensus and DyadCensus
export const getStageMetadata = createSelector(
  getActiveSession,
  getStageIndex,
  (session, stageIndex) => {
    if (!stageIndex) return undefined;
    return session?.stageMetadata?.[stageIndex] ?? undefined;
  },
);

export const getCurrentStage = createSelector(
  getProtocolStages,
  getStageIndex,
  (stages: Stage[], currentStep) => {
    if (currentStep === null) return null;
    return stages[currentStep];
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

export const getPrompts = createSelector(
  getCurrentStage,
  (stage) => stage?.prompts,
);

const getPromptCount = createSelector(
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
  getProtocolStages,
  (currentStep, stages) => currentStep === stages.length - 1,
);

const getStageCount = createSelector(
  getProtocolStages,
  (stages) => stages.length,
);

const getSessionProgress = createSelector(
  getStageIndex,
  getStageCount,
  getPromptIndex,
  getPromptCount,
  (currentStep, stageCount, promptIndex, promptCount) => {
    // Don't subtract 1 because we have a finish stage automatically added that isn't accounted for.
    const stageProgress = currentStep / stageCount;

    const stageWorth = 1 / stageCount; // The amount of progress each stage is worth

    const promptProgress = promptCount === 1 ? 1 : promptIndex / promptCount; // 1 when finished

    const promptWorth = promptProgress * stageWorth;

    const percentProgress = (stageProgress + promptWorth) * 100;

    return percentProgress;
  },
);

// Used to calculate what the progress _will be_ once the next stage is loaded. Can update the
// progress bar with this.
export const makeGetFakeSessionProgress = createSelector(
  getStageCount,
  getPromptCount,
  (stageCount, promptCount) => {
    return (currentStep: number, promptIndex: number) => {
      if (currentStep === null) return 0;

      // Don't subtract 1 because we have a finish stage automatically added that isn't accounted for.
      const stageProgress = currentStep / stageCount;

      const stageWorth = 1 / stageCount; // The amount of progress each stage is worth

      const promptProgress = promptCount === 1 ? 1 : promptIndex / promptCount; // 1 when finished

      const promptWorth = promptProgress * stageWorth;

      const percentProgress = (stageProgress + promptWorth) * 100;

      return percentProgress;
    };
  },
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

const getPropStageFilter = (_: unknown, props: { stage: Stage }) =>
  props?.stage?.filter ?? null;

type FilterFunction = (network: NcNetwork) => NcNetwork;

// Filtered network
const getFilteredNetwork = createSelector(
  getNetwork,
  getPropStageFilter,
  (network, nodeFilter: FilterDefinition | null) => {
    if (!network) {
      return null;
    }

    if (nodeFilter && typeof nodeFilter !== 'function') {
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
  getProtocolCodebook,
  getStageSubject,
  (codebook: Codebook, { type }: StageSubject) => {
    return codebook.node?.[type] ?? null;
  },
);

// See: https://github.com/complexdatacollective/Network-Canvas/wiki/Node-Labeling
export const labelLogic = (
  codebookForNodeType: NodeTypeDefinition,
  nodeAttributes: Record<string, unknown>,
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
    return toString(nodeVariableCalledName);
  }

  // 3. Last resort!
  return "No 'name' variable!";
};

export const getNodeLabel = createSelector(
  getNodeTypeDefinition,
  (nodeTypeDefinition: NodeTypeDefinition | null) => (node: NcNode) => {
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
  getProtocolCodebook,
  getType,
  (codebook: Codebook, nodeType: string | null) => {
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
  const codebook = getProtocolCodebook(state) as unknown as Codebook;
  return codebook.node?.[nodeType]?.name ?? '';
};

export const makeGetEdgeLabel = () =>
  createSelector(
    getProtocolCodebook,
    (_, props: Record<string, string>) => props.type ?? null,
    (codebook, edgeType: string | null) => {
      if (!edgeType) {
        return '';
      }

      return (codebook as Codebook)?.edge?.[edgeType]?.name ?? '';
    },
  );

export const getEdgeColor = createSelector(
  getProtocolCodebook,
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
  createDeepEqualSelector(
    getProtocolCodebook,
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
  getProtocolCodebook,
  getSubjectType,
  (_, props: Record<string, string>) => props.variableId ?? null,
  (codebook, subjectType: string | null, variableId: string | null) => {
    if (!subjectType || !variableId) {
      return [];
    }

    return (
      (codebook as Codebook).node?.[subjectType]?.variables?.[variableId]
        ?.options ?? []
    );
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
  (edges, subject) => filter(edges, ['type', subject.type]),
);

export const makeNetworkEdgesForType = () => getNetworkEdgesForType;

/**
 * makeNetworkEntitiesForType()
 * Get the current prompt/stage subject, and filter the network by this entity type.
 */
export const getNetworkEntitiesForType = createSelector(
  getNetwork,
  getStageSubject,
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

export const getNetworkNodesForType = createSelector(
  getNetworkNodes,
  getStageSubject,
  (nodes, subject) => filter(nodes, ['type', subject.type]),
);

export const makeNetworkNodesForType = () => getNetworkNodesForType;

export const getStageNodeCount = createSelector(
  getNetworkNodesForType,
  stagePromptIds,
  (nodes, promptIds) =>
    filter(nodes, (node) => intersection(node.promptIDs, promptIds).length > 0)
      .length,
);

export const makeGetStageNodeCount = () => {
  return createSelector(
    getNetworkNodesForType,
    stagePromptIds,
    (nodes, promptIds) =>
      filter(
        nodes,
        (node) => intersection(node.promptIDs, promptIds).length > 0,
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

    return prompts[promptIndex].id ?? null;
  },
);

export const getNetworkNodesForPrompt = createSelector(
  getNetworkNodesForType,
  getPromptId,
  (nodes, promptId) =>
    filter(nodes, (node) => includes(node.promptIDs, promptId)),
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
    filter(nodes, (node) => !includes(node.promptIDs, promptId)),
);
