import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';

export const getRelationshipTypeVariable = createSelector(
  getCurrentStage,
  (stage) => {
    invariant(stage.type === 'FamilyPedigree', 'Stage must be FamilyPedigree');

    return stage.edgeConfig.relationshipTypeVariable;
  },
);
