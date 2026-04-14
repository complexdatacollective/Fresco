import { type Codebook } from '@codaco/protocol-validation';
import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCodebook } from '~/lib/interviewer/ducks/modules/protocol';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';

const getNodeConfig = createSelector(getCurrentStage, (stage) => {
  invariant(stage.type === 'FamilyPedigree', 'Stage must be FamilyPedigree');
  return stage.nodeConfig;
});

export const getNodeType = createSelector(getNodeConfig, (c) => c.type);
export const getNodeTypeKey = createSelector(getNodeConfig, (c) => c.type);
export const getNodeLabelVariable = createSelector(
  getNodeConfig,
  (c) => c.nodeLabelVariable,
);
export const getEgoVariable = createSelector(
  getNodeConfig,
  (c) => c.egoVariable,
);
export const getNodeForm = createSelector(getNodeConfig, (c) => c.form);

/**
 * Resolves nodeConfig.form fields against the codebook to produce
 * renderable field definitions with component type, options, and validation.
 */
export const getResolvedNodeFormFields = createSelector(
  getCodebook,
  getNodeType,
  getNodeForm,
  (codebook, nodeType, form) => {
    if (!form) return [];
    const variables = (codebook as Codebook).node?.[nodeType]?.variables;
    if (!variables) return [];

    return form
      .map((field) => {
        const variable = variables[field.variable];
        if (!variable || !('component' in variable)) return null;
        return {
          variableId: field.variable,
          prompt: field.prompt,
          component: variable.component as string,
          type: variable.type as string,
          options: 'options' in variable ? variable.options : undefined,
          validation:
            'validation' in variable
              ? (variable.validation as Record<string, unknown>)
              : undefined,
        };
      })
      .filter((f) => f !== null);
  },
);

export const getNodeShapeDefinition = createSelector(
  getCodebook,
  getNodeType,
  (codebook, nodeType) => {
    return (codebook as Codebook).node?.[nodeType]?.shape ?? null;
  },
);
