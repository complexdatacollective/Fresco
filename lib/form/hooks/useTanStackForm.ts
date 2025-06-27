import { createFormHook } from '@tanstack/react-form';
import Field from '~/lib/form/Field';

import { fieldContext, formContext } from '~/lib/form/utils/formContexts';

const { useAppForm: useTanStackForm } = createFormHook({
  fieldComponents: {
    Field,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useTanStackForm };
