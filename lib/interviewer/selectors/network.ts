import {
  entityAttributesProperty,
  type Codebook,
  type FilterDefinition,
  type NcNetwork,
  type Stage,
  type StageSubject,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { getEntityAttributes } from '~/lib/interviewer/ducks/modules/network';
import customFilter from '~/lib/network-query/filter';
import { type Variables } from '~/lib/protocol-validation/schemas/src/8.zod';
import {
  decryptData,
  entitySecureAttributesMeta,
  getPassphrase,
  type NodeWithSecureAttributes,
} from '../containers/Interfaces/Anonymisation';
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

// See: https://github.com/complexdatacollective/Network-Canvas/wiki/Node-Labeling
export const labelLogic = async (
  codebookVariables: Variables,
  node: NodeWithSecureAttributes,
): Promise<string> => {
  const nodeAttributes = getEntityAttributes(node) as Record<string, unknown>;

  // 1. In the codebook for the stage's subject, look for a variable with a name
  // property of "name", and try to retrieve this value by key in the node's
  // attributes
  const variableCalledName = Object.keys(codebookVariables).find(
    (variableId) =>
      codebookVariables[variableId]?.name.toLowerCase() === 'name',
  );

  if (variableCalledName && nodeAttributes[variableCalledName]) {
    // Handle encrypted value.
    const isEncrypted = codebookVariables[variableCalledName]?.encrypted;

    if (!isEncrypted) {
      return nodeAttributes[variableCalledName] as string;
    }

    // Handle encrypted value.
    // To do this, we need to fetch the salt and IV from the node attributes, and the passphrase
    // from the session.
    const secureAttributes =
      node[entitySecureAttributesMeta]?.[variableCalledName];

    if (!secureAttributes) {
      // eslint-disable-next-line no-console
      console.log(`Node ${node._uid} is missing secure attributes`);
    }

    const passphrase = getPassphrase();

    // If we don't have an active passphrase, show the lock icon.
    if (!passphrase) {
      return '🔒\nNo passphrase';
    }

    const decryptedValue = await decryptData(
      {
        [entitySecureAttributesMeta]: {
          salt: secureAttributes!.salt,
          iv: secureAttributes!.iv,
        },
        data: nodeAttributes[variableCalledName] as number[],
      },
      passphrase,
    );

    return `🔓\n${decryptedValue}`;
  }

  // 2. Look for a property on the node with a key of ‘name’, and try to retrieve this
  // value as a key in the node's attributes.
  // const nodeVariableCalledName = get(nodeAttributes, 'name');
  if (
    Object.keys(nodeAttributes)
      .map((a) => a.toLowerCase())
      .includes('name')
  ) {
    return nodeAttributes.name as string;
  }

  // 3. Last resort!
  return "No 'name' variable!";
};

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
