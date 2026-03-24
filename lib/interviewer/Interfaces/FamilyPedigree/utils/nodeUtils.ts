import { type Codebook } from '@codaco/protocol-validation';
import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCodebook } from '~/lib/interviewer/ducks/modules/protocol';
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

export const getBiologicalSexOptions = createSelector(
  getCodebook,
  getNodeType,
  getBiologicalSexVariable,
  (codebook, nodeType, sexVariable) => {
    const variable = (codebook as Codebook).node?.[nodeType]?.variables?.[
      sexVariable
    ];
    if (variable && 'options' in variable) {
      return variable.options as { label: string; value: string }[];
    }
    return [];
  },
);
