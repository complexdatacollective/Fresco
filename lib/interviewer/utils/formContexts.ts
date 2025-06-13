import type { Variable } from '@codaco/protocol-validation';
import type { NcEdge, NcEgo, NcNode } from '@codaco/shared-consts';
import { createFormHookContexts } from '@tanstack/react-form';

export type ValidationContext = {
  codebookVariables: Record<string, Variable>;
  networkEntities: (NcNode | NcEdge | NcEgo)[];
  currentEntityId?: string;
};

const { fieldContext, useFieldContext, formContext } = createFormHookContexts();

export { fieldContext, formContext, useFieldContext };
