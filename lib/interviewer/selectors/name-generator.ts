import { type Panel } from '@codaco/protocol-validation';
import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { filter as customFilter } from '@codaco/network-query';
import { getCodebook } from '../ducks/modules/protocol';
import {
  getCurrentStage,
  getNetworkEdges,
  getNetworkEgo,
  getNetworkNodesForOtherPrompts,
  getNetworkNodesForPrompt,
  getSubjectType,
} from './session';
import { notInSet } from './utils';

export const getStageCardOptions = createSelector(getCurrentStage, (stage) => {
  if (stage.type !== 'NameGeneratorRoster') {
    return {};
  }

  return stage.cardOptions ?? {};
});

export const getNodeIconName = createSelector(
  getCodebook,
  getSubjectType,
  (codebook, nodeType) => {
    const nodeIcon = nodeType
      ? (codebook?.node?.[nodeType]?.icon ?? 'add-a-person')
      : 'add-a-person';

    return nodeIcon;
  },
);

export const getPanelConfiguration = createSelector(
  getCurrentStage,
  (stage) => {
    if (
      stage.type !== 'NameGenerator' &&
      stage.type !== 'NameGeneratorQuickAdd'
    ) {
      return undefined;
    }

    return stage.panels;
  },
);

export const getSearchOptions = createSelector(getCurrentStage, (stage) => {
  if (stage.type !== 'NameGeneratorRoster') {
    return undefined;
  }

  return stage.searchOptions;
});

export const getSortOptions = createSelector(getCurrentStage, (stage) => {
  if (stage.type !== 'NameGeneratorRoster') {
    return undefined;
  }

  return stage.sortOptions;
});

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

      const defaultEgo = { _uid: '', attributes: {} };
      const filteredNetwork = filterFunction({
        nodes,
        edges: panelConfig.dataSource === 'existing' ? networkEdges : [],
        ego:
          panelConfig.dataSource === 'existing' && networkEgo
            ? networkEgo
            : defaultEgo,
      });

      return filteredNetwork.nodes;
    },
  );
