import { useCallback } from 'react';
import { getFormStore } from '../store/formStore';
import { useFormName } from '../context/FormNameContext';

export type FieldArrayItem = {
  id: string;
  index: number;
};

export function useFieldArray(name: string) {
  const formName = useFormName();
  const store = getFormStore();

  const values = store.getState().getFormValues(formName);
  const arrayValue = (values[name] as unknown[]) || [];

  // Generate field items with stable IDs
  const fields: FieldArrayItem[] = arrayValue.map((_, index: number) => ({
    id: `${name}.${index}`,
    index,
  }));

  const append = useCallback(
    (value: unknown) => {
      const currentValues = store.getState().getFormValues(formName);
      const currentArray = (currentValues[name] as unknown[]) || [];
      const newArray = [...currentArray, value];
      const newIndex = newArray.length - 1;

      store.getState().setValue(formName, name, newArray);
      store.getState().setDirty(formName, name, true);

      // Register the new field
      store.getState().registerField(formName, `${name}.${newIndex}`, {
        initialValue: value,
      });
    },
    [formName, name, store],
  );

  const remove = useCallback(
    (index: number) => {
      const currentValues = store.getState().getFormValues(formName);
      const currentArray = (currentValues[name] as unknown[]) || [];

      if (index < 0 || index >= currentArray.length) return;

      // Unregister the field being removed
      store.getState().unregisterField(formName, `${name}.${index}`);

      // Remove the item
      const newArray = currentArray.filter((_, i) => i !== index);
      store.getState().setValue(formName, name, newArray);
      store.getState().setDirty(formName, name, true);

      // Re-register fields with updated indices
      newArray.forEach((item: unknown, newIndex: number) => {
        const oldFieldName = `${name}.${newIndex >= index ? newIndex + 1 : newIndex}`;
        const newFieldName = `${name}.${newIndex}`;

        if (newIndex >= index) {
          store.getState().unregisterField(formName, oldFieldName);
          store.getState().registerField(formName, newFieldName, {
            initialValue: item,
          });
        }
      });
    },
    [formName, name, store],
  );

  const move = useCallback(
    (from: number, to: number) => {
      const currentValues = store.getState().getFormValues(formName);
      const currentArray = (currentValues[name] as unknown[]) || [];

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

      store.getState().setValue(formName, name, newArray);
      store.getState().setDirty(formName, name, true);

      // Re-register all fields with updated indices
      currentArray.forEach((_: unknown, index: number) => {
        store.getState().unregisterField(formName, `${name}.${index}`);
      });

      newArray.forEach((item: unknown, index: number) => {
        store.getState().registerField(formName, `${name}.${index}`, {
          initialValue: item,
        });
      });
    },
    [formName, name, store],
  );

  const insert = useCallback(
    (index: number, value: unknown) => {
      const currentValues = store.getState().getFormValues(formName);
      const currentArray = (currentValues[name] as unknown[]) || [];

      if (index < 0 || index > currentArray.length) return;

      const newArray = [...currentArray];
      newArray.splice(index, 0, value);

      store.getState().setValue(formName, name, newArray);
      store.getState().setDirty(formName, name, true);

      // Re-register fields from the insertion point onwards
      for (let i = index; i < currentArray.length; i++) {
        store.getState().unregisterField(formName, `${name}.${i}`);
      }

      for (let i = index; i < newArray.length; i++) {
        store.getState().registerField(formName, `${name}.${i}`, {
          initialValue: newArray[i],
        });
      }
    },
    [formName, name, store],
  );

  const swap = useCallback(
    (indexA: number, indexB: number) => {
      const currentValues = store.getState().getFormValues(formName);
      const currentArray = (currentValues[name] as unknown[]) || [];

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

      store.getState().setValue(formName, name, newArray);
      store.getState().setDirty(formName, name, true);

      // Update the swapped fields
      store.getState().unregisterField(formName, `${name}.${indexA}`);
      store.getState().unregisterField(formName, `${name}.${indexB}`);

      store.getState().registerField(formName, `${name}.${indexA}`, {
        initialValue: newArray[indexA],
      });
      store.getState().registerField(formName, `${name}.${indexB}`, {
        initialValue: newArray[indexB],
      });
    },
    [formName, name, store],
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
