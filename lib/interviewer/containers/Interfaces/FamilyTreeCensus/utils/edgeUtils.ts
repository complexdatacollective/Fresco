import { createSelector } from "@reduxjs/toolkit";
import { invariant } from "es-toolkit";
import { getCurrentStage } from "~/lib/interviewer/selectors/session";

export const getRelationshipTypeVariable = createSelector(getCurrentStage, (stage) => {
  invariant(
    stage.type === 'FamilyTreeCensus',
    'Stage must be FamilyTreeCensus',
  );

  return stage.relationshipTypeVariable;
});