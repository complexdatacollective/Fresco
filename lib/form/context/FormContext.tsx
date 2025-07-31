import { createContext, useContext } from 'react';

type FormContextValue = {
  formName: string;
  fieldContext: any;
  focusFirstInput?: boolean;
};

export const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context;
}
