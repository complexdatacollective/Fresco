import { createFormHook } from '@tanstack/react-form';
import Field from '../../containers/TanStackForm/Field';

import { fieldContext, formContext } from '../../utils/formContexts';

const { useAppForm: useTanStackForm } = createFormHook({
  fieldComponents: {
    Field,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useTanStackForm };
