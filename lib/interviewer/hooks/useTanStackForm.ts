import { createFormHook } from '@tanstack/react-form';
import Field from '../containers/TanStackForms/Field';

import {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
} from '../utils/formContexts';

export { fieldContext, formContext, useFieldContext, useFormContext };

const { useAppForm: useTanStackForm } = createFormHook({
  fieldComponents: {
    Field,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useTanStackForm };
