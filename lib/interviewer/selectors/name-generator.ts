import { type Panel, type Stage } from '@codaco/protocol-validation';
import {
  entityPrimaryKeyProperty,
  type NcNetwork,
  type NcNode,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { has, invariant } from 'es-toolkit/compat';
import customFilter from '~/lib/network-query/filter';
import { getCodebook } from '../ducks/modules/protocol';
import {
  getCurrentStage,
  getNetworkEdges,
  getNetworkEgo,
  getNetworkNodesForOtherPrompts,
  getNetworkNodesForPrompt,
  getPromptId,
  getStageIndex,
  getStageSubject,
  getSubjectType,
} from './session';
import { notInSet } from './utils';

const stageCardOptions = (
  _: unknown,
  props: {
    stage: Extract<Stage, { type: 'NameGeneratorRoster' }>;
  },
) => props.stage.cardOptions;

const getIDs = createSelector(
  getStageIndex,
  getPromptId,
  (stageId, promptId) => {
    return {
      stageId,
      promptId,
    };
  },
);

export const getPromptModelData = createSelector(
  getStageSubject,
  getIDs,
  (subject, { stageId, promptId }) => {
    invariant(subject, 'Subject is required');

    return {
      type: subject.type,
      stageId,
      promptId,
    };
  },
);

// Returns any additional properties to be displayed on cards.
// Returns an empty array if no additional properties are specified in the protocol.
export const getCardAdditionalProperties = createSelector(
  stageCardOptions,
  (cardOptions) =>
    has(cardOptions, 'additionalProperties')
      ? cardOptions!.additionalProperties // Todo: should correctly narrow the type based on stage type
      : [],
);

export const getNodeIconName = createSelector(
  getCodebook,
  getSubjectType,
  (codebook, nodeType) => {
    invariant(nodeType, 'Node type is required');

    const nodeIcon = codebook.node?.[nodeType]?.iconVariant ?? 'add-a-person';

    return nodeIcon;
  },
);

export const getPanelConfiguration = createSelector(
  getCurrentStage,
  (stage) => {
    invariant(stage, 'Stage is required');
    const stageWithPanels = stage as Extract<
      Stage,
      { type: 'NameGenerator' | 'NameGeneratorQuickAdd' }
    >;

    const panels = stageWithPanels.panels ?? ([] as Panel[]);

    return panels;
  },
);

export const getPanelNodes = (
  panelConfig: Panel,
  externalData: NcNode[] | null,
) =>
  createSelector(
    getNetworkNodesForPrompt,
    getNetworkNodesForOtherPrompts,
    getNetworkEdges,
    getNetworkEgo,
    (nodesForPrompt, nodesForOtherPrompts, networkEdges, networkEgo) => {
      const nodeIds = {
        prompt: nodesForPrompt.map((node) => node[entityPrimaryKeyProperty]),
        other: nodesForOtherPrompts.map(
          (node) => node[entityPrimaryKeyProperty],
        ),
      };

      let nodes: NcNode[] = [];

      // For current network nodes, we filter out any nodes that are already in the prompt
      if (panelConfig.dataSource === 'existing') {
        nodes = nodesForOtherPrompts.filter(notInSet(new Set(nodeIds.prompt)));
      } else {
        // For external data nodes, we filter out any nodes that are already in the prompt
        nodes =
          externalData?.filter(
            notInSet(new Set([...nodeIds.prompt, ...nodeIds.other])),
          ) ?? ([] as NcNode[]);
      }

      if (!panelConfig.filter) {
        return nodes;
      }

      // If a filter is provided, we apply it to the nodes
      const filterFunction = customFilter(panelConfig.filter);

      const filteredNetwork = filterFunction({
        nodes,
        edges: panelConfig.dataSource === 'existing' ? networkEdges : [],
        ego: panelConfig.dataSource === 'existing' ? networkEgo : undefined,
      }) as NcNetwork;

      return filteredNetwork.nodes;
    },
  );
