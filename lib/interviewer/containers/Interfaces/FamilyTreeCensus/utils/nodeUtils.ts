import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getNodeVariables } from '~/lib/interviewer/selectors/interface';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';
import { getNameVariableFromCodebook } from '~/lib/interviewer/utils/getNodeLabelAttribute';

/**
 * Gets the variable used for the ego's sex from the stage config.
 * Used when reading/writing ego attributes.
 */
export const getEgoSexVariable = createSelector(getCurrentStage, (stage) => {
  invariant(
    stage.type === 'FamilyTreeCensus',
    'Stage must be FamilyTreeCensus',
  );

  return stage.egoSexVariable;
});

/**
 * Gets the variable used for node/alter sex from the stage config.
 * Used when reading/writing alter node attributes.
 */
export const getNodeSexVariable = createSelector(getCurrentStage, (stage) => {
  invariant(
    stage.type === 'FamilyTreeCensus',
    'Stage must be FamilyTreeCensus',
  );

  return stage.nodeSexVariable;
});

export const getRelationshipToEgoVariable = createSelector(
  getCurrentStage,
  (stage) => {
    invariant(
      stage.type === 'FamilyTreeCensus',
      'Stage must be FamilyTreeCensus',
    );

    return stage.relationshipToEgoVariable;
  },
);

export const getNodeIsEgoVariable = createSelector(getCurrentStage, (stage) => {
  invariant(
    stage.type === 'FamilyTreeCensus',
    'Stage must be FamilyTreeCensus',
  );

  return stage.nodeIsEgoVariable;
});

/**
 * Gets the variable used for the node name using the same heuristics as
 * getNodeLabelAttribute: first looks for a variable with name === "name",
 * then falls back to first text variable.
 */
export const getNameVariable = createSelector(
  getNodeVariables,
  (variables) => getNameVariableFromCodebook(variables) ?? '',
);

export const normalizeRelationshipToEgoLabel = (str: string): string =>
  str.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
