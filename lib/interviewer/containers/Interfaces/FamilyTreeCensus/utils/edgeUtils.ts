import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';

export const getRelationshipTypeVariable = createSelector(
  getCurrentStage,
  (stage) => {
    invariant(
      stage.type === 'FamilyTreeCensus',
      'Stage must be FamilyTreeCensus',
    );

    return stage.relationshipTypeVariable;
  },
);

export const getSourceRelationshipToEgoVariable = createSelector(
  getCurrentStage,
  (stage) => {
    invariant(
      stage.type === 'FamilyTreeCensus',
      'Stage must be FamilyTreeCensus',
    );

    return stage.sourceRelationshipToEgoVariable;
  },
);

export const getTargetRelationshipToEgoVariable = createSelector(
  getCurrentStage,
  (stage) => {
    invariant(
      stage.type === 'FamilyTreeCensus',
      'Stage must be FamilyTreeCensus',
    );

    return stage.targetRelationshipToEgoVariable;
  },
);

export const normalizeRelationshipToEgoLabel = (str: string): string =>
  str.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
