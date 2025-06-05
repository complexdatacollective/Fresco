import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import Field from '../containers/TanStackForms/Field';
const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export { fieldContext, formContext, useFieldContext, useFormContext };

const { useAppForm } = createFormHook({
  fieldComponents: {
    Field,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useAppForm };
