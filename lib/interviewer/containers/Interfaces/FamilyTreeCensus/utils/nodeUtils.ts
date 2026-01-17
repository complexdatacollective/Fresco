import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getNodeVariables } from '~/lib/interviewer/selectors/interface';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';
import { getNameVariableFromCodebook } from '~/lib/interviewer/utils/getNodeLabelAttribute';

export const getEgoSexVariable = createSelector(getCurrentStage, (stage) => {
  invariant(
    stage.type === 'FamilyTreeCensus',
    'Stage must be FamilyTreeCensus',
  );

  return stage.egoSexVariable;
});

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
export const getNameVariable = createSelector(getNodeVariables, (variables) => {
  const nameVariable = getNameVariableFromCodebook(variables);
  invariant(
    nameVariable != null && nameVariable !== '',
    'Name variable could not be determined from codebook',
  );
  return nameVariable;
});

export const normalizeRelationshipToEgoLabel = (str: string): string =>
  str.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
