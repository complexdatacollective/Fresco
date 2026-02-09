import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';

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

export const normalizeRelationshipToEgoLabel = (str: string): string =>
  str.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
