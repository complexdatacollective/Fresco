import {
  entityAttributesProperty,
  type Codebook,
  type FilterDefinition,
  type NcNetwork,
  type Stage,
  type StageSubject,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import customFilter from '~/lib/network-query/filter';
import type { RootState } from '../store';
import { getStageSubject, getSubjectType } from './prop';
import { getProtocolCodebook } from './protocol';
import { getActiveSession } from './session';
import { createDeepEqualSelector } from './utils';

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
