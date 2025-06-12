import type { Variable } from '@codaco/protocol-validation';
import type { NcEdge, NcEgo, NcNode } from '@codaco/shared-consts';
import { createFormHookContexts } from '@tanstack/react-form';

export type ValidationContext = {
  codebookVariables: Record<string, Variable>;
  networkEntities: (NcNode | NcEdge | NcEgo)[];
  currentEntityId?: string;
};

// Enhanced form context that includes validation context
export type EnhancedFormContext = {
  validationContext: ValidationContext;
};

// Enhanced field context for field-level validation needs
export type EnhancedFieldContext = {
  fieldName: string;
  variable?: Variable;
  validationContext: ValidationContext;
};

const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export { fieldContext, formContext, useFieldContext, useFormContext };
