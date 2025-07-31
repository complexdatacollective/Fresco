import { useCallback } from 'react';
import { useFormStore } from '../store/formStore';
import { useFormContext } from '../context/FormContext';
import type { ValidationContext } from '../types';

export type FieldArrayItem = {
  id: string;
  index: number;
};

export function useFieldArray(name: string) {
  const formContext = useFormContext();
  const formName = formContext.formName;

  const {
    getFormValues,
    setValue,
    setDirty,
    validateField,
    registerField,
    unregisterField,
  } = useFormStore();

  const values = getFormValues(formName);
  const arrayValue = values[name] || [];

  // Generate field items with stable IDs
  const fields: FieldArrayItem[] = arrayValue.map((_, index: number) => ({
    id: `${name}.${index}`,
    index,
  }));

  const append = useCallback(
    (value: any) => {
      const currentValues = getFormValues(formName);
      const currentArray = currentValues[name] || [];
      const newArray = [...currentArray, value];
      const newIndex = newArray.length - 1;

      setValue(formName, name, newArray);
      setDirty(formName, name, true);

      // Register the new field
      registerField(formName, `${name}.${newIndex}`, {
        initialValue: value,
      });
    },
    [formName, name, setValue, setDirty, registerField, getFormValues],
  );

  const remove = useCallback(
    (index: number) => {
      const currentValues = getFormValues(formName);
      const currentArray = currentValues[name] || [];

      if (index < 0 || index >= currentArray.length) return;

      // Unregister the field being removed
      unregisterField(formName, `${name}.${index}`);

      // Remove the item
      const newArray = currentArray.filter((_, i) => i !== index);
      setValue(formName, name, newArray);
      setDirty(formName, name, true);

      // Re-register fields with updated indices
      newArray.forEach((item, newIndex) => {
        const oldFieldName = `${name}.${newIndex >= index ? newIndex + 1 : newIndex}`;
        const newFieldName = `${name}.${newIndex}`;

        if (newIndex >= index) {
          unregisterField(formName, oldFieldName);
          registerField(formName, newFieldName, {
            initialValue: item,
          });
        }
      });
    },
    [
      formName,
      name,
      setValue,
      setDirty,
      registerField,
      unregisterField,
      getFormValues,
    ],
  );

  const move = useCallback(
    (from: number, to: number) => {
      const currentValues = getFormValues(formName);
      const currentArray = currentValues[name] || [];

      if (
        from < 0 ||
        from >= currentArray.length ||
        to < 0 ||
        to >= currentArray.length
      ) {
        return;
      }

      const newArray = [...currentArray];
      const [moved] = newArray.splice(from, 1);
      newArray.splice(to, 0, moved);

      setValue(formName, name, newArray);
      setDirty(formName, name, true);

      // Re-register all fields with updated indices
      currentArray.forEach((_, index) => {
        unregisterField(formName, `${name}.${index}`);
      });

      newArray.forEach((item, index) => {
        registerField(formName, `${name}.${index}`, {
          initialValue: item,
        });
      });
    },
    [
      formName,
      name,
      setValue,
      setDirty,
      registerField,
      unregisterField,
      getFormValues,
    ],
  );

  const insert = useCallback(
    (index: number, value: any) => {
      const currentValues = getFormValues(formName);
      const currentArray = currentValues[name] || [];

      if (index < 0 || index > currentArray.length) return;

      const newArray = [...currentArray];
      newArray.splice(index, 0, value);

      setValue(formName, name, newArray);
      setDirty(formName, name, true);

      // Re-register fields from the insertion point onwards
      for (let i = index; i < currentArray.length; i++) {
        unregisterField(formName, `${name}.${i}`);
      }

      for (let i = index; i < newArray.length; i++) {
        registerField(formName, `${name}.${i}`, {
          initialValue: newArray[i],
        });
      }
    },
    [
      formName,
      name,
      setValue,
      setDirty,
      registerField,
      unregisterField,
      getFormValues,
    ],
  );

  const swap = useCallback(
    (indexA: number, indexB: number) => {
      const currentValues = getFormValues(formName);
      const currentArray = currentValues[name] || [];

      if (
        indexA < 0 ||
        indexA >= currentArray.length ||
        indexB < 0 ||
        indexB >= currentArray.length ||
        indexA === indexB
      ) {
        return;
      }

      const newArray = [...currentArray];
      [newArray[indexA], newArray[indexB]] = [
        newArray[indexB],
        newArray[indexA],
      ];

      setValue(formName, name, newArray);
      setDirty(formName, name, true);

      // Update the swapped fields
      unregisterField(formName, `${name}.${indexA}`);
      unregisterField(formName, `${name}.${indexB}`);

      registerField(formName, `${name}.${indexA}`, {
        initialValue: newArray[indexA],
      });
      registerField(formName, `${name}.${indexB}`, {
        initialValue: newArray[indexB],
      });
    },
    [
      formName,
      name,
      setValue,
      setDirty,
      registerField,
      unregisterField,
      getFormValues,
    ],
  );

  return {
    fields,
    append,
    remove,
    move,
    insert,
    swap,
  };
}
