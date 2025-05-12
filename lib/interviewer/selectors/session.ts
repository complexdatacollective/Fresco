import type { Codebook, Stage } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  type NcNetwork,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { intersection, invariant } from 'es-toolkit';
import { filter, includes } from 'es-toolkit/compat';
import customFilter from '~/lib/network-query/filter';
import { getCodebook, getStages } from '../ducks/modules/protocol';
import { type RootState } from '../store';
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
    const result = stages[currentStep];

    invariant(result, 'getCurrentStage: No stage found');

    return result;
  },
);

export const getStageSubject = createSelector(getCurrentStage, (stage) => {
  if (!stage) {
    return null;
  }

  if ('subject' in stage) {
    return stage.subject;
  }

  return null;
});

export const getSubjectType = createSelector(getStageSubject, (subject) => {
  if (!subject) {
    return null;
  }

  return subject.type;
});

export const getCurrentStageId = createSelector(
  getCurrentStage,
  (currentStage) => {
    return currentStage.id;
  },
);

export const getPromptIndex = createSelector(
  getActiveSession,
  (session) => session?.promptIndex ?? 0,
);

// Define a type guard to narrow the stage type
const hasPrompts = (
  stage: Stage,
): stage is Extract<Stage, { prompts: unknown }> => {
  return 'prompts' in stage;
};

export const getPrompts = createSelector(getCurrentStage, (stage) => {
  if (!stage) {
    return null;
  }

  if (!hasPrompts(stage)) {
    return null;
  }

  return stage.prompts;
});

export const stagePromptIds = createSelector(getPrompts, (prompts) => {
  if (!prompts) {
    return [];
  }
  return prompts.map((prompt) => prompt.id);
});

export const getCurrentPrompt = createSelector(
  getPrompts,
  getPromptIndex,
  (prompts, promptIndex) => {
    invariant(
      prompts[promptIndex],
      'getCurrentPrompt: No prompt found for index',
    );
    return prompts[promptIndex];
  },
);

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

export const getStageCount = createSelector(
  getStages,
  (stages) => stages.length,
);

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

const getPropStageFilter = createSelector(getCurrentStage, (stage) => {
  if (!stage) {
    return null;
  }
  if ('filter' in stage) {
    return stage.filter;
  }

  return null;
});

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
  (codebook, subject) => {
    if (!subject) {
      return null;
    }
    return codebook.node?.[subject.type] ?? null;
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

export const getEdgeColorForType = (type: string) => (state: RootState) =>
  getEdgeColor(state, { type });

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

export const getNetworkEdgesForType = createSelector(
  getNetworkEdges,
  getStageSubject,
  (edges, subject) => {
    if (!subject) {
      return [];
    }

    return edges.filter((edge) => edge.type === subject.type);
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
  (nodes, subject) => {
    if (!subject || !nodes) {
      return [];
    }

    return nodes.filter((node) => node.type === subject.type);
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
  return getStageCount;
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
