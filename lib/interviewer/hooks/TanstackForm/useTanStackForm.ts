import { createFormHook } from '@tanstack/react-form';
import Field from '../../containers/TanStackForm/Field';

import {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
  type ValidationContext,
} from '../../utils/formContexts';

export {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
  type ValidationContext,
};

const { useAppForm: useTanStackForm } = createFormHook({
  fieldComponents: {
    Field,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useTanStackForm };
