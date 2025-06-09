import { createFormHookContexts } from '@tanstack/react-form';

const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export { fieldContext, formContext, useFieldContext, useFormContext };
