import { type Asset } from '@prisma/client';
import { createSelector } from '@reduxjs/toolkit';
import { get } from 'es-toolkit/compat';
import { v4 as uuid } from 'uuid';
import {
  type EdgeTypeDefinition,
  type EntityTypeDefinition,
  type NodeTypeDefinition,
  type StageSubject,
  type VariableDefinition,
} from '~/lib/shared-consts';
import { type RootState } from '../store';
import { getStageSubject } from './prop';

const DefaultFinishStage = {
  // `id` is used as component key; must be unique from user input
  id: uuid(),
  type: 'FinishSession',
  label: 'Finish Interview',
};

const getActiveSession = (state: RootState) =>
  state.sessions[state.activeSessionId];

const getInstalledProtocols = (state: RootState) => state.installedProtocols;

const getCurrentSessionProtocol = createSelector(
  getActiveSession,
  getInstalledProtocols,
  (session, protocols) => {
    if (!session) return undefined;
    return protocols[session.protocolId];
  },
);

export const getAssetManifest = createSelector(
  getCurrentSessionProtocol,
  (protocol) =>
    protocol?.assets.reduce(
      (manifest, asset) => {
        manifest[asset.assetId] = asset;
        return manifest;
      },
      {} as Record<string, Asset>,
    ) ?? {},
);

export const getAssetUrlFromId = createSelector(
  getAssetManifest,
  (manifest) => (id: string) => manifest[id]?.url,
);

export const getProtocolCodebook = createSelector(
  getCurrentSessionProtocol,
  (protocol) => protocol?.codebook ?? { node: {}, edge: {}, ego: {} },
);

// Get all variables for all subjects in the codebook, adding the entity and type
export const getAllVariableUUIDsByEntity = createSelector(
  getProtocolCodebook,
  ({ node: nodeTypes, edge: edgeTypes, ego }) => {
    const variables = {} as Record<
      string,
      VariableDefinition & {
        entity: 'node' | 'edge' | 'ego';
        entityType: string | null;
      }
    >;

    // Nodes
    Object.entries(nodeTypes).forEach(([nodeTypeIndex, nodeTypeDefinition]) => {
      const nodeVariables = get(
        nodeTypeDefinition,
        'variables',
        {} as NodeTypeDefinition['variables'],
      );
      Object.entries(nodeVariables).forEach(([variableIndex, definition]) => {
        variables[variableIndex] = {
          entity: 'node',
          entityType: nodeTypeIndex,
          ...definition,
        };
      });
    });

    // Edges
    Object.entries(edgeTypes).forEach(([edgeTypeIndex, edgeTypeDefinition]) => {
      const edgeVariables = get(
        edgeTypeDefinition,
        'variables',
        {} as EdgeTypeDefinition['variables'],
      );
      Object.entries(edgeVariables).forEach(([variableIndex, definition]) => {
        variables[variableIndex] = {
          entity: 'edge',
          entityType: edgeTypeIndex,
          ...definition,
        };
      });
    });

    // Ego
    const egoVariables = get(
      ego,
      'variables',
      {} as EntityTypeDefinition['variables'],
    );
    Object.entries(egoVariables).forEach(([variableIndex, definition]) => {
      variables[variableIndex] = {
        entity: 'ego',
        entityType: null,
        ...definition,
      };
    });

    return variables;
  },
);

export const getProtocolStages = createSelector(
  getCurrentSessionProtocol,
  // Insert default finish stage here.
  (protocol) => [...(protocol?.stages ?? []), DefaultFinishStage],
);

export const getCodebookVariablesForSubjectType = createSelector(
  getProtocolCodebook,
  getStageSubject,
  (codebook, subject: StageSubject | undefined) =>
    subject
      ? (codebook[subject.entity as 'node' | 'edge']?.[subject.type]
          ?.variables ?? {})
      : codebook,
);

export const getCodebookVariablesForNodeType = (type: string) =>
  createSelector(
    getProtocolCodebook,
    (codebook) => codebook.node?.[type]?.variables ?? {},
  );
