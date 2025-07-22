import { createFormHook } from '@tanstack/react-form';

import { fieldContext, formContext } from '~/lib/form/utils/formContexts';

const { useAppForm: useTanStackForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
});

export { useTanStackForm };
