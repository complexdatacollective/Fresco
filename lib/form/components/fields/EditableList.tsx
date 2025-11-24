import {
  type FieldControlProps,
  type FieldRootState,
} from '@base-ui-components/react/field';
import { Reorder } from 'motion/react';
import { forwardRef } from 'react';
import Button from '~/components/ui/Button';

type CustomFieldProps = {
  state: FieldRootState;
} & FieldControlProps;

export const EditableListField = forwardRef((props: CustomFieldProps, ref) => {
  const { value = [], state, onChange, onBlur, onFocus, ...rest } = props;

  const { dirty, disabled, filled, focused, invalid, valid } = state;

  // When items changes, call onChange.
  const handleChange = () => {
    onChange({ target: { value } });
  };

  const handleAddItem = () => {
    const newItem = `Item ${value.length + 1}`;
    const newValue = [...value, newItem];
    onChange({ target: { value: newValue } });
  };

  return (
    <>
      <Reorder.Group axis="y" values={value} onReorder={handleChange}>
        {value?.map((item) => (
          <Reorder.Item key={item} value={item}>
            {item}
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <Button onClick={handleAddItem}>Add Item</Button>
    </>
  );
});

EditableListField.displayName = 'EditableField';
