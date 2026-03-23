import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';

export const getEgoShapeVariable = createSelector(getCurrentStage, (stage) => {
  invariant(stage.type === 'FamilyPedigree', 'Stage must be FamilyPedigree');

  return stage.egoShapeVariable;
});

export const getNodeShapeVariable = createSelector(getCurrentStage, (stage) => {
  invariant(stage.type === 'FamilyPedigree', 'Stage must be FamilyPedigree');

  return stage.nodeConfig.shapeVariable;
});
