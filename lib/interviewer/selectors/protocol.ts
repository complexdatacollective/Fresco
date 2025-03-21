import type { StageSubject, Variable } from '@codaco/protocol-validation';
import { createSelector } from '@reduxjs/toolkit';
import { get } from 'es-toolkit/compat';
import { getCodebook } from '../ducks/modules/protocol';
import { getStageSubject } from './prop';

// Get all variables for all subjects in the codebook, adding the entity and type
export const getAllVariableUUIDsByEntity = createSelector(
  getCodebook,
  ({ node: nodeTypes, edge: edgeTypes, ego }) => {
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
  (codebook, subject: StageSubject | undefined) => {
    if (subject === undefined) {
      return {};
    }

    const { entity } = subject;

    if (entity === 'ego') {
      return codebook.ego?.variables ?? {};
    }

    return codebook[entity]?.[subject.type]?.variables ?? {};
  },
);

export const getCodebookVariablesForNodeType = (type: string) =>
  createSelector(
    getCodebook,
    (codebook) => codebook.node?.[type]?.variables ?? {},
  );
