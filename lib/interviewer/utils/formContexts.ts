import type { Variable } from '@codaco/protocol-validation';
import type { NcEdge, NcEgo, NcNode } from '@codaco/shared-consts';
import { createFormHookContexts } from '@tanstack/react-form';

export type ValidationContext = {
  codebookVariables: Record<string, Variable>;
  networkEntities: (NcNode | NcEdge | NcEgo)[];
};

const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export { fieldContext, formContext, useFieldContext, useFormContext };
