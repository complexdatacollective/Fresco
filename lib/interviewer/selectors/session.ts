import type { Codebook, StageSubject } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcNetwork,
  type NcNode,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { intersection, invariant } from 'es-toolkit';
import { filter, includes } from 'es-toolkit/compat';
import { type NodeColorSequence } from '~/components/Node';
import customFilter from '~/lib/network-query/filter';
import { getCodebook, getStages } from '../ducks/modules/protocol';
import { type RootState } from '../store';
import { calculateProgress } from './utils';

const getActiveSession = (state: RootState) => {
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

    // This use of invariant is okay, because this genuinely should never happen
    invariant(result, 'getCurrentStage: No stage found');

    return result;
  },
);

/**
 * Returns the subject for the current stage, or `null` for subjectless stages
 * (Information, Anonymisation).
 *
 * This selector must never throw because Redux dispatches trigger synchronous
 * subscription notifications. During stage transitions, components from the
 * *previous* stage still have active `connect()` subscriptions (React cleans
 * them up asynchronously via `useEffect`). If the new stage is subjectless and
 * this selector threw, those stale subscriptions would crash.
 */
export const getStageSubject = createSelector(getCurrentStage, (stage) => {
  invariant(stage, 'getStageSubject: No current stage found');

  if (stage.type === 'Information' || stage.type === 'Anonymisation') {
    return null;
  }

  if (stage.type === 'EgoForm') {
    return {
      entity: 'ego' as const,
    };
  }

  return stage.subject;
});

export const getSubjectType = createSelector(getStageSubject, (subject) => {
  if (!subject || subject.entity === 'ego') {
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

export const getPrompts = createSelector(getCurrentStage, (stage) => {
  if (!stage) {
    return null;
  }

  if ('prompts' in stage) {
    return stage.prompts;
  }

  return null;
});

const stagePromptIds = createSelector(getPrompts, (prompts) => {
  if (!prompts) {
    return [];
  }
  return prompts.map((prompt) => prompt.id);
});

export const getCurrentPrompt = createSelector(
  getPrompts,
  getPromptIndex,
  (prompts, promptIndex) => {
    if (!prompts) {
      return null;
    }

    return prompts[promptIndex];
  },
);

export const getPromptAdditionalAttributes = createSelector(
  getCurrentPrompt,
  (prompt): Record<string, boolean> => {
    if (!prompt || !('additionalAttributes' in prompt)) {
      return {};
    }

    return (prompt.additionalAttributes ?? []).reduce(
      (acc, { variable, value }) => ({
        ...acc,
        [variable]: value,
      }),
      {} as Record<string, boolean>,
    );
  },
);

export const getPromptSortOrder = createSelector(getCurrentPrompt, (prompt) => {
  if (prompt && 'sortOrder' in prompt) {
    return prompt.sortOrder;
  }
  return undefined;
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
  (session) => session.network,
);

const getStageFilter = createSelector(getCurrentStage, (stage) => {
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
  getStageFilter,
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

export const makeGetNodeById = createSelector(
  getNetworkNodes,
  (nodes) => (nodeId: NcNode[EntityPrimaryKey]) => {
    if (!nodes) {
      return null;
    }

    const node = nodes.find(
      (node) => node[entityPrimaryKeyProperty] === nodeId,
    );
    return node ?? null;
  },
);

export const getNodeTypeDefinition = createSelector(
  getCodebook,
  getStageSubject,
  (codebook, subject) => {
    if (!subject || subject.entity === 'ego') {
      return null;
    }
    return codebook.node?.[subject.type] ?? null;
  },
);

export const getNodeColorSelector = createSelector(
  getCodebook,
  getSubjectType,
  (codebook, nodeType): NodeColorSequence => {
    if (!nodeType) {
      return 'node-color-seq-1';
    }

    return codebook.node?.[nodeType]?.color ?? 'node-color-seq-1';
  },
);

/**
 * Get the human readable label for the current stage subject's type, e.g. "Person" for a node of
 * type "person", or "Friendship" for an edge of type "friendship". Returns null for ego subjects
 * and subjectless stages.
 */
export const getNodeTypeLabel = createSelector(
  getStageSubject,
  getCodebook,
  (subject, codebook) => {
    if (!subject || subject.entity === 'ego') {
      return null;
    }

    return codebook.node?.[subject.type]?.name ?? null;
  },
);

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

const getEdgeColor = createSelector(
  getCodebook,
  getStageSubject,
  (codebook, stageSubject) => {
    if (stageSubject?.entity !== 'edge') {
      return 'edge-color-seq-1';
    }

    const edgeType = stageSubject.type;

    return (
      (codebook as Codebook)?.edge?.[edgeType]?.color ?? 'edge-color-seq-1'
    );
  },
);

export const getEdgeColorForType = (
  type: Extract<StageSubject, { entity: 'edge' }>['type'],
) =>
  createSelector(getCodebook, (codebook) => {
    if (!type) {
      return 'edge-color-seq-1';
    }

    return (codebook as Codebook)?.edge?.[type]?.color ?? 'edge-color-seq-1';
  });

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

export const getNetworkEdgesForType = createSelector(
  getNetworkEdges,
  getStageSubject,
  (edges, subject) => {
    if (!subject || subject.entity === 'ego') {
      return [];
    }

    return edges.filter((edge) => edge.type === subject.type);
  },
);

export const getNetworkNodesForType = createSelector(
  getNetworkNodes,
  getStageSubject,
  (nodes, subject) => {
    if (!subject || !nodes || subject.entity === 'ego') {
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
