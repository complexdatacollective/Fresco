import { useContext } from 'react';
import { useStore } from 'zustand';
import { type FormStore } from '../store/formStore';
import { FormStoreContext } from '../store/formStoreProvider';

const useFormStoreSelector = <T,>(selector: (store: FormStore) => T): T => {
  const formStoreContext = useContext(FormStoreContext);

  if (!formStoreContext) {
    throw new Error(
      'useFormStoreSelector must be used within FormStoreProvider',
    );
  }

  return useStore(formStoreContext, selector);
};

export default useFormStoreSelector;
