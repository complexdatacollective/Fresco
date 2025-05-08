import type { Variable } from '@codaco/protocol-validation';
import { createSelector } from '@reduxjs/toolkit';
import { get } from 'es-toolkit/compat';
import {
  getAssetManifest,
  getCodebook,
  getShouldEncryptNames,
} from '../ducks/modules/protocol';
import { getCurrentStage, getStageSubject } from './session';

// Get all variables for all subjects in the codebook, adding the entity and type
export const getAllVariableUUIDsByEntity = createSelector(
  getCodebook,
  (codebook) => {
    if (!codebook) {
      return {} as Record<
        string,
        Variable & {
          entity: 'node' | 'edge' | 'ego';
          entityType: string | null;
        }
      >;
    }

    const { node: nodeTypes, edge: edgeTypes, ego } = codebook;
    const variables = {} as Record<
      string,
      Variable & {
        entity: 'node' | 'edge' | 'ego';
        entityType: string | null;
      }
    >;

    // Nodes
    Object.entries(nodeTypes ?? {}).forEach(
      ([nodeTypeIndex, nodeTypeDefinition]) => {
        const nodeVariables = get(nodeTypeDefinition, 'variables', {});

        Object.entries(nodeVariables).forEach(([variableIndex, definition]) => {
          variables[variableIndex] = {
            entity: 'node',
            entityType: nodeTypeIndex,
            ...definition,
          };
        });
      },
    );

    // Edges
    Object.entries(edgeTypes ?? {}).forEach(
      ([edgeTypeIndex, edgeTypeDefinition]) => {
        const edgeVariables = get(edgeTypeDefinition, 'variables', {});
        Object.entries(edgeVariables).forEach(([variableIndex, definition]) => {
          variables[variableIndex] = {
            entity: 'edge',
            entityType: edgeTypeIndex,
            ...definition,
          };
        });
      },
    );

    // Ego
    const egoVariables = get(ego, 'variables', {});
    Object.entries(egoVariables ?? {}).forEach(
      ([variableIndex, definition]) => {
        variables[variableIndex] = {
          entity: 'ego',
          entityType: null,
          ...definition,
        };
      },
    );

    return variables;
  },
);

export const getCodebookVariablesForSubjectType = createSelector(
  getCodebook,
  getStageSubject,
  (codebook, subject) => {
    // If subject is null, assume ego
    if (!subject) {
      return codebook.ego?.variables ?? {};
    }

    const { entity } = subject;

    return codebook[entity]?.[subject.type]?.variables ?? {};
  },
);

export const makeGetCodebookForNodeType = createSelector(
  getCodebook,
  (codebook) => (type: string) => {
    return codebook.node?.[type];
  },
);

export const getCodebookForNodeType = (type: string) =>
  createSelector(getCodebook, (codebook) => {
    return codebook.node?.[type];
  });

export const getCodebookVariablesForNodeType = (type: string) =>
  createSelector(
    getCodebook,
    (codebook) => codebook.node?.[type]?.variables ?? {},
  );

export const makeGetApiKeyAssetValue = (key: string) =>
  createSelector(getAssetManifest, (manifest) => {
    const value = manifest[key]?.value;
    return value;
  });

export const getStageUsesEncryption = createSelector(
  getShouldEncryptNames,
  getCurrentStage,
  getCodebookVariablesForSubjectType,
  (shouldEncryptNames, stage, variables) => {
    if (!shouldEncryptNames || !variables) {
      return false;
    }

    // Check if the quickAdd variable or form has an encrypted variable
    if (stage.type === 'NameGeneratorQuickAdd') {
      return !!variables[stage.quickAdd]?.encrypted;
    }

    // Check if the form has any variables that are encrypted
    if (stage.type === 'NameGenerator') {
      const formVariables = stage.form.fields.map((field) => field.variable);
      return formVariables.some((variable) => variables[variable]?.encrypted);
    }

    return false;
  },
);
