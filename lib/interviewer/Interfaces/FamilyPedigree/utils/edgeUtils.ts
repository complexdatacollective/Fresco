import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';

const getEdgeConfig = createSelector(getCurrentStage, (stage) => {
  invariant(stage.type === 'FamilyPedigree', 'Stage must be FamilyPedigree');
  return stage.edgeConfig;
});

export const getEdgeTypeKey = createSelector(getEdgeConfig, (c) => c.type);

export const getRelationshipTypeVariable = createSelector(
  getEdgeConfig,
  (c) => c.relationshipTypeVariable,
);
export const getIsActiveVariable = createSelector(
  getEdgeConfig,
  (c) => c.isActiveVariable,
);
export const getIsGestationalCarrierVariable = createSelector(
  getEdgeConfig,
  (c) => c.isGestationalCarrierVariable,
);
