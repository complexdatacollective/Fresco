import { createFormHook } from '@tanstack/react-form';
import Field from '../containers/TanStackForms/Field';

import {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
  type ValidationContext,
} from '../utils/formContexts';

export { fieldContext, formContext, useFieldContext, useFormContext, type ValidationContext };

const { useAppForm: useTanStackForm } = createFormHook({
  fieldComponents: {
    Field,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useTanStackForm };
