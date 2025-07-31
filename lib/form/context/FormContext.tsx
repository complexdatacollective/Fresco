import { createContext, useContext } from 'react';
import type { FormErrors } from '../types';

type FormContextValue<TContext = unknown> = {
  formName: string;
  additionalContext?: TContext;
  focusFirstInput?: boolean;
  errors: FormErrors;
};

export const FormContext = createContext<FormContextValue<any> | null>(null);

export function useFormContext<
  TContext = unknown,
>(): FormContextValue<TContext> {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context as FormContextValue<TContext>;
}
