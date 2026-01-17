import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';

export const getSexVariable = createSelector(getCurrentStage, (stage) => {
  invariant(
    stage.type === 'FamilyTreeCensus',
    'Stage must be FamilyTreeCensus',
  );

  return stage.sexVariable;
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

export const normalizeRelationshipToEgoLabel = (str: string): string =>
  str.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
