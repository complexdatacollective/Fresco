import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';

export const getNodeConfig = createSelector(getCurrentStage, (stage) => {
  invariant(stage.type === 'FamilyPedigree', 'Stage must be FamilyPedigree');
  return stage.nodeConfig;
});

export const getNodeType = createSelector(getNodeConfig, (c) => c.type);
export const getNodeLabelVariable = createSelector(
  getNodeConfig,
  (c) => c.nodeLabelVariable,
);
export const getEgoVariable = createSelector(
  getNodeConfig,
  (c) => c.egoVariable,
);
export const getBiologicalSexVariable = createSelector(
  getNodeConfig,
  (c) => c.biologicalSexVariable,
);
export const getRelationshipVariable = createSelector(
  getNodeConfig,
  (c) => c.relationshipVariable,
);
export const getNodeForm = createSelector(getNodeConfig, (c) => c.form);
